import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useProjectsQuery } from '@/hooks/useDashboardData';
import { usePageTitle } from '@/hooks/usePageTitle';
import { currencyFormatter, formatShortDate } from '@/utils/formatters';

export function ProjectsPage() {
  usePageTitle('Projects');
  const { data: projects = [] } = useProjectsQuery();

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p>Portfolio</p>
          <h1>Projects</h1>
        </div>
      </section>

      <section className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Budget</th>
              <th>Due date</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.client}</td>
                <td>
                  <StatusBadge value={project.status} />
                </td>
                <td>
                  <ProgressBar value={project.progress} />
                </td>
                <td>{currencyFormatter.format(project.budget)}</td>
                <td>{formatShortDate(project.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
