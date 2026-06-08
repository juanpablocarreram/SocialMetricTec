import apiClient from '@/src/lib/axios';

export interface ChangeLogEntry {
  log_id: number;
  project_id: number;
  event_type: string;
  entity_name: string | null;
  occurred_at: string;
}

export const getChangeLog = async (projectId: number): Promise<ChangeLogEntry[]> => {
  const res = await apiClient.get(`/project/${projectId}/change-log`);
  return res.data;
};
