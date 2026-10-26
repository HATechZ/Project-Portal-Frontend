import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from '@/App';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BidsPage } from '@/pages/BidsPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TasksPage } from '@/pages/TasksPage';
import { WorkRequestsPage } from '@/pages/WorkRequestsPage';
import { WorkRequestDetailsPage } from '@/pages/WorkRequestDetailsPage';
import { TeamPage } from '@/pages/TeamPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <AuthPage screen="login" /> },
      { path: 'company-login', element: <Navigate to="/login" replace /> },
      { path: 'company-signup', element: <AuthPage screen="company-signup" /> },
      { path: 'set-password', element: <AuthPage screen="set-password" /> },
      { path: 'auth-screens', element: <AuthPage screen="all" /> },
      {
        path: 'dashboard',
        element: (
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        ),
      },
      {
        path: 'bids',
        element: <DashboardLayout><BidsPage /></DashboardLayout>,
      },
      {
        path: 'projects',
        element: (
          <DashboardLayout>
            <ProjectsPage />
          </DashboardLayout>
        ),
      },
      {
        path: 'tasks',
        element: (
          <DashboardLayout>
            <TasksPage />
          </DashboardLayout>
        ),
      },
      {
        path: 'work-requests',
        element: (
          <DashboardLayout>
            <WorkRequestsPage />
          </DashboardLayout>
        ),
      },
      {
        path: 'work-requests/:id',
        element: (
          <DashboardLayout>
            <WorkRequestDetailsPage />
          </DashboardLayout>
        ),
      },
      {
        path: 'documents',
        element: <DashboardLayout><DocumentsPage /></DashboardLayout>,
      },
      {
        path: 'organization',
        element: <DashboardLayout><TeamPage /></DashboardLayout>,
      },
      {
        path: 'team',
        element: (
          <DashboardLayout>
            <TeamPage />
          </DashboardLayout>
        ),
      },
      {
        path: 'settings',
        element: (
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
