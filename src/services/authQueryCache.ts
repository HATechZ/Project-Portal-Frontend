import type { QueryClient } from '@tanstack/react-query';

/**
 * All API data is actor-profile scoped. Reset active observers after the
 * effective profile changes so they refetch for the newly active actor rather
 * than briefly rendering records cached for the previous one.
 */
export function resetAuthScopedQueries(queryClient: QueryClient) {
  return queryClient.resetQueries();
}
