import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { activateActorProfile, getActorProfiles, getCurrentUser, logout } from '@/services/authService';
import { clearAuthenticatedBrowserState, persistUser, readStoredUser, setActorProfileSwitching } from '@/services/authSession';
import { resetAuthScopedQueries } from '@/services/authQueryCache';
import { readableApiError } from '@/services/roleService';

export function ProfileMenu() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const user = readStoredUser();
  const userName = user?.fullName ?? '';
  const email = user?.email ?? '';
  const initials = getInitials(userName);
  const profilesQuery = useQuery({ queryKey: ['actor-profiles'], queryFn: getActorProfiles });
  const activeProfiles = (profilesQuery.data ?? []).filter((profile) => profile.isActive !== false);
  const activeActorProfileId = typeof user?.activeActorProfileId === 'string' ? user.activeActorProfileId : null;
  // `isActive` only tells us a profile is usable. Prefer the acting profile ID
  // returned by /auth/me, with the server's isCurrent flag as the API fallback.
  const currentProfile = activeActorProfileId
    ? activeProfiles.find((profile) => profile.id === activeActorProfileId) ?? null
    : activeProfiles.find((profile) => profile.isCurrent) ?? null;
  const switchableProfiles = activeProfiles.filter((profile) => profile.id !== currentProfile?.id);

  const logoutMutation = useMutation({
    mutationFn: (accessToken: string | null) => logout(accessToken),
    onMutate: () => {
      // Remove the actor before the network request settles so DashboardLayout
      // immediately unmounts instead of briefly showing a stale shell.
      clearAuthenticatedBrowserState();
      void resetAuthScopedQueries(queryClient);
      navigate('/login', { replace: true });
    },
    onSuccess: () => toast.success('Logged out successfully.'),
    onError: () => toast.error('Local session was cleared. The server logout request could not be completed.'),
  });
  const activateProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      await activateActorProfile(profileId);
      const [activeUser, profiles] = await Promise.all([getCurrentUser(), getActorProfiles()]);
      return { activeUser, profiles };
    },
    onMutate: () => setActorProfileSwitching(true),
    onSuccess: async ({ activeUser, profiles }) => {
      persistUser(activeUser);
      await resetAuthScopedQueries(queryClient);
      queryClient.setQueryData(['actor-profiles'], profiles);
      setOpen(false);
      toast.success('Active profile updated.');
    },
    onError: (error) => toast.error(readableApiError(error, 'Unable to activate this profile.')),
    onSettled: () => setActorProfileSwitching(false),
  });
  // Keep profile activation available internally while the menu only shows account actions.
  void switchableProfiles;
  void activateProfileMutation;

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
          <button className="profile-item" type="button" role="menuitem" disabled title="Profile page is not available yet.">
            <User size={14} />
            Profile
          </button>
          <button className="profile-item profile-item--danger" type="button" role="menuitem" onClick={() => logoutMutation.mutate(localStorage.getItem('accessToken'))} disabled={logoutMutation.isPending}>
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
