// __mocks__/services/geminiService.ts
import { jest } from '@jest/globals';
import type { AIGeneratedTask } from '../../services/geminiService';

export const generateTaskFromImage = jest.fn(async (file: File): Promise<AIGeneratedTask> => {
    // This is a default mock response. Tests can override it with mockResolvedValue.
    // The 'file' argument is available if a test needs to assert it was called correctly.
    return {
        title: 'Mock AI Title',
        description: 'Mock AI description based on the provided image.',
    };
});
