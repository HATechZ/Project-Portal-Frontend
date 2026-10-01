import { Outlet } from 'react-router-dom';
import { FormPlaceholderEnhancer } from '@/components/ui/FormPlaceholderEnhancer';

export function App() {
  return <><FormPlaceholderEnhancer /><Outlet /></>;
}
