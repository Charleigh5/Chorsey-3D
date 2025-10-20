// components/CreateTaskForm.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CreateTaskForm } from './CreateTaskForm';
import * as apiService from '../services/mockApiService';

// Mock the service
jest.mock('../services/mockApiService');

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('CreateTaskForm Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedApiService.fetchAllUsers.mockClear();
    mockedApiService.fetchAllAssets.mockClear();
  });

  test('should have no accessibility violations after loading data', async () => {
    const { container } = render(<CreateTaskForm onTaskCreated={jest.fn()} />);

    // Wait for the form to populate from the mocked service calls
    await waitFor(() => {
      expect(screen.getByLabelText(/Assign To/i)).toHaveValue('user-1');
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
