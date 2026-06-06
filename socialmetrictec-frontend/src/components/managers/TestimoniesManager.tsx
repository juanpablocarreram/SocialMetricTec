import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Trash2, Check, Loader2, MessageSquare, Pencil } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  getTestimonies,
  createTestimony,
  deleteTestimony,
  patchTestimonyDisplayName,
  TestimonyOut,
  CATEGORIES,
} from '@/src/services/testimonyService';
import { useAuth } from '../../context/AuthContext';

export default function TestimoniesManager({ projectId }: { projectId: number }) {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<TestimonyOut[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  useEffect(() => {
    getTestimonies(projectId).then(setTestimonies).catch(console.error);
  }, [projectId]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) return;
    if (tag.length < 2 || tag.length > 30) {
      setError('Cada etiqueta debe tener entre 2 y 30 caracteres.');
      return;
    }
    if (tags.length >= 10) {
      setError('Máximo 10 etiquetas.');
      return;
    }
    setTags([...tags, tag]);
    setTagInput('');
    setError('');
  };

  const resetForm = () => {
    setDisplayName('');
    setContent('');
    setCategory('');
    setTags([]);
    setTagInput('');
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 50) {
      setError('El testimonio debe tener al menos 50 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTestimony(projectId, {
        content: content.trim(),
        category: category || undefined,
        tags,
        display_name: displayName.trim() || undefined,
      });
      setTestimonies((prev) => [created, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Error al guardar el testimonio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (testimonyId: number) => {
    try {
      await deleteTestimony(projectId, testimonyId);
      setTestimonies((prev) => prev.filter((t) => t.testimony_id !== testimonyId));
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingName = (t: TestimonyOut) => {
    setEditingNameId(t.testimony_id);
    setEditingNameValue(t.display_name ?? t.author_username);
  };

  const saveDisplayName = async (testimonyId: number) => {
    const trimmed = editingNameValue.trim() || null;
    try {
      const updated = await patchTestimonyDisplayName(projectId, testimonyId, trimmed);
      setTestimonies((prev) => prev.map((t) => t.testimony_id === testimonyId ? updated : t));
    } catch (err) {
      console.error(err);
    } finally {
      setEditingNameId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary tracking-tight">Testimonios del Proyecto</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-outline font-bold uppercase tracking-widest">{testimonies.length} testimonio{testimonies.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Testimonio
          </button>
        </div>
      </div>

      {testimonies.length === 0 ? (
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="w-full py-12 border-2 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center gap-3 text-outline hover:border-primary/30 hover:text-primary transition-all"
        >
          <MessageSquare className="w-8 h-8 opacity-40" />
          <span className="text-xs font-bold uppercase tracking-widest">Documenta experiencias, logros y aprendizajes del equipo</span>
        </button>
      ) : (
        <div className="space-y-4">
          {testimonies.map((t) => {
            const name = t.display_name ?? t.author_username;
            const canEdit = user?.is_admin || user?.username === t.author_username;
            const isEditingName = editingNameId === t.testimony_id;
            return (
              <div key={t.testimony_id} className="relative bg-white rounded-2xl border border-outline-variant/10 shadow-sm group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/50 transition-colors" />
                <div className="p-6 pl-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-extrabold text-primary">{name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        {isEditingName ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveDisplayName(t.testimony_id);
                                if (e.key === 'Escape') setEditingNameId(null);
                              }}
                              className="text-sm font-bold text-primary bg-surface-container-lowest border border-primary/30 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary/30 w-44"
                            />
                            <button onClick={() => saveDisplayName(t.testimony_id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingNameId(null)} className="p-1 text-outline hover:bg-surface-container-low rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-primary">{name}</p>
                            {canEdit && (
                              <button onClick={() => startEditingName(t)} className="opacity-0 group-hover:opacity-100 p-1 text-outline hover:text-primary transition-all rounded-lg hover:bg-surface-container-low">
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-outline mt-0.5">{new Date(t.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.category && <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10">{t.category}</span>}
                      {canEdit && (
                        <button onClick={() => handleDelete(t.testimony_id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-outline hover:text-error transition-all rounded-lg hover:bg-error/5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-4 italic break-words">"{t.content}"</p>
                  {t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {t.tags.map((tag) => <span key={tag} className="text-[9px] font-bold px-2.5 py-1 bg-surface-container-low text-outline rounded-full">{tag}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-outline hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Nuevo Testimonio</h2>
                <p className="text-on-surface-variant font-light text-sm mt-2 font-body">Comparte tu experiencia subjetiva del proyecto en tus propias palabras.</p>
              </div>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Nombre del autor</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={user?.username ?? 'Nombre visible en el testimonio'}
                    maxLength={255}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Tu testimonio</label>
                    <span className={cn('text-[10px] font-bold', content.trim().length < 50 ? 'text-error' : 'text-emerald-600')}>
                      {content.trim().length} / 50 mín · {5000 - content.length} restantes
                    </span>
                  </div>
                  <textarea
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={5000}
                    placeholder="Describe tu experiencia, logros, retos o aprendizajes en este proyecto..."
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Categoría</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(category === cat ? '' : cat)}
                        className={cn(
                          'px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border',
                          category === cat ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:border-outline-variant/30',
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Etiquetas ({tags.length}/10)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Escribe y presiona Enter o +"
                      maxLength={30}
                      disabled={tags.length >= 10}
                      className="flex-grow bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                    />
                    <button type="button" onClick={addTag} disabled={tags.length >= 10} className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-40">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {tags.map((tag) => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                          {tag}
                          <button type="button" onClick={() => setTags(tags.filter((x) => x !== tag))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-error font-medium">{error}</motion.p>}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting || content.trim().length < 50} className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Enviar Testimonio
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
