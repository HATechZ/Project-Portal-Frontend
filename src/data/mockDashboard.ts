import type { Project, Task, TeamMember } from '@/types/project';

export const projects: Project[] = [
  {
    id: 'p-1001',
    name: 'Client Portal Redesign',
    client: 'Northwind',
    status: 'in-progress',
    progress: 68,
    budget: 42000,
    dueDate: '2026-09-18',
  },
  {
    id: 'p-1002',
    name: 'Mobile Field App',
    client: 'Contoso',
    status: 'review',
    progress: 84,
    budget: 68000,
    dueDate: '2026-10-04',
  },
  {
    id: 'p-1003',
    name: 'Analytics Workspace',
    client: 'Fabrikam',
    status: 'planning',
    progress: 24,
    budget: 53000,
    dueDate: '2026-11-12',
  },
  {
    id: 'p-1004',
    name: 'Support Automation',
    client: 'Adventure Works',
    status: 'completed',
    progress: 100,
    budget: 31000,
    dueDate: '2026-08-15',
  },
];

export const tasks: Task[] = [
  {
    id: 't-2001',
    title: 'Finalize dashboard wireframes',
    projectId: 'p-1001',
    ownerId: 'u-3001',
    status: 'done',
    priority: 'medium',
    dueDate: '2026-08-21',
  },
  {
    id: 't-2002',
    title: 'Integrate sprint burndown API',
    projectId: 'p-1002',
    ownerId: 'u-3002',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-08-28',
  },
  {
    id: 't-2003',
    title: 'Prepare stakeholder review deck',
    projectId: 'p-1001',
    ownerId: 'u-3003',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-09-02',
  },
  {
    id: 't-2004',
    title: 'Define access control matrix',
    projectId: 'p-1003',
    ownerId: 'u-3004',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-09-10',
  },
];

export const teamMembers: TeamMember[] = [
  { id: 'u-3001', name: 'Ayesha Rahman', role: 'Product Designer', avatarInitials: 'AR', workload: 72 },
  { id: 'u-3002', name: 'Imran Hossain', role: 'Frontend Engineer', avatarInitials: 'IH', workload: 86 },
  { id: 'u-3003', name: 'Nadia Karim', role: 'Project Manager', avatarInitials: 'NK', workload: 64 },
  { id: 'u-3004', name: 'Samiul Islam', role: 'Backend Engineer', avatarInitials: 'SI', workload: 58 },
];
