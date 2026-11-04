import { useEffect, useState, type PropsWithChildren } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Menu } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/navigation/Sidebar';
import { ProfileMenu } from '@/components/navigation/ProfileMenu';
import { Button } from '@/components/ui/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { getActorProfiles } from '@/services/authService';

export function DashboardLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, isActorProfileSwitching } = usePermissions();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const closeMobileSidebar = () => {
      if (window.innerWidth > 768) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', closeMobileSidebar);
    return () => window.removeEventListener('resize', closeMobileSidebar);
  }, []);

  function toggleNavigation() {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen((value) => !value);
      return;
    }
    setSidebarCollapsed((value) => !value);
  }

  if (!isAuthenticated) return <Navigate replace state={{ from: location.pathname }} to="/login" />;

  // Load profiles for every authenticated app entry, not only after opening
  // the menu. The cache is also rebuilt after each activation.
  return <AuthenticatedDashboardLayout isActorProfileSwitching={isActorProfileSwitching} sidebarCollapsed={sidebarCollapsed} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} toggleNavigation={toggleNavigation}>{children}</AuthenticatedDashboardLayout>;
}

function AuthenticatedDashboardLayout({ children, isActorProfileSwitching, sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, toggleNavigation }: PropsWithChildren<{ isActorProfileSwitching: boolean; sidebarCollapsed: boolean; mobileSidebarOpen: boolean; setMobileSidebarOpen: (open: boolean) => void; toggleNavigation: () => void }>) {
  useQuery({ queryKey: ['actor-profiles'], queryFn: getActorProfiles });

  if (isActorProfileSwitching) return <div aria-live="polite" className="app-shell app-shell--profile-switching"><main className="profile-switching-state">Switching active profile...</main></div>;

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileSidebarOpen} onNavigate={() => setMobileSidebarOpen(false)} />
      {mobileSidebarOpen ? <button aria-label="Close navigation" className="mobile-nav-backdrop" onClick={() => setMobileSidebarOpen(false)} type="button" /> : null}
      <div className="main-shell">
        <header className="topbar">
          <Button variant="ghost" aria-label="Toggle sidebar" onClick={toggleNavigation}>
            <Menu size={20} />
          </Button>
          <div className="topbar-actions">
            <button className="topbar-icon" type="button" aria-label="Notifications">
              <Bell size={18} />
              <span />
            </button>
            <ProfileMenu />
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
