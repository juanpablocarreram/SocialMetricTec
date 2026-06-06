import api from '@/src/lib/axios';

export interface PhotoOut {
  photo_id: number;
  project_id: number;
  url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

export const getPhotos = async (projectId: number): Promise<PhotoOut[]> => {
  const res = await api.get(`/project/${projectId}/photos`);
  return res.data;
};

export const uploadPhoto = async (projectId: number, file: File, caption = ''): Promise<PhotoOut> => {
  const form = new FormData();
  form.append('file', file);
  if (caption) form.append('caption', caption);
  const res = await api.post(`/project/${projectId}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deletePhoto = async (projectId: number, photoId: number): Promise<void> => {
  await api.delete(`/project/${projectId}/photos/${photoId}`);
};
