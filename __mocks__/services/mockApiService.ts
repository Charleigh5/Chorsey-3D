// __mocks__/services/mockApiService.ts
import { jest } from '@jest/globals';
import { UserRole, TaskStatus, type User, type AssetInstance, type Task, type TaskWithDetails } from '../../types';

export const fetchAllUsers = jest.fn((): Promise<User[]> => Promise.resolve([
    { id: 'user-1', name: 'Alex', email: 'alex@example.com', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/seed/alex/100/100', points: 1250 },
    { id: 'user-2', name: 'Sam', email: 'sam@example.com', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/seed/sam/100/100', points: 800 },
]));

export const fetchAllAssets = jest.fn((): Promise<AssetInstance[]> => Promise.resolve([
    { id: 'asset-1', name: 'Kitchen Counter', assetTemplateId: 'template-counter' },
    { id: 'asset-2', name: 'Living Room TV', assetTemplateId: 'template-tv' },
]));

export const createTask = jest.fn((taskData: Omit<Task, 'id' | 'status'>): Promise<Task> => Promise.resolve({
    ...taskData,
    id: `task-${Date.now()}`,
    status: TaskStatus.PENDING,
}));


export const getCurrentUser = jest.fn((userId: string): Promise<User> => {
    if (userId === 'user-1') {
        return Promise.resolve({ id: 'user-1', name: 'Alex', email: 'admin@chorsey.com', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/seed/alex/100/100', points: 1250 });
    }
    if (userId === 'user-2') {
        return Promise.resolve({ id: 'user-2', name: 'Sam', email: 'user@chorsey.com', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/seed/sam/100/100', points: 800 });
    }
    return Promise.reject(new Error('User not found in mock'));
});

const mockTasks: TaskWithDetails[] = [
  {
    id: 'task-1',
    title: 'Mock Task: Wipe counters',
    description: 'A mock task for testing.',
    points: 50,
    status: TaskStatus.SUBMITTED,
    assignedTo: 'user-1',
    assignedUser: { id: 'user-1', name: 'Alex', email: 'admin@chorsey.com', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/seed/alex/100/100', points: 1250 },
    assignedAsset: { id: 'asset-1', name: 'Kitchen Counter', assetTemplateId: 'template-counter' },
  },
  {
    id: 'task-2',
    title: 'Mock Task: Clean TV',
    description: 'A mock task for testing participants.',
    points: 25,
    status: TaskStatus.PENDING,
    assignedTo: 'user-2',
    assignedUser: { id: 'user-2', name: 'Sam', email: 'user@chorsey.com', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/seed/sam/100/100', points: 800 },
    assignedAsset: { id: 'asset-2', name: 'Living Room TV', assetTemplateId: 'template-tv' },
  }
];

export const fetchTasksForUser = jest.fn((userId: string): Promise<TaskWithDetails[]> => {
    return Promise.resolve(mockTasks.filter(t => t.assignedTo === userId));
});

export const fetchAllTasks = jest.fn((): Promise<TaskWithDetails[]> => {
    return Promise.resolve(mockTasks);
});