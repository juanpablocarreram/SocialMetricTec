import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Flag, CheckCircle2, Circle, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  MilestoneOut,
} from '@/src/services/milestoneService';

export default function MilestonesManager({ projectId }: { projectId: number }) {
  const [milestones, setMilestones] = useState<MilestoneOut[]>([]);
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getMilestones(projectId).then(setMilestones).catch(console.error);
  }, [projectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const created = await createMilestone(projectId, { title: title.trim() });
      setMilestones((prev) => [...prev, created]);
      setTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (milestone: MilestoneOut) => {
    try {
      const updated = await updateMilestone(projectId, milestone.milestone_id, { is_completed: !milestone.is_completed });
      setMilestones((prev) => prev.map((m) => m.milestone_id === updated.milestone_id ? updated : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (milestoneId: number) => {
    try {
      await deleteMilestone(projectId, milestoneId);
      setMilestones((prev) => prev.filter((m) => m.milestone_id !== milestoneId));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (milestone: MilestoneOut) => {
    setEditingId(milestone.milestone_id);
    setEditingTitle(milestone.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEdit = async (milestoneId: number) => {
    if (!editingTitle.trim()) return;
    setEditSaving(true);
    try {
      const updated = await updateMilestone(projectId, milestoneId, { title: editingTitle.trim() });
      setMilestones((prev) => prev.map((m) => m.milestone_id === updated.milestone_id ? updated : m));
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Flag className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-primary tracking-tight">Hitos del Proyecto</h2>
        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
          {milestones.filter((m) => m.is_completed).length}/{milestones.length} completados
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Añade un hito (ej: Primera jornada comunitaria realizada)"
          className="flex-grow bg-white border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
        />
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="flex items-center gap-2 px-5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Añadir
        </button>
      </form>

      {milestones.length === 0 ? (
        <p className="text-sm text-outline italic">Aún no has registrado hitos. Documenta los logros clave del proyecto.</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div key={milestone.milestone_id} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-outline-variant/10 group">
              <button
                onClick={() => handleToggle(milestone)}
                aria-label={milestone.is_completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                className={cn('shrink-0 transition-colors', milestone.is_completed ? 'text-emerald-600' : 'text-outline hover:text-primary')}
              >
                {milestone.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>

              {editingId === milestone.milestone_id ? (
                <div className="flex-grow flex items-center gap-2">
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(milestone.milestone_id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="flex-grow bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={() => saveEdit(milestone.milestone_id)}
                    disabled={editSaving || !editingTitle.trim()}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Guardar"
                  >
                    {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 text-outline hover:bg-surface-container-low rounded-lg transition-colors"
                    aria-label="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className={cn('flex-grow text-sm', milestone.is_completed ? 'text-outline line-through' : 'text-primary font-medium')}>
                  {milestone.title}
                </span>
              )}

              {editingId !== milestone.milestone_id && milestone.is_completed && milestone.completed_at && (
                <span className="text-[10px] text-outline uppercase tracking-wider shrink-0">
                  {new Date(milestone.completed_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}

              {editingId !== milestone.milestone_id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    onClick={() => startEdit(milestone)}
                    className="p-1 text-outline hover:text-primary transition-all"
                    aria-label="Editar hito"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(milestone.milestone_id)}
                    className="p-1 text-outline hover:text-error transition-all"
                    aria-label="Eliminar hito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
