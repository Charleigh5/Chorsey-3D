import React, { useState, useEffect } from 'react';
import { fetchTasksForUser, fetchAllTasks } from '../services/mockApiService';
import type { TaskWithDetails } from '../types';
import { UserRole } from '../types';
import { TaskCard } from './TaskCard';

const TaskListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-gray-800 rounded-lg shadow-lg animate-pulse">
         <div className="p-5">
            <div className="flex justify-between items-start">
              <div className="h-5 bg-gray-700 rounded w-3/4"></div>
              <div className="h-5 bg-gray-700 rounded w-1/6"></div>
            </div>
            <div className="h-3 bg-gray-700 rounded w-1/2 mt-3"></div>
            <div className="h-8 bg-gray-700 rounded w-full mt-4"></div>
        </div>
        <div className="h-12 bg-gray-700/50 rounded-b-lg"></div>
      </div>
    ))}
  </div>
);

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
      return <TaskListSkeleton />;
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
          <TaskCard key={task.id} task={task} showAssignee={isAdmin} />
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