// components/Header.test.tsx
// FIX: Import Jest's global functions to resolve TypeScript errors.
import { describe, test, expect, jest } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Header } from './Header';
import { UserRole } from '../types';

describe('Header Component', () => {
  test('should have no accessibility violations', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.PARTICIPANT,
      avatarUrl: 'https://picsum.photos/seed/test/100/100',
      points: 100,
    };
    const { container } = render(<Header user={mockUser} onLogout={jest.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});