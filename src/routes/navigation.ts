import { BarChart3, CheckSquare, FileText, FolderKanban, LayoutDashboard, Settings, Users } from 'lucide-react';

export const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Bids', path: '/dashboard#bids', icon: BarChart3, count: '9' },
  { label: 'Projects', path: '/projects', icon: FolderKanban, count: '14' },
  { label: 'Work Requests', path: '/work-requests', icon: CheckSquare, count: '63' },
  { label: 'Documents', path: '/dashboard#documents', icon: FileText },
  { label: 'Organization', path: '/team', icon: Users },
  { label: 'Reports', path: '/dashboard#reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];
