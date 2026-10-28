import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness } from 'lucide-react';
import { navigationItems } from '@/routes/navigation';
import { getWorkRequests } from '@/services/workRequestService';
import { usePermissions } from '@/hooks/usePermissions';
import { cx } from '@/utils/cx';

type SidebarProps = {
  collapsed: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed, mobileOpen = false, onNavigate }: SidebarProps) {
  const location = useLocation();
  const { can, canAny } = usePermissions();
  const visibleItems = navigationItems.filter((item) => canAccessNavigation(item.path, can, canAny));
  const workRequestsQuery = useQuery({ queryKey: ['work-requests'], queryFn: getWorkRequests, enabled: can('VIEW_WORK_REQUEST') });

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
        {visibleItems.map((item) => {
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

function canAccessNavigation(path: string, can: (permission: string) => boolean, canAny: (permissions: readonly string[]) => boolean) {
  if (path === '/dashboard') return true;
  if (path === '/bids') return can('VIEW_BID');
  if (path === '/projects') return can('VIEW_PROJECT');
  if (path === '/work-requests') return can('VIEW_WORK_REQUEST');
  if (path === '/documents') return can('VIEW_DOCUMENT');
  if (path === '/organization' || path === '/team') return canAny(['VIEW_MEMBERS', 'VIEW_DIVISIONS']);
  if (path === '/settings') return can('VIEW_SETTINGS');
  return itemIsPublicOrDisabled(path);
}

function itemIsPublicOrDisabled(path: string) {
  return path === '/reports';
}
