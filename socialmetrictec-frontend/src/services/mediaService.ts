import apiClient from '@/src/lib/axios';

export interface MediaUploadResponse {
  url: string;
  path: string;
  content_type: string;
  size_bytes: number;
}

export const uploadMedia = async (
  projectId: number,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post(`/project/${projectId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

  return res.data;
};

/**
 * Sube un archivo sin necesidad de un proyecto existente.
 * Se usa cuando todavía no hay un projectId (p. ej. la portada al crear
 * un proyecto) o en cualquier formulario que solo necesite una URL.
 */
export const uploadMediaStandalone = async (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post('/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

  return res.data;
};
