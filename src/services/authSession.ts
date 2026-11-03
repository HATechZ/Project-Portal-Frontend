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

/** Remove every browser-side value that can identify or authorize an actor. */
export function clearAuthenticatedBrowserState() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Older builds used several auth-prefixed keys. Do not retain one across a
  // logout/login boundary, but leave unrelated application preferences intact.
  for (const storage of [localStorage, sessionStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && /^(auth|user|profile|role|permission|token)/i.test(key)) storage.removeItem(key);
    }
  }
  clearStoredUser();
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
