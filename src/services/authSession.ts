const changedEvent = 'project-portal-auth-changed';

export type StoredUser = {
  fullName?: string;
  email?: string;
  roles?: string[];
  permissions?: unknown;
  roleScopes?: unknown;
  [key: string]: unknown;
};

function parseStoredUser(value: string | null): StoredUser | null {
  try {
    return value ? (JSON.parse(value) as StoredUser) : null;
  } catch {
    return null;
  }
}

// This is deliberately the only value returned to useSyncExternalStore. Reading
// localStorage (and parsing JSON) here would create a new object for each
// snapshot read and cause React to keep scheduling updates.
let cachedUser: StoredUser | null = typeof window === 'undefined' ? null : parseStoredUser(localStorage.getItem('user'));

export function readStoredUser(): StoredUser | null {
  return cachedUser;
}

function updateCachedUser(user: StoredUser | null) {
  if (cachedUser === user) return false;
  cachedUser = user;
  return true;
}

function notifyAuthSessionChanged() {
  window.dispatchEvent(new Event(changedEvent));
}

export function persistUser(user: StoredUser) {
  localStorage.setItem('user', JSON.stringify(user));
  if (updateCachedUser(user)) notifyAuthSessionChanged();
}

export function clearStoredUser() {
  localStorage.removeItem('user');
  if (updateCachedUser(null)) notifyAuthSessionChanged();
}

export function subscribeToAuthSession(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== 'user' && event.key !== null) return;

    const nextUser = event.key === 'user' ? parseStoredUser(event.newValue) : null;
    if (updateCachedUser(nextUser)) listener();
  };
  window.addEventListener(changedEvent, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(changedEvent, listener);
    window.removeEventListener('storage', onStorage);
  };
}
