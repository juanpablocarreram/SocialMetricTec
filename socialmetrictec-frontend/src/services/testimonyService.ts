import api from '@/src/lib/axios';

export const CATEGORIES = [
  'Logros y resultados',
  'Retos y obstáculos',
  'Aprendizajes',
  'Impacto comunitario',
  'Gestión del proyecto',
  'Colaboración',
  'Otro',
];

export interface TestimonyCreate {
  content: string;
  category?: string;
  tags?: string[];
  display_name?: string;
}

export interface TestimonyOut {
  testimony_id: number;
  project_id: number;
  author_username: string;
  display_name: string | null;
  content: string;
  category: string | null;
  tags: string[];
  created_at: string;
}

export const getTestimonies = async (projectId: number): Promise<TestimonyOut[]> => {
  const res = await api.get(`/project/${projectId}/testimonies`);
  return res.data;
};

export const createTestimony = async (projectId: number, data: TestimonyCreate): Promise<TestimonyOut> => {
  const res = await api.post(`/project/${projectId}/testimonies`, data);
  return res.data;
};

export const patchTestimonyDisplayName = async (
  projectId: number,
  testimonyId: number,
  displayName: string | null,
): Promise<TestimonyOut> => {
  const res = await api.patch(`/project/${projectId}/testimonies/${testimonyId}`, { display_name: displayName });
  return res.data;
};

export interface TestimonyUpdate {
  display_name?: string | null;
  content?: string;
  category?: string | null;
  tags?: string[];
}

export const patchTestimony = async (
  projectId: number,
  testimonyId: number,
  data: TestimonyUpdate,
): Promise<TestimonyOut> => {
  const res = await api.patch(`/project/${projectId}/testimonies/${testimonyId}`, data);
  return res.data;
};

export const deleteTestimony = async (projectId: number, testimonyId: number): Promise<void> => {
  await api.delete(`/project/${projectId}/testimonies/${testimonyId}`);
};

export interface CsvRowError {
  row: number;
  errors: string[];
}

export interface CsvImportResult {
  created: number;
  errors: CsvRowError[];
}

export const importTestimoniesCSV = async (projectId: number, file: File): Promise<CsvImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/project/${projectId}/testimonies/import-csv`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export interface ExportFilters {
  projectId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExportLogEntry {
  export_id: number;
  exported_by: string;
  project_id: number | null;
  date_from: string | null;
  date_to: string | null;
  row_count: number;
  created_at: string;
}

export const exportTestimoniesCSV = async (filters: ExportFilters = {}): Promise<void> => {
  const params = new URLSearchParams();
  if (filters.projectId) params.set('project_id', String(filters.projectId));
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  const query = params.toString();

  const res = await api.get(`/testimonies/export${query ? `?${query}` : ''}`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'testimonios.csv';
  link.click();
  URL.revokeObjectURL(link.href);
};

export const getExportLog = async (): Promise<ExportLogEntry[]> => {
  const res = await api.get('/testimonies/export/log');
  return res.data;
};
