
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Converts a File object to a base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // result is "data:mime/type;base64,..."
            // We need to remove the prefix
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};


export interface AIGeneratedTask {
    title: string;
    description: string;
}

/**
 * Sends an image to the Gemini API to generate a task title and description.
 * @param file The image file to analyze.
 * @returns A promise that resolves with the generated task details.
 */
export const generateTaskFromImage = async (file: File): Promise<AIGeneratedTask> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured. Please ensure it is set up correctly.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const base64Data = await fileToBase64(file);
        
        const imagePart = {
            inlineData: {
                mimeType: file.type,
                data: base64Data,
            },
        };

        const textPart = {
            text: 'Analyze the attached image of a household area. Identify a primary chore that needs to be done. Suggest a concise, clear title for the chore and a brief, one-sentence description. The tone should be neutral and direct.',
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "A short, clear title for the chore.",
                        },
                        description: {
                            type: Type.STRING,
                            description: "A brief, one-sentence description of what needs to be done.",
                        }
                    },
                    required: ["title", "description"],
                },
            },
        });

        let jsonString = response.text.trim();
        // The API might return JSON wrapped in markdown-style code blocks.
        // This regex safely extracts the JSON content.
        const match = jsonString.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
            jsonString = match[1];
        }

        const parsedResponse = JSON.parse(jsonString);

        if (typeof parsedResponse.title !== 'string' || typeof parsedResponse.description !== 'string') {
            throw new Error("AI response was not in the expected format.");
        }

        return parsedResponse;

    } catch (error) {
        console.error("Error generating task from image:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Could not parse the AI's response. Please try again.");
        }
        throw new Error("Could not analyze the image. Please try another one or enter the task manually.");
    }
};