import { DashboardWorkspace } from '@/features/dashboard/DashboardWorkspace';
import { usePageTitle } from '@/hooks/usePageTitle';

export function DashboardPage() {
  usePageTitle('Dashboard');
  return <DashboardWorkspace />;
}
