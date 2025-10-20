// components/TaskList.test.tsx
import { describe, test, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TaskList } from './TaskList';
import * as apiService from '../services/mockApiService';
import { UserRole } from '../types';

// Mock the service
jest.mock('../services/mockApiService');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('TaskList Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render loading state initially', () => {
        mockedApiService.fetchAllTasks.mockReturnValue(new Promise(() => {})); // Never resolves
        render(<TaskList userId="user-1" userRole={UserRole.ADMIN} />);
        // The correct way to test the loading state is to check for the accessible status message.
        // The skeleton itself is aria-hidden and should not be queried directly by accessible roles.
        expect(screen.getByRole('status')).toHaveTextContent(/Loading tasks.../i);
    });
    
    test('should render tasks for an admin user', async () => {
        const { container } = render(<TaskList userId="user-1" userRole={UserRole.ADMIN} />);
        
        await waitFor(() => {
            expect(screen.getByText('Mock Task: Wipe counters')).toBeInTheDocument();
            expect(screen.getByText('Mock Task: Clean TV')).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('should render tasks for a participant user', async () => {
        render(<TaskList userId="user-2" userRole={UserRole.PARTICIPANT} />);
        
        await waitFor(() => {
            expect(screen.queryByText('Mock Task: Wipe counters')).not.toBeInTheDocument();
            expect(screen.getByText('Mock Task: Clean TV')).toBeInTheDocument();
        });
    });

    test('should display an error message if fetching fails', async () => {
        const errorMessage = 'Failed to connect to the server';
        mockedApiService.fetchAllTasks.mockRejectedValue(new Error(errorMessage));
        
        render(<TaskList userId="user-1" userRole={UserRole.ADMIN} />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    test('should display empty state message when no tasks are returned', async () => {
        mockedApiService.fetchAllTasks.mockResolvedValue([]);
        render(<TaskList userId="user-1" userRole={UserRole.ADMIN} />);
        
        await waitFor(() => {
            expect(screen.getByText('No tasks in the system yet.')).toBeInTheDocument();
        });
    });
});
