import apiClient from '@/src/lib/axios';

export interface SubMetricCreate {
  sub_metric_title: string;
  sub_metric_value?: string | null;
}

export interface SubMetricUpdate {
  sub_metric_title: string;
  sub_metric_value?: string | null;
}

export interface SubMetricOut {
  sub_metric_id: number;
  sub_metric_title: string;
  sub_metric_value: string | null;
}

export interface MetricCreate {
  metric_title: string;
  sub_metrics?: SubMetricCreate[];
}

export interface MetricUpdate {
  metric_title: string;
}

export interface MetricOut {
  metric_id: number;
  metric_title: string;
  project_id: number;
  sub_metrics: SubMetricOut[];
}

const base = (projectId: number) => `/project/${projectId}/metrics`;

export const getMetrics = async (projectId: number): Promise<MetricOut[]> => {
  const res = await apiClient.get(base(projectId));
  return res.data;
};

export const createMetric = async (projectId: number, data: MetricCreate): Promise<MetricOut> => {
  const res = await apiClient.post(base(projectId), data);
  return res.data;
};

export const updateMetric = async (projectId: number, metricId: number, data: MetricUpdate): Promise<MetricOut> => {
  const res = await apiClient.put(`${base(projectId)}/${metricId}`, data);
  return res.data;
};

export const deleteMetric = async (projectId: number, metricId: number): Promise<void> => {
  await apiClient.delete(`${base(projectId)}/${metricId}`);
};

export const createSubMetric = async (projectId: number, metricId: number, data: SubMetricCreate): Promise<SubMetricOut> => {
  const res = await apiClient.post(`${base(projectId)}/${metricId}/sub-metrics`, data);
  return res.data;
};

export const updateSubMetric = async (projectId: number, metricId: number, subMetricId: number, data: SubMetricUpdate): Promise<SubMetricOut> => {
  const res = await apiClient.put(`${base(projectId)}/${metricId}/sub-metrics/${subMetricId}`, data);
  return res.data;
};

export const deleteSubMetric = async (projectId: number, metricId: number, subMetricId: number): Promise<void> => {
  await apiClient.delete(`${base(projectId)}/${metricId}/sub-metrics/${subMetricId}`);
};
