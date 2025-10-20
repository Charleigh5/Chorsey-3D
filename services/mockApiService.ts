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

const mockTasks: Task[] = [
  { id: 'task-1', title: 'Wipe down kitchen counters', description: 'Use the all-purpose cleaner under the sink.', points: 50, status: TaskStatus.APPROVED, assignedTo: 'user-1', assignedAssetId: 'asset-1' },
  { id: 'task-2', title: 'Empty the dishwasher', description: 'Put all clean dishes away in the correct cabinets.', points: 75, status: TaskStatus.SUBMITTED, assignedTo: 'user-1', assignedAssetId: 'asset-4' },
  { id: 'task-3', title: 'Vacuum the bedroom', description: 'Make sure to get under the bed and behind the dresser.', points: 100, status: TaskStatus.IN_PROGRESS, assignedTo: 'user-1', assignedAssetId: 'asset-3' },
  { id: 'task-4', title: 'Clean the TV screen', description: 'Use a microfiber cloth. No harsh chemicals!', points: 25, status: TaskStatus.PENDING, assignedTo: 'user-1', assignedAssetId: 'asset-2' },
  { id: 'task-5', title: 'Organize the pantry', description: 'Group similar items together and check for expired goods.', points: 150, status: TaskStatus.REJECTED, assignedTo: 'user-1', assignedAssetId: undefined },
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


export const fetchTasksForUser = async (userId: string): Promise<TaskWithDetails[]> => {
  console.log(`Fetching tasks for user: ${userId}`);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) {
        return reject(new Error('User not found'));
      }

      const userTasks = mockTasks.filter(t => t.assignedTo === userId);
      
      const tasksWithDetails: TaskWithDetails[] = userTasks.map(task => {
        const assignedAsset = mockAssets.find(a => a.id === task.assignedAssetId);
        return {
          ...task,
          assignedUser: user,
          assignedAsset,
        };
      });

      resolve(tasksWithDetails);
    }, 1000); // Simulate network delay
  });
};
