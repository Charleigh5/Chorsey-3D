// App.test.tsx
import { describe, test, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import App from './App';
import * as authService from './services/authService';
import * as apiService from './services/mockApiService';
import { UserRole } from './types';

// Mock the services
jest.mock('./services/authService');
jest.mock('./services/mockApiService');

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();

    // Setup default mock implementations
    mockedAuthService.login.mockResolvedValue({
      id: 'user-1',
      name: 'Alex',
      email: 'admin@chorsey.com',
      role: UserRole.ADMIN,
      avatarUrl: 'https://picsum.photos/seed/alex/100/100',
      points: 1250,
    });

    mockedApiService.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Alex',
      email: 'admin@chorsey.com',
      role: UserRole.ADMIN,
      avatarUrl: 'https://picsum.photos/seed/alex/100/100',
      points: 1250,
    });
    
    // Mock task fetching to prevent errors in child components
    mockedApiService.fetchAllTasks.mockResolvedValue([]);
  });

  test('should render Auth component when no user is logged in', async () => {
    const { container } = render(<App />);
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    
    // Check for accessibility violations on the initial auth screen
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should render dashboard when a user is logged in via localStorage', async () => {
    localStorage.setItem('userId', 'user-1');
    const { container } = render(<App />);

    // It should fetch the user and render the dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /All Tasks/i })).toBeInTheDocument();
    });
    
    expect(screen.queryByRole('heading', { name: /Sign In/i })).not.toBeInTheDocument();
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
