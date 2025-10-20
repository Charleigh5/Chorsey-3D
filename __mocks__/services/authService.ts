// __mocks__/services/authService.ts
import { jest } from '@jest/globals';
import { UserRole, type User } from '../../types';

export const login = jest.fn(async (email: string): Promise<User> => {
    if (email.toLowerCase() === 'admin@chorsey.com') {
        return { id: 'user-1', name: 'Alex', email: 'admin@chorsey.com', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/seed/alex/100/100', points: 1250 };
    }
    if (email.toLowerCase() === 'user@chorsey.com') {
        return { id: 'user-2', name: 'Sam', email: 'user@chorsey.com', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/seed/sam/100/100', points: 800 };
    }
    throw new Error('Invalid email or password.');
});

export const register = jest.fn(async (name: string, email: string): Promise<User> => {
    // A simple mock for registration success
    return {
        id: `user-reg-${Date.now()}`,
        name,
        email,
        role: UserRole.PARTICIPANT,
        avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
        points: 0,
    };
});
