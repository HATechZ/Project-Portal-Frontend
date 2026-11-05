import { useQuery } from '@tanstack/react-query';
import { getTeams } from '@/services/teamService';

export function useTeams(enabled: boolean, page = 1, limit = 100) {
  return useQuery({ queryKey: ['teams', page, limit], queryFn: () => getTeams({ page, limit }), enabled });
}
