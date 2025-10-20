import { TaskStatus, UserRole, type User, type AssetInstance, type Task, type TaskWithDetails } from '../types';

const mockUsers: User[] = [
  { id: 'user-1', name: 'Alex', email: 'alex@example.com', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/seed/alex/100/100', points: 1250 },
  { id: 'user-2', name: 'Sam', email: 'sam@example.com', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/seed/sam/100/100', points: 800 },
];

const mockAssets: AssetInstance[] = [
  { id: 'asset-1', name: 'Kitchen Counter', assetTemplateId: 'template-counter' },
  { id: 'asset-2', name: 'Living Room TV', assetTemplateId: 'template-tv' },
  { id: 'asset-3', name: 'Bedroom Floor', assetTemplateId: 'template-floor' },
  { id: 'asset-4', name: 'Dishwasher', assetTemplateId: 'template-dishwasher' },
];

let mockTasks: Task[] = [
  { id: 'task-1', title: 'Wipe down kitchen counters', description: 'Use the all-purpose cleaner under the sink.', points: 50, status: TaskStatus.APPROVED, assignedTo: 'user-1', assignedAssetId: 'asset-1' },
  { id: 'task-2', title: 'Empty the dishwasher', description: 'Put all clean dishes away in the correct cabinets.', points: 75, status: TaskStatus.SUBMITTED, assignedTo: 'user-1', assignedAssetId: 'asset-4' },
  { id: 'task-3', title: 'Vacuum the bedroom', description: 'Make sure to get under the bed and behind the dresser.', points: 100, status: TaskStatus.IN_PROGRESS, assignedTo: 'user-1', assignedAssetId: 'asset-3' },
  { id: 'task-4', title: 'Clean the TV screen', description: 'Use a microfiber cloth. No harsh chemicals!', points: 25, status: TaskStatus.PENDING, assignedTo: 'user-2', assignedAssetId: 'asset-2' },
  { id: 'task-5', title: 'Organize the pantry', description: 'Group similar items together and check for expired goods.', points: 150, status: TaskStatus.REJECTED, assignedTo: 'user-2', assignedAssetId: undefined },
  { id: 'task-6', title: 'Water the plants', description: 'Living room and kitchen plants only.', points: 30, status: TaskStatus.PENDING, assignedTo: 'user-2', assignedAssetId: undefined },
  { id: 'task-7', title: 'Take out recycling', description: 'Blue bin goes out on Tuesday mornings.', points: 40, status: TaskStatus.IN_PROGRESS, assignedTo: 'user-1', assignedAssetId: undefined },
];

export const getCurrentUser = async (userId: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockUsers.find(u => u.id === userId);
            if (!user) {
                return reject(new Error('User not found'));
            }
            resolve(user);
        }, 500);
    });
};

export const fetchAllUsers = async (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockUsers);
        }, 500);
    });
};

export const fetchAllAssets = async (): Promise<AssetInstance[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockAssets);
        }, 500);
    });
};

export const createTask = async (taskData: Omit<Task, 'id' | 'status'>): Promise<Task> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newTask: Task = {
                ...taskData,
                id: `task-${Date.now()}`,
                status: TaskStatus.PENDING,
            };
            mockTasks.unshift(newTask); // Add to the beginning of the array
            resolve(newTask);
        }, 800);
    });
};

const enrichTasks = (tasks: Task[]): TaskWithDetails[] => {
    return tasks.map((task): TaskWithDetails | null => {
        const assignedUser = mockUsers.find(u => u.id === task.assignedTo);
        const assignedAsset = mockAssets.find(a => a.id === task.assignedAssetId);
        
        if (!assignedUser) return null;

        return {
          ...task,
          assignedUser,
          assignedAsset,
        };
      }).filter((t): t is TaskWithDetails => t !== null);
}

export const fetchTasksForUser = async (userId: string): Promise<TaskWithDetails[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) {
        return reject(new Error('User not found'));
      }
      const userTasks = mockTasks.filter(t => t.assignedTo === userId);
      resolve(enrichTasks(userTasks));
    }, 1000);
  });
};

export const fetchAllTasks = async (): Promise<TaskWithDetails[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(enrichTasks(mockTasks));
        }, 1000);
    });
};