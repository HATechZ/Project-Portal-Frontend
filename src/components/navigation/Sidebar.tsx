import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness } from 'lucide-react';
import { navigationItems } from '@/routes/navigation';
import { getWorkRequests } from '@/services/workRequestService';
import { cx } from '@/utils/cx';

type SidebarProps = {
  collapsed: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed, mobileOpen = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const workRequestsQuery = useQuery({ queryKey: ['work-requests'], queryFn: getWorkRequests });

  function isCurrentItem(item: (typeof navigationItems)[number]) {
    const [path, hash = ''] = item.path.split('#');
    if (location.pathname !== path) return false;
    if (hash) return location.hash === `#${hash}`;
    return !location.hash;
  }

  return (
    <aside className={cx('sidebar', collapsed && 'sidebar--collapsed', mobileOpen && 'sidebar--mobile-open')}>
      <div className="brand">
        <span className="brand-mark">
          <BriefcaseBusiness size={18} />
        </span>
        {(!collapsed || mobileOpen) && (
          <span>
            <strong>Project Portal</strong>
            <small>Workflow Management</small>
          </span>
        )}
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const count = item.label === 'Work Requests'
            ? (workRequestsQuery.isLoading ? '…' : String(workRequestsQuery.data?.meta.total ?? 0))
            : item.count;

          return item.disabled ? (
          <span aria-disabled="true" className="nav-item nav-item--disabled" key={item.label} title="Reports are not available yet">
            <item.icon size={20} />
            {(!collapsed || mobileOpen) && <span>{item.label}</span>}
          </span>
          ) : (
          <NavLink
            key={item.label}
            to={item.path}
            className={cx('nav-item', isCurrentItem(item) && 'nav-item--active')}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            {(!collapsed || mobileOpen) && count !== undefined ? <small>{count}</small> : null}
          </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
