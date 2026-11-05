import { useState } from 'react';

export type SettingsStatusFilter = 'all' | 'active' | 'inactive';
export type StatusConfirmation = { name: string; isActive: boolean; onConfirm: () => void };

/** Shared Settings workspace controls; feature data remains in its feature. */
export function useSettingsWorkspace() {
  const [settingsSearch, setSettingsSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SettingsStatusFilter>('active');
  const [settingsPage, setSettingsPage] = useState(1);
  const [statusConfirmation, setStatusConfirmation] = useState<StatusConfirmation | null>(null);
  const requestStatusChange = (name: string, isActive: boolean, onConfirm: () => void) => setStatusConfirmation({ name, isActive, onConfirm });
  return { settingsSearch, setSettingsSearch, statusFilter, setStatusFilter, settingsPage, setSettingsPage, statusConfirmation, setStatusConfirmation, requestStatusChange };
}
