import api from '@/src/lib/axios';
import { UserProfile } from './userService';

export interface ProjectLeader {
  username: string;
  email: string;
  profile: UserProfile | null;
}

export interface ProjectSummary {
  project_id: number;
  project_name: string;
  description: string | null;
  impact_area: string;
  cover_image_url: string;
  is_active: boolean;
  numero_beneficiarios: number;
  created_at: string;
}

export interface ProjectCreate {
  project_name: string;
  description?: string;
  impact_area: string;
  cover_image_url: string;
  is_active: boolean;
  objetivo?: string;
  numero_beneficiarios: number;
}

export interface ProjectFull extends ProjectSummary {
  page: unknown | null;
}

export const AREA_LABELS: Record<string, string> = {
  ods_1:  'ODS 1: Fin de la pobreza',
  ods_2:  'ODS 2: Hambre cero',
  ods_3:  'ODS 3: Salud y bienestar',
  ods_4:  'ODS 4: Educación de calidad',
  ods_5:  'ODS 5: Igualdad de género',
  ods_6:  'ODS 6: Agua limpia y saneamiento',
  ods_7:  'ODS 7: Energía asequible',
  ods_8:  'ODS 8: Trabajo decente',
  ods_9:  'ODS 9: Industria e infraestructura',
  ods_10: 'ODS 10: Reducción de desigualdades',
  ods_11: 'ODS 11: Ciudades sostenibles',
  ods_12: 'ODS 12: Producción responsable',
  ods_13: 'ODS 13: Acción por el clima',
  ods_14: 'ODS 14: Vida submarina',
  ods_15: 'ODS 15: Vida de ecosistemas terrestres',
  ods_16: 'ODS 16: Paz, justicia e instituciones',
  ods_17: 'ODS 17: Alianzas para los objetivos',
};

export const formatArea = (area: string): string =>
  AREA_LABELS[area] ?? area;

export const listProjects = async (): Promise<ProjectSummary[]> => {
  const res = await api.get('/project/listpreview');
  return res.data;
};

export const getMyProjects = async (): Promise<ProjectSummary[]> => {
  const res = await api.get('/project/mine');
  return res.data;
};

export const createProject = async (data: ProjectCreate): Promise<ProjectFull> => {
  const res = await api.post('/project/create', data);
  return res.data;
};

export const getProjectLeaders = async (projectId: number): Promise<ProjectLeader[]> => {
  const res = await api.get(`/project/${projectId}/leaders`);
  return res.data;
};

export const deleteProject = async (projectId: number): Promise<void> => {
  await api.delete(`/project/${projectId}/delete`);
};

export const toggleProjectStatus = async (projectId: number): Promise<ProjectFull> => {
  const res = await api.patch(`/project/${projectId}/status`);
  return res.data;
};
