import { UserRole, type User } from '../types';

// This is a mock database of users. In a real application, this would be a secure database.
const users: User[] = [
    { id: 'user-1', name: 'Alex', email: 'admin@chorsey.com', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/seed/alex/100/100', points: 1250 },
    { id: 'user-2', name: 'Sam', email: 'user@chorsey.com', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/seed/sam/100/100', points: 800 },
];

export const login = async (email: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            // In a real app, you would validate the password hash.
            // Here, we just check if the user exists.
            if (user) {
                resolve(user);
            } else {
                reject(new Error('Invalid email or password.'));
            }
        }, 1000);
    });
};

export const register = async (name: string, email: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                reject(new Error('An account with this email already exists.'));
            } else {
                const newUser: User = {
                    id: `user-${users.length + 1}`,
                    name,
                    email,
                    role: UserRole.ADMIN, // First user of a new "household" defaults to admin
                    avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
                    points: 0,
                };
                users.push(newUser);
                resolve(newUser);
            }
        }, 1000);
    });
};