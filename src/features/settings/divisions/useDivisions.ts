import { useQuery } from '@tanstack/react-query';
import { getDivisionsPage } from '@/services/divisionService';

export function useDivisions(enabled: boolean, page = 1, limit = 100) {
  return useQuery({ queryKey: ['divisions', page, limit], queryFn: () => getDivisionsPage({ page, limit }), enabled });
}
