import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '@/services/authService';

export function ProfileMenu() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const user = getStoredUser();
  const userName = user?.fullName ?? 'Nayeem Rahman';
  const email = user?.email ?? 'nayeem@techmarine.com';
  const initials = getInitials(userName);

  const logoutMutation = useMutation({
    mutationFn: () => logout(localStorage.getItem('accessToken')),
    onSettled: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      toast.success('Logged out successfully.');
      navigate('/login');
    },
  });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="profile-menu" ref={menuRef}>
      <button className="profile-trigger" type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <span className="profile-avatar">{initials}</span>
        <ChevronDown className="profile-chevron" size={13} />
      </button>
      {open ? (
        <div className="profile-content" role="menu">
          <div className="profile-label">
            <span className="profile-avatar profile-avatar--lg">{initials}</span>
            <div>
              <strong>{userName}</strong>
              <small>{email}</small>
            </div>
          </div>
          <div className="profile-separator" />
          <button className="profile-item" type="button" role="menuitem">
            <User size={14} />
            Profile
          </button>
          <button className="profile-item profile-item--danger" type="button" role="menuitem" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            <LogOut size={14} />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'U';
}

function getStoredUser(): { fullName?: string; email?: string; roles?: string[] } | null {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null') as { fullName?: string; email?: string; roles?: string[] } | null;
  } catch {
    return null;
  }
}
