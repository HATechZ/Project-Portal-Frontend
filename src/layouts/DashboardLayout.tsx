import { useEffect, useState, type PropsWithChildren } from 'react';
import { Bell, Menu } from 'lucide-react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { ProfileMenu } from '@/components/navigation/ProfileMenu';
import { Button } from '@/components/ui/Button';

export function DashboardLayout({ children }: PropsWithChildren) {
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
