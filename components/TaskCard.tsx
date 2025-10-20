
import React from 'react';
import type { TaskWithDetails } from '../types';
import { TaskStatus } from '../types';
import { CoinIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';

interface TaskCardProps {
  task: TaskWithDetails;
}

const statusConfig = {
  [TaskStatus.PENDING]: {
    label: 'Pending',
    icon: <ClockIcon className="w-4 h-4" />,
    badgeClasses: 'bg-gray-500 text-white',
    buttonLabel: 'Start Task',
    buttonClasses: 'bg-cyan-500 hover:bg-cyan-600 text-white',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: <ClockIcon className="w-4 h-4" />,
    badgeClasses: 'bg-blue-500 text-white',
    buttonLabel: 'Submit for Review',
    buttonClasses: 'bg-indigo-500 hover:bg-indigo-600 text-white',
  },
  [TaskStatus.SUBMITTED]: {
    label: 'Submitted',
    icon: <CheckCircleIcon className="w-4 h-4" />,
    badgeClasses: 'bg-purple-500 text-white',
    buttonLabel: 'Awaiting Review',
    buttonClasses: 'bg-gray-500 cursor-not-allowed text-gray-300',
  },
  [TaskStatus.APPROVED]: {
    label: 'Approved',
    icon: <CheckCircleIcon className="w-4 h-4" />,
    badgeClasses: 'bg-green-600 text-white',
    buttonLabel: 'Completed',
    buttonClasses: 'bg-green-600 cursor-not-allowed text-white',
  },
  [TaskStatus.REJECTED]: {
    label: 'Rejected',
    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
    badgeClasses: 'bg-red-600 text-white',
    buttonLabel: 'Try Again',
    buttonClasses: 'bg-red-500 hover:bg-red-600 text-white',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const config = statusConfig[task.status];

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-[1.02] duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-lg font-bold text-white leading-tight">{task.title}</h3>
          <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full flex-shrink-0">
            <CoinIcon className="w-5 h-5" />
            <span className="font-bold">{task.points}</span>
          </div>
        </div>
        
        {task.assignedAsset && (
          <p className="text-xs text-cyan-400 font-mono mt-1">
            Location: {task.assignedAsset.name}
          </p>
        )}

        <p className="text-sm text-gray-400 mt-3 h-10 overflow-hidden">{task.description}</p>
      </div>

      <div className="bg-gray-700/50 px-5 py-3 flex justify-between items-center">
        <div className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${config.badgeClasses}`}>
          {config.icon}
          {config.label}
        </div>
        <button
          className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 ${config.buttonClasses}`}
          disabled={task.status === TaskStatus.SUBMITTED || task.status === TaskStatus.APPROVED}
        >
          {config.buttonLabel}
        </button>
      </div>
    </div>
  );
};
