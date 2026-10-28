import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from '@/App';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BidsPage } from '@/pages/BidsPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { WorkspaceDetailsPage } from '@/pages/WorkspaceDetailsPage';
import { TasksPage } from '@/pages/TasksPage';
import { WorkRequestsPage } from '@/pages/WorkRequestsPage';
import { WorkRequestDetailsPage } from '@/pages/WorkRequestDetailsPage';
import { TeamPage } from '@/pages/TeamPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PermissionRoute } from '@/routes/PermissionRoute';

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
        element: <PermissionRoute permissions={['VIEW_BID']}><DashboardLayout><BidsPage /></DashboardLayout></PermissionRoute>,
      },
      {
        path: 'bids/:id',
        element: <PermissionRoute permissions={['VIEW_BID']}><DashboardLayout><WorkspaceDetailsPage kind="bid" /></DashboardLayout></PermissionRoute>,
      },
      {
        path: 'projects',
        element: (
          <PermissionRoute permissions={['VIEW_PROJECT']}><DashboardLayout>
            <ProjectsPage />
          </DashboardLayout></PermissionRoute>
        ),
      },
      {
        path: 'projects/:id',
        element: <PermissionRoute permissions={['VIEW_PROJECT']}><DashboardLayout><WorkspaceDetailsPage kind="project" /></DashboardLayout></PermissionRoute>,
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
          <PermissionRoute permissions={['VIEW_WORK_REQUEST']}><DashboardLayout>
            <WorkRequestsPage />
          </DashboardLayout></PermissionRoute>
        ),
      },
      {
        path: 'work-requests/:id',
        element: (
          <PermissionRoute permissions={['VIEW_WORK_REQUEST']}><DashboardLayout>
            <WorkRequestDetailsPage />
          </DashboardLayout></PermissionRoute>
        ),
      },
      {
        path: 'documents',
        element: <PermissionRoute permissions={['VIEW_DOCUMENT']}><DashboardLayout><DocumentsPage /></DashboardLayout></PermissionRoute>,
      },
      {
        path: 'organization',
        element: <PermissionRoute permissions={['VIEW_DIVISIONS', 'VIEW_MEMBERS', 'VIEW_TEAMS']}><DashboardLayout><TeamPage /></DashboardLayout></PermissionRoute>,
      },
      {
        path: 'team',
        element: (
          <PermissionRoute permissions={['VIEW_DIVISIONS', 'VIEW_MEMBERS', 'VIEW_TEAMS']}><DashboardLayout>
            <TeamPage />
          </DashboardLayout></PermissionRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <PermissionRoute permissions={['VIEW_SETTINGS']}><DashboardLayout>
            <SettingsPage />
          </DashboardLayout></PermissionRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
