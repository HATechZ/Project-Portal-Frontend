import { Loader2 } from 'lucide-react';

type LoadingStateProps = {
  label?: string;
  size?: 'inline' | 'panel' | 'page';
};

/** Shared, accessible loading treatment for page, panel, and modal data states. */
export function LoadingState({ label = 'Loading content', size = 'panel' }: LoadingStateProps) {
  return <div aria-live="polite" className={`loading-state loading-state--${size}`} role="status">
    <span aria-hidden="true" className="loading-state__mark"><i /><i /><i /><Loader2 size={size === 'page' ? 24 : 18} /></span>
    <div><strong>{label}</strong><small>Please wait a moment</small></div>
    <span className="sr-only">{label}</span>
  </div>;
}

export function WorkspaceLoadingState({ entity = 'Workspace', title, description }: { entity?: string; title?: string; description?: string }) {
  return <section aria-live="polite" className="workspace-loading-state" role="status">
    <div className="workspace-loading-state__intro">
      <span aria-hidden="true" className="workspace-loading-state__orbit"><i /><i /><i /></span>
      <div><h2>{title ?? `Loading ${entity} Workspace`}</h2><p>{description ?? `Preparing ${entity.toLowerCase()} details, related documents, and associated work requests.`}</p></div>
    </div>
    <div aria-hidden="true" className="workspace-loading-state__summary"><i /><i /><i /><i /></div>
    <div aria-hidden="true" className="workspace-loading-state__table"><i /><i /><i /><i /></div>
    <span className="sr-only">Loading {entity} workspace</span>
  </section>;
}
