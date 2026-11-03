import type { QueryClient } from '@tanstack/react-query';

/**
 * All API data is actor-profile scoped. Reset active observers after the
 * effective profile changes so they refetch for the newly active actor rather
 * than briefly rendering records cached for the previous one.
 */
export function resetAuthScopedQueries(queryClient: QueryClient) {
  // resetQueries retains cache entries while their observers refetch. Clearing
  // prevents the previous actor's profile, permissions and actions rendering
  // for even a frame after a logout, login, or actor-profile change.
  queryClient.clear();
  return Promise.resolve();
}
