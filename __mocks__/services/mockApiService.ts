// __mocks__/services/mockApiService.ts
// FIX: Import `jest` from `@jest/globals` to make Jest's global functions available to TypeScript.
import { jest } from '@jest/globals';
import { UserRole } from '../types';

export const fetchAllUsers = jest.fn(() => Promise.resolve([
    { id: 'user-1', name: 'Alex', email: 'alex@example.com', role: UserRole.ADMIN, avatarUrl: '', points: 0 },
    { id: 'user-2', name: 'Sam', email: 'sam@example.com', role: UserRole.PARTICIPANT, avatarUrl: '', points: 0 },
]));

export const fetchAllAssets = jest.fn(() => Promise.resolve([
    { id: 'asset-1', name: 'Kitchen Counter', assetTemplateId: 'template-counter' },
    { id: 'asset-2', name: 'Living Room TV', assetTemplateId: 'template-tv' },
]));

export const createTask = jest.fn(() => Promise.resolve({
    id: 'new-task-1',
    title: 'New Mock Task',
    description: 'A task created from a test',
    points: 50,
    status: 'PENDING',
    assignedTo: 'user-1',
}));