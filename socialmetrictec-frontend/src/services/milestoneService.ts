import api from '@/src/lib/axios';

export interface MilestoneOut {
  milestone_id: number;
  project_id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface MilestoneCreate {
  title: string;
  description?: string;
}

export const getMilestones = async (projectId: number): Promise<MilestoneOut[]> => {
  const res = await api.get(`/project/${projectId}/milestones`);
  return res.data;
};

export const createMilestone = async (projectId: number, data: MilestoneCreate): Promise<MilestoneOut> => {
  const res = await api.post(`/project/${projectId}/milestones`, data);
  return res.data;
};

export const updateMilestone = async (
  projectId: number,
  milestoneId: number,
  data: Partial<MilestoneCreate> & { is_completed?: boolean },
): Promise<MilestoneOut> => {
  const res = await api.patch(`/project/${projectId}/milestones/${milestoneId}`, data);
  return res.data;
};

export const deleteMilestone = async (projectId: number, milestoneId: number): Promise<void> => {
  await api.delete(`/project/${projectId}/milestones/${milestoneId}`);
};
