import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Flag, CheckCircle2, Circle } from 'lucide-react';
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
              <span className={cn('flex-grow text-sm', milestone.is_completed ? 'text-outline line-through' : 'text-primary font-medium')}>
                {milestone.title}
              </span>
              {milestone.is_completed && milestone.completed_at && (
                <span className="text-[10px] text-outline uppercase tracking-wider shrink-0">
                  {new Date(milestone.completed_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              <button onClick={() => handleDelete(milestone.milestone_id)} className="opacity-0 group-hover:opacity-100 p-1 text-outline hover:text-error transition-all shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
