import { BarChart3, CheckSquare, FileText, FolderKanban, LayoutDashboard, Settings, Users } from 'lucide-react';

export const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Bids', path: '/bids', icon: BarChart3 },
  { label: 'Projects', path: '/projects', icon: FolderKanban, count: '14' },
  { label: 'Work Requests', path: '/work-requests', icon: CheckSquare, count: '63' },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Organization', path: '/organization', icon: Users },
  { label: 'Reports', path: '/reports', icon: BarChart3, disabled: true },
  { label: 'Settings', path: '/settings', icon: Settings },
];
