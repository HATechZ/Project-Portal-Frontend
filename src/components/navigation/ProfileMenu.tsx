import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { activateActorProfile, getActorProfiles, getCurrentUser, logout } from '@/services/authService';
import { clearStoredUser, persistUser, readStoredUser } from '@/services/authSession';

export function ProfileMenu() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const user = readStoredUser();
  const userName = user?.fullName ?? 'Nayeem Rahman';
  const email = user?.email ?? 'nayeem@techmarine.com';
  const initials = getInitials(userName);
  const profilesQuery = useQuery({ queryKey: ['actor-profiles'], queryFn: getActorProfiles, enabled: open });

  const logoutMutation = useMutation({
    mutationFn: () => logout(localStorage.getItem('accessToken')),
    onSettled: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearStoredUser();
      toast.success('Logged out successfully.');
      navigate('/login');
    },
  });
  const activateProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      await activateActorProfile(profileId);
      return getCurrentUser();
    },
    onSuccess: (activeUser) => {
      persistUser(activeUser);
      void queryClient.invalidateQueries();
      setOpen(false);
      toast.success('Active profile updated.');
    },
    onError: () => toast.error('Unable to activate this profile.'),
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
          {profilesQuery.data && profilesQuery.data.length > 1 ? <><div className="profile-separator" />{profilesQuery.data.map((profile) => <button className="profile-item" disabled={profile.isDefault || activateProfileMutation.isPending} key={profile.id} onClick={() => activateProfileMutation.mutate(profile.id)} role="menuitem" type="button"><User size={14} />{profile.isDefault ? `${profile.label} (active)` : profile.label}</button>)}</> : null}
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
