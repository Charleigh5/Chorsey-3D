// components/TaskListSkeleton.tsx
import React from 'react';

export const TaskListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-gray-800 rounded-lg shadow-lg animate-pulse" aria-hidden="true">
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