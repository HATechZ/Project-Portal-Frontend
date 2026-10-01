import type { ProjectStatus, TaskPriority, TaskStatus } from '@/types/project';

type StatusBadgeProps = {
  value: ProjectStatus | TaskStatus | TaskPriority;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${value}`}>{value.replace('-', ' ')}</span>;
}
