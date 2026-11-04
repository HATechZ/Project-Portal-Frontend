export type DashboardQueryState = { failed: boolean; network: boolean; succeeded: boolean };

export function hasDashboardOutage(queries: DashboardQueryState[]) {
  const networkFailures = queries.filter((query) => query.failed && query.network).length;
  return networkFailures > 1 || (networkFailures > 0 && !queries.some((query) => query.succeeded));
}

export function dashboardMetricValue(value: number, loading: boolean, failed: boolean): number | null {
  return loading || failed ? null : value;
}

export function retryFailedDashboardQueries(queries: Array<{ isError: boolean; refetch: () => unknown }>) {
  queries.filter((query) => query.isError).forEach((query) => { void query.refetch(); });
}
