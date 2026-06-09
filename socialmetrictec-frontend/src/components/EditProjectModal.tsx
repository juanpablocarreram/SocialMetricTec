import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, CloudUpload, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { updateProjectInfo, formatArea, ProjectFull } from '@/src/services/projectService';
import { uploadMediaStandalone } from '@/src/services/mediaService';
import api from '@/src/lib/axios';

const STRATEGIC_AREAS = [
  { label: 'Fin de la pobreza',              value: 'ods_1',  img: '/sdg/ods-1.jpg' },
  { label: 'Hambre cero',                    value: 'ods_2',  img: '/sdg/ods-2.jpg' },
  { label: 'Salud y bienestar',              value: 'ods_3',  img: '/sdg/ods-3.jpg' },
  { label: 'Educación de calidad',           value: 'ods_4',  img: '/sdg/ods-4.jpg' },
  { label: 'Igualdad de género',             value: 'ods_5',  img: '/sdg/ods-5.jpg' },
  { label: 'Agua limpia y saneamiento',      value: 'ods_6',  img: '/sdg/ods-6.jpg' },
  { label: 'Energía asequible',              value: 'ods_7',  img: '/sdg/ods-7.jpg' },
  { label: 'Trabajo decente',                value: 'ods_8',  img: '/sdg/ods-8.jpg' },
  { label: 'Industria e infraestructura',    value: 'ods_9',  img: '/sdg/ods-9.jpg' },
  { label: 'Reducción de desigualdades',     value: 'ods_10', img: '/sdg/ods-10.jpg' },
  { label: 'Ciudades sostenibles',           value: 'ods_11', img: '/sdg/ods-11.jpg' },
  { label: 'Producción responsable',         value: 'ods_12', img: '/sdg/ods-12.jpg' },
  { label: 'Acción por el clima',            value: 'ods_13', img: '/sdg/ods-13.jpg' },
  { label: 'Vida submarina',                 value: 'ods_14', img: '/sdg/ods-14.jpg' },
  { label: 'Vida de ecosistemas terrestres', value: 'ods_15', img: '/sdg/ods-15.jpg' },
  { label: 'Paz, justicia e instituciones',  value: 'ods_16', img: '/sdg/ods-16.jpg' },
  { label: 'Alianzas para los objetivos',    value: 'ods_17', img: '/sdg/ods-17.jpg' },
];

const DESC_MIN = 100;
const DESC_MAX = 500;

interface Props {
  projectId: number;
  onClose: () => void;
  onSaved: (updated: ProjectFull) => void;
}

export default function EditProjectModal({ projectId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    objetivo: '',
    beneficiarios: '0',
    area: 'ods_1',
    image: '',
  });

  useEffect(() => {
    api.get(`/project/${projectId}`)
      .then((res) => {
        const p = res.data;
        setForm({
          name: p.project_name ?? '',
          description: p.description ?? '',
          objetivo: p.objetivo ?? '',
          beneficiarios: String(p.numero_beneficiarios ?? 0),
          area: p.impact_area ?? 'ods_1',
          image: p.cover_image_url ?? '',
        });
      })
      .catch(() => setError('No se pudo cargar la información del proyecto.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setImageUploadError('');
    try {
      const { url } = await uploadMediaStandalone(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch {
      setImageUploadError('No se pudo subir la imagen.');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const descLen = form.description.trim().length;
    if (descLen < DESC_MIN || descLen > DESC_MAX) {
      setError(`El resumen debe tener entre ${DESC_MIN} y ${DESC_MAX} caracteres. Actualmente: ${descLen}.`);
      return;
    }

    const beneficiarios = Number(form.beneficiarios);
    if (form.beneficiarios.trim() === '' || !Number.isInteger(beneficiarios) || beneficiarios < 0) {
      setError('El número de beneficiarios debe ser un entero mayor o igual a 0.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProjectInfo(projectId, {
        project_name: form.name,
        description: form.description,
        objetivo: form.objetivo,
        numero_beneficiarios: beneficiarios,
        impact_area: form.area,
        cover_image_url: form.image,
      });
      setSaved(true);
      window.dispatchEvent(new CustomEvent('project-updated'));
      onSaved(updated);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-[32px] w-full max-w-2xl shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-8 pb-0">
          <div>
            <h2 className="text-2xl font-extrabold text-primary tracking-tighter">Editar Proyecto</h2>
            <p className="text-xs text-outline mt-1">Modifica la información base del proyecto.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-outline hover:text-error hover:bg-error/5 transition-all"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Nombre del Proyecto</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-2xl font-extrabold tracking-tighter text-primary placeholder:text-outline-variant/30 border-none bg-transparent focus:ring-0 p-0 outline-none"
              />
              <div className="h-0.5 w-16 bg-primary/20 rounded-full" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Resumen del Proyecto</label>
                <span className={cn(
                  'text-[10px] font-bold',
                  form.description.length > 0 && (form.description.trim().length < DESC_MIN || form.description.trim().length > DESC_MAX)
                    ? 'text-error'
                    : form.description.trim().length >= DESC_MIN
                    ? 'text-emerald-600'
                    : 'text-outline',
                )}>
                  {form.description.trim().length} / {DESC_MIN}–{DESC_MAX}
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary transition-all outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Objetivo Principal</label>
              <textarea
                rows={3}
                value={form.objetivo}
                onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary transition-all outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Número de Beneficiarios</label>
              <input
                required
                type="number"
                min={0}
                step={1}
                value={form.beneficiarios}
                onChange={(e) => setForm({ ...form, beneficiarios: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Imagen de Presentación</label>
              <div
                className={cn(
                  'group relative aspect-video rounded-2xl overflow-hidden bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex items-center justify-center transition-all',
                  !form.image && 'cursor-pointer hover:border-primary/50',
                )}
                onClick={() => !imageUploading && !form.image && imageInputRef.current?.click()}
              >
                {form.image ? (
                  <>
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 hover:bg-black/40 transition-colors opacity-0 hover:opacity-100"
                    >
                      <CloudUpload className="w-8 h-8 text-white" />
                      <span className="text-white text-xs font-bold">Cambiar imagen</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                      {imageUploading
                        ? <Loader2 className="w-6 h-6 animate-spin" />
                        : <CloudUpload className="w-6 h-6" />}
                    </div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">
                      {imageUploading ? 'Subiendo...' : 'Haz clic para subir o pega una URL'}
                    </p>
                  </div>
                )}
              </div>
              {imageUploadError && (
                <div className="flex items-center gap-1.5 text-error text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle className="w-3 h-3" /> {imageUploadError}
                </div>
              )}
              <input
                type="text"
                placeholder="https://..."
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageFile}
                className="hidden"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest">ODS</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {STRATEGIC_AREAS.map((area) => (
                  <button
                    key={area.value}
                    type="button"
                    aria-pressed={form.area === area.value}
                    onClick={() => setForm({ ...form, area: area.value })}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border-2',
                      form.area === area.value
                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                        : 'border-transparent bg-surface-container-low hover:border-primary/30',
                    )}
                  >
                    <img src={area.img} alt={area.label} className="w-full aspect-square rounded-lg object-cover" />
                    <span className={cn(
                      'text-[8px] font-bold uppercase tracking-wider text-center leading-tight',
                      form.area === area.value ? 'text-primary' : 'text-outline',
                    )}>
                      {area.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-outline/40 text-right">
                Actual: {formatArea(form.area)}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-error text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || saved}
                className="flex-1 py-3 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saved && <Check className="w-4 h-4" />}
                {saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
