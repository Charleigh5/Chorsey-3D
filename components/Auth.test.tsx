// components/Auth.test.tsx
import { describe, test, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Auth } from './Auth';

describe('Auth Component', () => {
  test('should have no accessibility violations on login form', async () => {
    const { container } = render(<Auth onLoginSuccess={jest.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should have no accessibility violations on registration form', async () => {
    const { container } = render(<Auth onLoginSuccess={jest.fn()} />);
    
    // Switch to registration form
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});