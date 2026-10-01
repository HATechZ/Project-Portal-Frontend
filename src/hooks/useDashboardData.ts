import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projects, tasks, teamMembers } from '@/data/mockDashboard';
import type { Task, TaskStatus } from '@/types/project';

export const dashboardQueryKeys = {
  projects: ['projects'],
  tasks: ['tasks'],
  team: ['team'],
} as const;

export function useProjectsQuery() {
  return useQuery({
    queryKey: dashboardQueryKeys.projects,
    queryFn: async () => projects,
    initialData: projects,
  });
}

export function useTasksQuery() {
  return useQuery({
    queryKey: dashboardQueryKeys.tasks,
    queryFn: async () => tasks,
    initialData: tasks,
  });
}

export function useTeamQuery() {
  return useQuery({
    queryKey: dashboardQueryKeys.team,
    queryFn: async () => teamMembers,
    initialData: teamMembers,
  });
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { taskId: string; status: TaskStatus }) => payload,
    onSuccess: ({ taskId, status }) => {
      queryClient.setQueryData<Task[]>(dashboardQueryKeys.tasks, (current = tasks) =>
        current.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );
    },
  });
}
