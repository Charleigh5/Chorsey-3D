// components/CreateTaskForm.test.tsx
import { describe, test, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CreateTaskForm } from './CreateTaskForm';
import * as apiService from '../services/mockApiService';
import * as geminiService from '../services/geminiService';

// Mock the services
jest.mock('../services/mockApiService');
jest.mock('../services/geminiService');

const mockedApiService = apiService as jest.Mocked<typeof apiService>;
const mockedGeminiService = geminiService as jest.Mocked<typeof geminiService>;


describe('CreateTaskForm Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedApiService.fetchAllUsers.mockClear();
    mockedApiService.fetchAllAssets.mockClear();
    mockedGeminiService.generateTaskFromImage.mockClear();

    // Provide a default mock implementation for the AI service
    mockedGeminiService.generateTaskFromImage.mockResolvedValue({
      title: 'AI Generated Title',
      description: 'AI Generated Description',
    });
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

  test('should call gemini service and populate fields on AI generate', async () => {
    render(<CreateTaskForm onTaskCreated={jest.fn()} />);

    // Wait for the initial user/asset data to load
    await waitFor(() => {
        expect(screen.getByLabelText(/Assign To/i)).toHaveValue('user-1');
    });
    
    // The file input is visually hidden, but we can find it by its associated label text
    const fileInput = screen.getByLabelText(/upload image/i, { selector: 'input' });
    const file = new File(['(⌐□_□)'], 'photo.png', { type: 'image/png' });
    
    // Simulate a user selecting a file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Find the "Generate with AI" button and click it
    const generateButton = screen.getByRole('button', { name: /generate with ai/i });
    expect(generateButton).not.toBeDisabled();
    fireEvent.click(generateButton);

    // Assert that the AI service was called with the file
    await waitFor(() => {
      expect(mockedGeminiService.generateTaskFromImage).toHaveBeenCalledWith(file);
    });

    // Assert that the title and description fields are populated with the mock response
    await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
        const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        expect(titleInput.value).toBe('AI Generated Title');
        expect(descriptionInput.value).toBe('AI Generated Description');
    });
  });
});
