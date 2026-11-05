import { SettingsContent } from '@/features/settings/SettingsContent';
import { usePageTitle } from '@/hooks/usePageTitle';

export function SettingsPage() {
  usePageTitle('Settings');
  return <SettingsContent />;
}
