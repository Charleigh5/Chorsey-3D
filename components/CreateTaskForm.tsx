
import React, { useState, useEffect } from 'react';
import { createTask, fetchAllUsers, fetchAllAssets } from '../services/mockApiService';
import { generateTaskFromImage } from '../services/geminiService';
import type { User, AssetInstance, Task } from '../types';
import { PlusCircleIcon, PhotoIcon, SparklesIcon } from './icons';

interface CreateTaskFormProps {
    onTaskCreated: () => void;
}

const initialFormState = {
    title: '',
    description: '',
    points: '50',
    assignedTo: '',
    assignedAssetId: '',
};

export const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [users, setUsers] = useState<User[]>([]);
    const [assets, setAssets] = useState<AssetInstance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // State for AI generation
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedUsers, fetchedAssets] = await Promise.all([
                    fetchAllUsers(),
                    fetchAllAssets(),
                ]);
                setUsers(fetchedUsers);
                setAssets(fetchedAssets);
                if (fetchedUsers.length > 0) {
                    setFormData(prev => ({ ...prev, assignedTo: fetchedUsers[0].id }));
                }
            } catch (err) {
                setError('Failed to load necessary data for form.');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setAiError("Image is too large. Please select a file under 4MB.");
                return;
            }
            setImageFile(file);
            setAiError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleGenerateClick = async () => {
        if (!imageFile) {
            setAiError('Please select an image first.');
            return;
        }
        setError(null); // Clear any previous submission errors
        setIsGenerating(true);
        setAiError(null);
        try {
            const result = await generateTaskFromImage(imageFile);
            setFormData(prev => ({
                ...prev,
                title: result.title,
                description: result.description,
            }));
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'Failed to generate task details.');
        } finally {
            setIsGenerating(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.title || !formData.assignedTo) {
            setError('Title and Assignee are required.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const taskData: Omit<Task, 'id' | 'status'> = {
                title: formData.title,
                description: formData.description,
                points: parseInt(formData.points, 10),
                assignedTo: formData.assignedTo,
                assignedAssetId: formData.assignedAssetId || undefined,
            };
            await createTask(taskData);
            setSuccess('Task created successfully!');
            setFormData(initialFormState);
            setImageFile(null);
            setImagePreview(null);
            onTaskCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 3000); // Clear success message after 3s
        }
    };

    return (
        <section aria-labelledby="create-task-heading">
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <div className="p-5 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <PlusCircleIcon className="w-7 h-7 text-cyan-400" />
                        <h2 id="create-task-heading" className="text-2xl font-bold text-white">
                            Create a New Task
                        </h2>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
                    </div>

                    <div className="space-y-3 pt-2 pb-2 border-y border-gray-700">
                        <label className="block text-sm font-medium text-gray-300">AI-Assisted Creation (Optional)</label>
                         <div className="flex items-center gap-4">
                            <label htmlFor="task-image-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-md inline-flex items-center gap-2 transition-colors">
                                <PhotoIcon className="w-5 h-5" />
                                <span>{imageFile ? "Change Image" : "Upload Image"}</span>
                            </label>
                            <input id="task-image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                             {imagePreview && (
                                <img src={imagePreview} alt="Task preview" className="w-12 h-12 rounded-md object-cover" />
                            )}
                        </div>
                        <button type="button" onClick={handleGenerateClick} disabled={isGenerating || !imageFile}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:bg-indigo-800 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                             <SparklesIcon className="w-5 h-5"/>
                            {isGenerating ? 'Generating...' : 'Generate with AI'}
                        </button>
                        {aiError && <p className="text-red-400 text-sm">{aiError}</p>}
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="points" className="block text-sm font-medium text-gray-300 mb-1">Points</label>
                           <input type="number" name="points" id="points" value={formData.points} onChange={handleChange} required min="0"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div>
                           <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                            <select name="assignedTo" id="assignedTo" value={formData.assignedTo} onChange={handleChange} required
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="assignedAssetId" className="block text-sm font-medium text-gray-300 mb-1">Assign to Asset (Optional)</label>
                        <select name="assignedAssetId" id="assignedAssetId" value={formData.assignedAssetId} onChange={handleChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            <option value="">None</option>
                            {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {success && <p className="text-green-400 text-sm">{success}</p>}

                    <div className="pt-2">
                        <button type="submit" disabled={loading}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:bg-cyan-700 disabled:cursor-not-allowed">
                            {loading ? 'Creating Task...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};