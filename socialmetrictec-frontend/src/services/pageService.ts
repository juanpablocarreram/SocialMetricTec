import apiClient from '@/src/lib/axios';

export interface BackendBlock {
  type: string;
  props: Record<string, unknown>;
}

export interface BackendPage {
  blocks: BackendBlock[];
  general_props: Record<string, unknown>;
}

export interface ProjectFull {
  project_id: number;
  project_name: string;
  description: string | null;
  impact_area: string;
  cover_image_url: string;
  is_active: boolean;
  numero_beneficiarios: number;
  created_at: string;
  page: BackendPage | null;
}

export const getProject = async (projectId: number): Promise<ProjectFull> => {
  const res = await apiClient.get(`/project/${projectId}`);
  return res.data;
};

export const savePage = async (projectId: number, page: BackendPage): Promise<ProjectFull> => {
  const res = await apiClient.put(`/project/${projectId}/page`, page);
  return res.data;
};
