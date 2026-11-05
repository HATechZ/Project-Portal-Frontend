import { useQuery } from '@tanstack/react-query';
import { getMembersPage } from '@/services/memberService';

/** The optional enabled flag mirrors the callers' existing query behavior. */
export function useMembers(enabled = true, page = 1, limit = 100, divisionId = '') {
  return useQuery({ queryKey: ['members', page, limit, divisionId], queryFn: () => getMembersPage({ page, limit, divisionId }), enabled });
}
