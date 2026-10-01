import { Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Not found');

  return (
    <section className="empty-state">
      <h1>Page not found</h1>
      <p>The requested dashboard page does not exist.</p>
      <Link className="btn btn--primary" to="/dashboard">
        Back to dashboard
      </Link>
    </section>
  );
}
