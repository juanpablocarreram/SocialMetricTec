import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Trash2, Check, Loader2, MessageSquare, Pencil, Upload, Download, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  getTestimonies,
  createTestimony,
  deleteTestimony,
  patchTestimonyDisplayName,
  importTestimoniesCSV,
  TestimonyOut,
  CsvImportResult,
  CATEGORIES,
} from '@/src/services/testimonyService';
import { useAuth } from '../../context/AuthContext';

type ModalView = 'choice' | 'manual' | 'csv' | null;

export default function TestimoniesManager({ projectId }: { projectId: number }) {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<TestimonyOut[]>([]);

  // modal
  const [modalView, setModalView] = useState<ModalView>(null);

  // manual form
  const [displayName, setDisplayName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // inline name editing
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // csv
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null);
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTestimonies(projectId).then(setTestimonies).catch(console.error);
  }, [projectId]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const openModal = (view: ModalView = 'choice') => {
    setDisplayName(''); setContent(''); setCategory(''); setTags([]); setTagInput(''); setFormError('');
    setCsvFile(null); setCsvResult(null); setCsvError('');
    setModalView(view);
  };

  const closeModal = () => setModalView(null);

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) return;
    if (tag.length < 2 || tag.length > 30) { setFormError('Cada etiqueta debe tener entre 2 y 30 caracteres.'); return; }
    if (tags.length >= 10) { setFormError('Máximo 10 etiquetas.'); return; }
    setTags([...tags, tag]);
    setTagInput('');
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 50) { setFormError('El testimonio debe tener al menos 50 caracteres.'); return; }
    setSubmitting(true);
    try {
      const created = await createTestimony(projectId, {
        content: content.trim(),
        category: category || undefined,
        tags,
        display_name: displayName.trim() || undefined,
      });
      setTestimonies((prev) => [created, ...prev]);
      closeModal();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail ?? 'Error al guardar el testimonio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvError('');
    setCsvResult(null);
    try {
      const result = await importTestimoniesCSV(projectId, csvFile);
      setCsvResult(result);
      if (result.created > 0) setTestimonies(await getTestimonies(projectId));
    } catch (err: any) {
      setCsvError(err?.response?.data?.detail ?? 'Error al procesar el archivo.');
    } finally {
      setCsvImporting(false);
    }
  };

  const downloadTemplate = () => {
    const header = 'display_name,content,category,tags';
    const example = `"Ana García","Este proyecto transformó mi manera de entender el trabajo colaborativo y el impacto en la comunidad. Aprendí a comunicarme mejor y a valorar cada aporte del equipo.","Aprendizajes","equipo,comunidad,aprendizaje"`;
    const blob = new Blob(['﻿' + header + '\n' + example], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_testimonios.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const startEditingName = (t: TestimonyOut) => { setEditingNameId(t.testimony_id); setEditingNameValue(t.display_name ?? t.author_username); };

  const saveDisplayName = async (testimonyId: number) => {
    try {
      const updated = await patchTestimonyDisplayName(projectId, testimonyId, editingNameValue.trim() || null);
      setTestimonies((prev) => prev.map((t) => t.testimony_id === testimonyId ? updated : t));
    } catch (err) { console.error(err); }
    finally { setEditingNameId(null); }
  };

  const handleDelete = async (testimonyId: number) => {
    try {
      await deleteTestimony(projectId, testimonyId);
      setTestimonies((prev) => prev.filter((t) => t.testimony_id !== testimonyId));
    } catch (err) { console.error(err); }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header — sin botones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary tracking-tight">Testimonios del Proyecto</h2>
        </div>
        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
          {testimonies.length} testimonio{testimonies.length !== 1 ? 's' : ''}
        </span>
      </div>

      {testimonies.length === 0 ? (
        /* Empty state — único punto de entrada */
        <button
          onClick={() => openModal('choice')}
          className="w-full py-12 border-2 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center gap-3 text-outline hover:border-primary/30 hover:text-primary transition-all"
        >
          <MessageSquare className="w-8 h-8 opacity-40" />
          <span className="text-xs font-bold uppercase tracking-widest">Documenta experiencias, logros y aprendizajes</span>
          <span className="text-[10px] font-medium opacity-60">Haz clic para insertar manualmente o importar desde CSV</span>
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
                              onKeyDown={(e) => { if (e.key === 'Enter') saveDisplayName(t.testimony_id); if (e.key === 'Escape') setEditingNameId(null); }}
                              className="text-sm font-bold text-primary bg-surface-container-lowest border border-primary/30 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary/30 w-44"
                            />
                            <button onClick={() => saveDisplayName(t.testimony_id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingNameId(null)} className="p-1 text-outline hover:bg-surface-container-low rounded-lg transition-colors"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-primary">{name}</p>
                            {canEdit && (
                              <button onClick={() => startEditingName(t)} className="opacity-0 group-hover:opacity-100 p-1 text-outline hover:text-primary transition-all rounded-lg hover:bg-surface-container-low">
                                <Pencil className="w-3 h-3 cursor-pointer" />
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
                          <Trash2 className="w-4 h-4 cursor-pointer" />
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

          {/* Compact add row — siempre visible cuando hay testimonios */}
          <button
            onClick={() => openModal('choice')}
            className="w-full cursor-pointer py-4 border border-dashed border-outline-variant/20 rounded-2xl flex items-center justify-center gap-2 text-outline hover:border-primary/30 hover:text-primary transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> Agregar testimonio
          </button>
        </div>
      )}

      {/* ── Modal unificado ─────────────────────────────────────────────────── */}
      {modalView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            key={modalView}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative bg-white rounded-[32px] shadow-2xl p-10 max-h-[90vh] overflow-y-auto w-full',
              modalView === 'csv' ? 'max-w-2xl' : 'max-w-xl',
            )}
          >
            {/* Cerrar */}
            <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-outline hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>

            {/* ── Choice ── */}
            {modalView === 'choice' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Agregar Testimonio</h2>
                  <p className="text-on-surface-variant font-light text-sm mt-2">Elige cómo deseas registrar el testimonio.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setModalView('manual')}
                    className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-outline-variant/10 hover:border-primary/30 hover:bg-primary/5 transition-all group text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-primary tracking-tight">Inserción manual</p>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Escribe un testimonio directamente en el formulario.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setModalView('csv')}
                    className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-outline-variant/10 hover:border-primary/30 hover:bg-primary/5 transition-all group text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-primary tracking-tight">Importar CSV</p>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Carga múltiples testimonios a la vez desde un archivo.</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── Manual ── */}
            {modalView === 'manual' && (
              <div className="space-y-8">
                <div>
                  <button onClick={() => setModalView('choice')} className="flex items-center gap-1 text-xs font-bold text-outline hover:text-primary transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4" /> Volver
                  </button>
                  <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Nuevo Testimonio</h2>
                  <p className="text-on-surface-variant font-light text-sm mt-2">Comparte tu experiencia subjetiva del proyecto en tus propias palabras.</p>
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
                            <button type="button" onClick={() => setTags(tags.filter((x) => x !== tag))}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {formError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-error font-medium">{formError}</motion.p>}
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setModalView('choice')} className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all">
                      Cancelar
                    </button>
                    <button type="submit" disabled={submitting || content.trim().length < 50} className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Enviar Testimonio
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── CSV ── */}
            {modalView === 'csv' && (
              <div className="space-y-8">
                <div>
                  <button onClick={() => setModalView('choice')} className="flex items-center gap-1 text-xs font-bold text-outline hover:text-primary transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4" /> Volver
                  </button>
                  <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Importar desde CSV</h2>
                  <p className="text-on-surface-variant font-light text-sm mt-2">Carga múltiples testimonios a la vez desde un archivo CSV.</p>
                </div>

                {/* Guía de formato */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 space-y-4 border border-outline-variant/10">
                  <h3 className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">Formato requerido</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    La <strong>primera fila</strong> debe contener exactamente los nombres de columna. Cada fila siguiente es un testimonio independiente.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20">
                          <th className="text-left py-2 pr-4 font-bold text-on-surface w-32">Columna</th>
                          <th className="text-left py-2 pr-4 font-bold text-on-surface w-24">Tipo</th>
                          <th className="text-left py-2 font-bold text-on-surface">Reglas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-primary">content</td>
                          <td className="py-2 pr-4 text-on-surface-variant">Obligatorio</td>
                          <td className="py-2 text-on-surface-variant">Texto entre 50 y 5,000 caracteres.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-on-surface-variant">display_name</td>
                          <td className="py-2 pr-4 text-on-surface-variant">Opcional</td>
                          <td className="py-2 text-on-surface-variant">Nombre visible del autor. Máx. 255 caracteres.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-on-surface-variant">category</td>
                          <td className="py-2 pr-4 text-on-surface-variant">Opcional</td>
                          <td className="py-2 text-on-surface-variant">Debe ser una de las categorías válidas (ver abajo) o dejarse vacía.</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono font-bold text-on-surface-variant">tags</td>
                          <td className="py-2 pr-4 text-on-surface-variant">Opcional</td>
                          <td className="py-2 text-on-surface-variant">
                            Separadas por coma. Máx. 10. Cada una entre 2 y 30 caracteres.{' '}
                            <span className="font-mono bg-surface-container px-1 rounded">equipo,impacto,logros</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Categorías válidas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <span key={cat} className="text-[10px] px-2.5 py-1 bg-white border border-outline-variant/20 text-on-surface-variant rounded-full font-medium">{cat}</span>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={downloadTemplate} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline mt-1">
                    <Download className="w-3.5 h-3.5" /> Descargar plantilla de ejemplo
                  </button>
                </div>

                {/* File picker */}
                {!csvResult && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Archivo CSV</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => { setCsvFile(e.target.files?.[0] ?? null); setCsvError(''); }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all',
                        csvFile ? 'border-primary/40 bg-primary/5 text-primary' : 'border-outline-variant/30 text-outline hover:border-primary/30 hover:text-primary',
                      )}
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-bold text-center">
                        {csvFile ? csvFile.name : 'Haz clic para seleccionar un archivo .csv'}
                      </span>
                      {csvFile && <span className="text-[10px] opacity-60">{(csvFile.size / 1024).toFixed(1)} KB</span>}
                    </div>
                    {csvError && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 text-sm text-error font-medium bg-error/5 rounded-xl p-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{csvError}</span>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Resultados */}
                {csvResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className={cn('flex items-center gap-3 rounded-2xl p-4', csvResult.created > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-container-low text-on-surface-variant')}>
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold">
                        {csvResult.created === 0
                          ? 'No se importó ningún testimonio.'
                          : `${csvResult.created} testimonio${csvResult.created !== 1 ? 's' : ''} importado${csvResult.created !== 1 ? 's' : ''} correctamente.`}
                      </span>
                    </div>
                    {csvResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-error uppercase tracking-widest">{csvResult.errors.length} fila{csvResult.errors.length !== 1 ? 's' : ''} con errores</p>
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                          {csvResult.errors.map((e) => (
                            <div key={e.row} className="bg-error/5 border border-error/10 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-error uppercase tracking-widest mb-1">Fila {e.row}</p>
                              <ul className="space-y-0.5">
                                {e.errors.map((msg, idx) => (
                                  <li key={idx} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-error" />
                                    {msg}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setCsvResult(null); setCsvFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Importar otro archivo
                    </button>
                  </motion.div>
                )}

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setModalView('choice')} className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all">
                    Cancelar
                  </button>
                  {!csvResult && (
                    <button
                      type="button"
                      onClick={handleCsvImport}
                      disabled={!csvFile || csvImporting}
                      className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {csvImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Importar
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
