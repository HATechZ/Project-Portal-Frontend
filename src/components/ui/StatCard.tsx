import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, caption, icon: Icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card__icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </article>
  );
}
