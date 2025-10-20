import React, { useState, useEffect } from 'react';
import { fetchTasksForUser, fetchAllTasks } from '../services/mockApiService';
import type { TaskWithDetails } from '../types';
import { UserRole } from '../types';
import { TaskCard } from './TaskCard';
import { TaskListSkeleton } from './TaskListSkeleton';

interface TaskListProps {
  userId: string;
  userRole: UserRole;
}

export const TaskList: React.FC<TaskListProps> = ({ userId, userRole }) => {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRole === UserRole.ADMIN;

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTasks = isAdmin 
            ? await fetchAllTasks()
            : await fetchTasksForUser(userId);
        setTasks(fetchedTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [userId, userRole, isAdmin]);

  const renderContent = () => {
    if (loading) {
      return (
          <>
              {/* This element is visually hidden but read by screen readers */}
              <div role="status" className="sr-only">
                  Loading tasks...
              </div>
              <TaskListSkeleton />
          </>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
          <p className="font-semibold">Failed to load tasks</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
          <p>{isAdmin ? "No tasks in the system yet." : "No tasks assigned right now. Great job!"}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} showAssignee={isAdmin} userRole={userRole} />
        ))}
      </div>
    );
  };
  
  return (
    <section className="h-full" aria-labelledby="tasks-heading">
      <h2 id="tasks-heading" className="text-2xl font-bold text-white mb-4 px-1">
        {isAdmin ? "All Tasks" : "Your Tasks"}
      </h2>
      {renderContent()}
    </section>
  );
};