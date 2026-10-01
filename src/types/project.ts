export type ProjectStatus = 'planning' | 'in-progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type Project = {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  dueDate: string;
};

export type Task = {
  id: string;
  title: string;
  projectId: string;
  ownerId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  workload: number;
};
