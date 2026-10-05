'use client';

import {useQuery} from '@tanstack/react-query';
import {getEmailStats} from '@/lib/api';
import type {EmailStatsGroupBy} from '@/types';

export function useEmailStats(params: {
  from?: string;
  to?: string;
  groupBy?: EmailStatsGroupBy;
  enabled?: boolean;
}) {
  const {from, to, groupBy, enabled = true} = params;
  return useQuery({
    queryKey: ['audit', 'email-stats', {from, to, groupBy}],
    queryFn: () => getEmailStats({from, to, groupBy}),
    enabled
  });
}
