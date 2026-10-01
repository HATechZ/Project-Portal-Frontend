import type { Project, Task } from '@/types/project';

export const selectDashboardStats = (projects: Project[], tasks: Task[]) => {
  const completedProjects = projects.filter((project) => project.status === 'completed').length;
  const activeProjects = projects.length - completedProjects;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const highPriorityTasks = tasks.filter((task) => task.priority === 'high').length;

  return {
    activeProjects,
    completedProjects,
    completedTasks,
    highPriorityTasks,
    totalBudget: projects.reduce((sum, project) => sum + project.budget, 0),
  };
};

export const selectProgressChartData = (projects: Project[]) =>
  projects.map((project) => ({
    name: project.name,
    progress: project.progress,
  }));
