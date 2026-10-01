# Project Management Dashboard

React Vite project scaffolded for a project management dashboard. It uses TypeScript, Redux Toolkit, React Redux, React Router, Recharts, and Lucide icons.

## Scripts

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

## Folder Structure

```text
src/
  assets/              Static images, icons, and other local media.
  components/          Reusable UI and navigation components.
    navigation/        Sidebar and app navigation components.
    ui/                Shared primitives such as buttons, badges, cards, and progress bars.
  constants/           App-wide static constants.
  data/                Temporary mock data used before connecting APIs.
  features/            Redux feature modules grouped by business domain.
    dashboard/         Dashboard selectors and dashboard-specific state helpers.
    projects/          Project list state and future project actions.
    tasks/             Task state and task actions.
    team/              Team member state.
  hooks/               Reusable React hooks.
  layouts/             Page layout shells.
  pages/               Route-level screens.
  routes/              Router and navigation configuration.
  services/            API clients and external service adapters.
  store/               Redux store setup, typed hooks, and global UI state.
  styles/              Global CSS and design tokens.
  types/               Shared TypeScript domain types.
  utils/               Small reusable utility functions.
```

## Architecture Notes

- Keep route-level screens inside `pages`.
- Keep business state and reducers inside `features`.
- Keep generic visual components inside `components/ui`.
- Keep app shell components inside `layouts` and `components/navigation`.
- Replace `src/data/mockDashboard.ts` with real API data when backend endpoints are ready.
- Add new dashboard domains as new folders under `src/features`, for example `milestones`, `reports`, or `clients`.
