export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum UserRole {
  ADMIN = 'ADMINISTRATOR',
  PARTICIPANT = 'PARTICIPANT',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  points: number;
}

export interface AssetInstance {
  id: string;
  name: string;
  assetTemplateId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  status: TaskStatus;
  assignedTo: string; // User ID
  assignedAssetId?: string; // AssetInstance ID
}

// A convenient combined type for UI rendering
export interface TaskWithDetails extends Task {
  assignedUser: User;
  assignedAsset?: AssetInstance;
}
