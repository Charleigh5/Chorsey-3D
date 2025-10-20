// components/TaskCard.test.tsx
// FIX: Import Jest's global functions to resolve TypeScript errors.
import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TaskCard } from './TaskCard';
import { TaskStatus, UserRole, type TaskWithDetails } from '../types';

const mockTask: TaskWithDetails = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test description.',
  points: 100,
  status: TaskStatus.PENDING,
  assignedTo: 'user-1',
  assignedUser: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.PARTICIPANT,
    avatarUrl: 'https://picsum.photos/seed/test/100/100',
    points: 0,
  },
};

describe('TaskCard Component', () => {
  test('should have no accessibility violations in default view', async () => {
    const { container } = render(<TaskCard task={mockTask} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should have no accessibility violations in assignee view', async () => {
    const { container } = render(<TaskCard task={mockTask} showAssignee={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});