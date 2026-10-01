import { StatusBadge } from '@/components/ui/StatusBadge';
import { useProjectsQuery, useTasksQuery, useTeamQuery, useUpdateTaskStatusMutation } from '@/hooks/useDashboardData';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { TaskStatus } from '@/types/project';
import { formatShortDate } from '@/utils/formatters';

const statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];

export function TasksPage() {
  usePageTitle('Tasks');
  const { data: tasks = [] } = useTasksQuery();
  const { data: projects = [] } = useProjectsQuery();
  const { data: team = [] } = useTeamQuery();
  const updateTaskStatus = useUpdateTaskStatusMutation();

  const getProjectName = (projectId: string) => projects.find((project) => project.id === projectId)?.name ?? 'Unknown';
  const getOwnerName = (ownerId: string) => team.find((member) => member.id === ownerId)?.name ?? 'Unassigned';

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p>Execution</p>
          <h1>Tasks</h1>
        </div>
      </section>

      <section className="kanban-board">
        {statuses.map((status) => (
          <article className="kanban-column" key={status}>
            <h2>{status.replace('-', ' ')}</h2>
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <div className="task-card" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{getProjectName(task.projectId)}</span>
                  </div>
                  <div className="task-card__meta">
                    <StatusBadge value={task.priority} />
                    <span>{formatShortDate(task.dueDate)}</span>
                  </div>
                  <select
                    value={task.status}
                    onChange={(event) => updateTaskStatus.mutate({ taskId: task.id, status: event.target.value as TaskStatus })}
                  >
                    {statuses.map((option) => (
                      <option key={option} value={option}>
                        {option.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  <small>{getOwnerName(task.ownerId)}</small>
                </div>
              ))}
          </article>
        ))}
      </section>
    </div>
  );
}
