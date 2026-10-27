import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingState } from '@/components/ui/LoadingState';
import { getProjects } from '@/services/projectService';

export function ProjectsPage() {
  usePageTitle('Projects');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const query = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const statuses = useMemo(() => [...new Set((query.data?.items ?? []).map((project) => project.status).filter(Boolean))].sort(), [query.data]);
  const projects = (query.data?.items ?? []).filter((project) => (status === 'all' || project.status === status) && `${project.name} ${project.status}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="page-stack resource-page"><section className="page-heading resource-page__heading"><div><p>Portfolio</p><h1>Projects</h1><span>Track all active and completed projects.</span></div></section><section className="resource-page__toolbar"><label><span>Search projects</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" type="search" value={search} /></label><label><span>Status</span><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></section><section className="dash-panel division-panel"><div className="dash-section-title"><strong>All Projects</strong><span>{query.isLoading ? 'Loading projects' : `${projects.length} project${projects.length === 1 ? '' : 's'}`}</span></div><div className="division-table"><div className="division-grid division-grid--head project-list-row"><span>Project</span><span>Status</span><span>Documents</span><span>Created</span><span>Updated</span></div>{query.isLoading ? <LoadingState label="Loading projects" /> : null}{query.isError ? <div className="division-empty">Unable to load projects. Refresh and try again.</div> : null}{!query.isLoading && !query.isError && !projects.length ? <div className="division-empty">No projects match the selected filters.</div> : null}{projects.map((project) => <div className="division-grid project-list-row" key={project.id}><span><strong>{project.name}</strong><small>{project.id}</small></span><span><em className="division-status division-status--active">{project.status || 'Unspecified'}</em></span><span>{project.fileCount} file{project.fileCount === 1 ? '' : 's'}</span><span>{date(project.createdAt)}</span><span>{date(project.updatedAt)}</span></div>)}</div></section></div>;
}

function date(value: string) { const result = new Date(value); return Number.isNaN(result.getTime()) ? '—' : result.toLocaleDateString(); }
