import { SettingsFeatureController } from '@/features/settings/SettingsFeatureController';

/**
 * Settings feature composition boundary. Feature tabs and their stateful
 * implementations are intentionally isolated from the page route.
 */
export function SettingsContent() {
  return <SettingsFeatureController />;
}
