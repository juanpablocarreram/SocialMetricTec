import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Trash2, Check, Loader2, BarChart3, Pencil } from 'lucide-react';
import {
  MetricOut,
  SubMetricOut,
  MetricCreate,
  getMetrics,
  createMetric,
  deleteMetric,
  updateMetric,
  createSubMetric,
  updateSubMetric,
  deleteSubMetric,
} from '@/src/services/metricService';

interface SubMetricFormField {
  title: string;
  value: string;
}

interface MetricFormState {
  title: string;
  subMetrics: SubMetricFormField[];
}

interface EditSubMetricRow {
  sub_metric_id?: number;
  title: string;
  value: string;
  toDelete: boolean;
}

interface MetricEditState {
  metricId: number;
  title: string;
  rows: EditSubMetricRow[];
}

const EMPTY_FORM: MetricFormState = { title: '', subMetrics: [{ title: '', value: '' }] };

export default function MetricsManager({ projectId }: { projectId: number }) {
  const [metrics, setMetrics] = useState<MetricOut[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<MetricFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState<MetricEditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getMetrics(projectId).then(setMetrics).catch(console.error);
  }, [projectId]);

  // ── Create modal ─────────────────────────────────────────────────────────

  const openModal = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const addSubMetricField = () =>
    setForm({ ...form, subMetrics: [...form.subMetrics, { title: '', value: '' }] });

  const removeSubMetricField = (index: number) =>
    setForm({ ...form, subMetrics: form.subMetrics.filter((_, i) => i !== index) });

  const handleSubMetricChange = (index: number, field: keyof SubMetricFormField, value: string) => {
    const updated = [...form.subMetrics];
    updated[index][field] = value;
    setForm({ ...form, subMetrics: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data: MetricCreate = {
      metric_title: form.title,
      sub_metrics: form.subMetrics
        .filter((sm) => sm.title.trim() !== '')
        .map((sm) => ({
          sub_metric_title: sm.title,
          sub_metric_value: sm.value.trim() || null,
        })),
    };
    try {
      const created = await createMetric(projectId, data);
      setMetrics((prev) => [...prev, created]);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (metricId: number) => {
    try {
      await deleteMetric(projectId, metricId);
      setMetrics((prev) => prev.filter((m) => m.metric_id !== metricId));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Edit modal ────────────────────────────────────────────────────────────

  const openEdit = (metric: MetricOut) => {
    setEditState({
      metricId: metric.metric_id,
      title: metric.metric_title,
      rows: metric.sub_metrics.map((sm) => ({
        sub_metric_id: sm.sub_metric_id,
        title: sm.sub_metric_title,
        value: sm.sub_metric_value ?? '',
        toDelete: false,
      })),
    });
  };

  const addEditRow = () => {
    if (!editState) return;
    setEditState({ ...editState, rows: [...editState.rows, { title: '', value: '', toDelete: false }] });
  };

  const updateEditRow = (index: number, field: 'title' | 'value', value: string) => {
    if (!editState) return;
    const rows = [...editState.rows];
    rows[index] = { ...rows[index], [field]: value };
    setEditState({ ...editState, rows });
  };

  const markRowDelete = (index: number) => {
    if (!editState) return;
    const rows = [...editState.rows];
    if (!rows[index].sub_metric_id) {
      rows.splice(index, 1);
    } else {
      rows[index] = { ...rows[index], toDelete: true };
    }
    setEditState({ ...editState, rows });
  };

  const handleEditSave = async () => {
    if (!editState) return;
    setEditSaving(true);
    try {
      await updateMetric(projectId, editState.metricId, { metric_title: editState.title });

      const original = metrics.find((m) => m.metric_id === editState.metricId);
      const originalSubs: SubMetricOut[] = original?.sub_metrics ?? [];

      for (const row of editState.rows) {
        if (row.toDelete && row.sub_metric_id) {
          await deleteSubMetric(projectId, editState.metricId, row.sub_metric_id);
        } else if (!row.toDelete && row.sub_metric_id) {
          const orig = originalSubs.find((s) => s.sub_metric_id === row.sub_metric_id);
          const changed =
            orig?.sub_metric_title !== row.title ||
            (orig?.sub_metric_value ?? '') !== row.value;
          if (changed) {
            await updateSubMetric(projectId, editState.metricId, row.sub_metric_id, {
              sub_metric_title: row.title,
              sub_metric_value: row.value.trim() || null,
            });
          }
        } else if (!row.toDelete && !row.sub_metric_id && row.title.trim()) {
          await createSubMetric(projectId, editState.metricId, {
            sub_metric_title: row.title,
            sub_metric_value: row.value.trim() || null,
          });
        }
      }

      const refreshed = await getMetrics(projectId);
      setMetrics(refreshed);
      setEditState(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary tracking-tight">Métricas de Impacto</h2>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 cursor-pointer py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Métrica
        </button>
      </div>

      {metrics.length === 0 ? (
        <p className="text-sm text-outline italic">Aún no has registrado métricas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div
              key={metric.metric_id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 relative group"
            >
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">
                  {metric.metric_title}
                </h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => openEdit(metric)}
                    className="p-1.5 text-outline hover:text-primary transition-colors"
                    aria-label="Editar métrica"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(metric.metric_id)}
                    className="p-1.5 text-outline hover:text-error transition-colors"
                    aria-label="Eliminar métrica"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {metric.sub_metrics.map((sm) => (
                  <div key={sm.sub_metric_id} className="flex justify-between items-baseline border-b border-outline-variant/5 pb-2">
                    <span className="text-xs font-semibold text-outline tracking-tight">{sm.sub_metric_title}</span>
                    <span className="text-2xl font-black text-primary tracking-tighter">
                      {sm.sub_metric_value ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10 overflow-hidden">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-outline hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Configurar Métrica</h2>
                <p className="text-on-surface-variant font-light text-sm mt-2 font-body">Define los indicadores y valores que deseas monitorear.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Título de la Métrica</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ej: Alcance en Comunidades"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Submétricas / Indicadores</label>
                    <button type="button" onClick={addSubMetricField} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Añadir Campo
                    </button>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto px-1">
                    {form.subMetrics.map((sm, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          placeholder="Título (Ej: Niños atendidos)"
                          value={sm.title}
                          onChange={(e) => handleSubMetricChange(idx, 'title', e.target.value)}
                          className="flex-grow bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                        />
                        <input
                          placeholder="Valor (Ej: 450, 15%, Alto)"
                          value={sm.value}
                          onChange={(e) => handleSubMetricChange(idx, 'value', e.target.value)}
                          className="w-32 bg-surface-container-low border-none rounded-xl p-3 text-xs font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                        {form.subMetrics.length > 1 && (
                          <button type="button" onClick={() => removeSubMetricField(idx)} className="p-2 text-outline-variant hover:text-error transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar Métrica
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit modal */}
      {editState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setEditState(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10 overflow-hidden">
            <button onClick={() => setEditState(null)} className="absolute top-6 right-6 p-2 text-outline hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Editar Métrica</h2>
                <p className="text-on-surface-variant font-light text-sm mt-2 font-body">Modifica el título y los indicadores de esta métrica.</p>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Título de la Métrica</label>
                  <input
                    type="text"
                    value={editState.title}
                    onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Submétricas / Indicadores</label>
                    <button type="button" onClick={addEditRow} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Añadir Campo
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto px-1">
                    {editState.rows.map((row, idx) =>
                      row.toDelete ? null : (
                        <div key={row.sub_metric_id ?? `new-${idx}`} className="flex gap-2 items-center">
                          <input
                            placeholder="Título (Ej: Niños atendidos)"
                            value={row.title}
                            onChange={(e) => updateEditRow(idx, 'title', e.target.value)}
                            className="flex-grow bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                          />
                          <input
                            placeholder="Valor"
                            value={row.value}
                            onChange={(e) => updateEditRow(idx, 'value', e.target.value)}
                            className="w-32 bg-surface-container-low border-none rounded-xl p-3 text-xs font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                          <button type="button" onClick={() => markRowDelete(idx)} className="p-2 text-outline-variant hover:text-error transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setEditState(null)} className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleEditSave} disabled={editSaving || !editState.title.trim()} className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
