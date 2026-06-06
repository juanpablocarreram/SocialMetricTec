import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, X, Plus, Check, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  CATEGORIES,
  TestimonyOut,
  createTestimony,
  deleteTestimony,
  getTestimonies,
} from '@/src/services/testimonyService';
import { useAuth } from '../context/AuthContext';

const MIN_CHARS = 50;
const MAX_CHARS = 5000;

export default function TestimonyForm() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [testimonies, setTestimonies] = useState<TestimonyOut[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    getTestimonies(Number(projectId)).then(setTestimonies).catch(console.error);
  }, [projectId]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError('Cada etiqueta debe tener entre 2 y 30 caracteres.');
      return;
    }
    if (tags.length >= 10) {
      setError('Máximo 10 etiquetas.');
      return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (content.trim().length < MIN_CHARS) {
      setError(`El testimonio debe tener al menos ${MIN_CHARS} caracteres.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTestimony(Number(projectId), {
        content: content.trim(),
        category: category || undefined,
        tags,
      });
      setTestimonies([created, ...testimonies]);
      setContent('');
      setCategory('');
      setTags([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Error al guardar el testimonio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (testimonyId: number) => {
    try {
      await deleteTestimony(Number(projectId), testimonyId);
      setTestimonies(testimonies.filter((t) => t.testimony_id !== testimonyId));
    } catch (err) {
      console.error(err);
    }
  };

  const remaining = MAX_CHARS - content.length;
  const isValid = content.trim().length >= MIN_CHARS;

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-24">
      <div className="bg-white border-b border-outline-variant/10 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-outline hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-primary tracking-tight">Testimonios</span>
          </div>
          <Link to={`/project/${projectId}`} className="text-xs font-bold text-outline hover:text-primary transition-colors">
            Ver proyecto
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 mt-10 space-y-10">
        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[28px] p-8 shadow-xl border border-outline-variant/10">
          <h2 className="text-2xl font-extrabold text-primary tracking-tighter mb-1">Añadir testimonio</h2>
          <p className="text-sm text-on-surface-variant mb-8">Comparte tu experiencia subjetiva del proyecto en tus propias palabras.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Tu testimonio</label>
                <span className={cn('text-[10px] font-bold', content.length < MIN_CHARS ? 'text-error' : 'text-emerald-600')}>
                  {content.trim().length} / {MIN_CHARS} mín · {remaining} restantes
                </span>
              </div>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={MAX_CHARS}
                placeholder="Describe tu experiencia, logros, retos o aprendizajes en este proyecto..."
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed transition-all"
              />
              {!isValid && content.length > 0 && (
                <p className="text-[10px] text-error font-bold">Faltan {MIN_CHARS - content.trim().length} caracteres para el mínimo.</p>
              )}
            </div>

            {/* Category */}
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

            {/* Tags */}
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
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {tags.length >= 10 && <p className="text-[10px] text-error font-bold">Límite de 10 etiquetas alcanzado.</p>}
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-error font-medium">
                {error}
              </motion.p>
            )}

            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-700">
                <Check className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">Testimonio guardado correctamente.</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={submitting || !isValid}
              className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enviar Testimonio
            </button>
          </form>
        </motion.div>

        {/* List */}
        {testimonies.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-primary tracking-tight">Testimonios del proyecto</h3>
            {testimonies.map((t, i) => (
              <motion.div key={t.testimony_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 relative group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-primary">{t.display_name ?? t.author_username}</p>
                    <p className="text-[10px] text-outline">{new Date(t.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.category && <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/5 text-primary px-3 py-1 rounded-full">{t.category}</span>}
                    {(user?.is_admin || user?.username === t.author_username) && (
                      <button onClick={() => handleDelete(t.testimony_id)} className="p-1.5 text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-error/5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{t.content}</p>
                {t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-bold px-2 py-0.5 bg-surface-container-low text-outline rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
