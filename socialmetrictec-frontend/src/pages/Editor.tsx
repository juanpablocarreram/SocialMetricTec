import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Trash2, Image as ImageIcon, Video,
  AlignLeft, Minus, Check, Loader2, Eye, Pencil, GripVertical,
  Layout, BarChart3, Camera, MessageSquare, Flag, Type,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getProject, savePage, BackendPage } from '@/src/services/pageService';
import { getMetrics, type MetricOut } from '@/src/services/metricService';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { PagePreview } from '../components/BlockRenderer';
import NoProjectSelected from '../components/NoProjectSelected';
import UploadButton from '../components/UploadButton';
import MetricsManager from '../components/managers/MetricsManager';
import PhotosManager from '../components/managers/PhotosManager';
import TestimoniesManager from '../components/managers/TestimoniesManager';
import MilestonesManager from '../components/managers/MilestonesManager';
import ReportButton from '../components/managers/ReportButton';
import { cn } from '@/src/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionType = 'text' | 'image' | 'video' | 'divider' | 'metrics';

interface Section {
  id: string;
  type: SectionType;
  title?: string;
  body?: string;
  quote?: string;
  url?: string;
  caption?: string;
}

interface PageState {
  coverImage: string;
  headline: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  sections: Section[];
}

const DEFAULT_STATE: PageState = {
  coverImage: '',
  headline: '',
  subtitle: '',
  primaryColor: '#002068',
  secondaryColor: '#525d85',
  fontFamily: "'Manrope', sans-serif",
  sections: [],
};

const SECTION_META: Record<SectionType, { label: string; dot: string; icon: typeof Type }> = {
  text:    { label: 'Texto',     dot: '#3b82f6', icon: AlignLeft },
  image:   { label: 'Imagen',    dot: '#10b981', icon: ImageIcon },
  video:   { label: 'Video',     dot: '#8b5cf6', icon: Video },
  divider: { label: 'Separador', dot: '#9ca3af', icon: Minus },
  metrics: { label: 'Métricas',  dot: '#f59e0b', icon: BarChart3 },
};

const isMetrics = (s: Section) => s.type === 'metrics';

// ─── Font palette ─────────────────────────────────────────────────────────────

const FONTS: { name: string; css: string; label: string }[] = [
  { name: 'Manrope',             css: "'Manrope', sans-serif",             label: 'Manrope'   },
  { name: 'Plus Jakarta Sans',   css: "'Plus Jakarta Sans', sans-serif",   label: 'Jakarta'   },
  { name: 'Bricolage Grotesque', css: "'Bricolage Grotesque', sans-serif", label: 'Bricolage' },
  { name: 'Syne',                css: "'Syne', sans-serif",                label: 'Syne'      },
  { name: 'Unbounded',           css: "'Unbounded', sans-serif",           label: 'Unbound.'  },
  { name: 'Outfit',              css: "'Outfit', sans-serif",              label: 'Outfit'    },
  { name: 'Raleway',             css: "'Raleway', sans-serif",             label: 'Raleway'   },
  { name: 'Inter',               css: "'Inter', sans-serif",               label: 'Inter'     },
  { name: 'Playfair Display',    css: "'Playfair Display', serif",         label: 'Playfair'  },
  { name: 'Cormorant Garamond',  css: "'Cormorant Garamond', serif",       label: 'Cormorant' },
  { name: 'Fraunces',            css: "'Fraunces', serif",                 label: 'Fraunces'  },
  { name: 'DM Serif Display',    css: "'DM Serif Display', serif",         label: 'DM Serif'  },
  { name: 'Instrument Serif',    css: "'Instrument Serif', serif",         label: 'Instrmt.'  },
  { name: 'Merriweather',        css: "'Merriweather', serif",             label: 'Merriw.'   },
  { name: 'Source Code Pro',     css: "'Source Code Pro', monospace",      label: 'Mono'      },
];

function FontCarousel({ value, onChange }: { value: string; onChange: (css: string) => void }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const active = FONTS.find((f) => f.css === value) ?? FONTS[0];

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    dragStartX.current = e.pageX - carouselRef.current.offsetLeft;
    dragScrollLeft.current = carouselRef.current.scrollLeft;
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    carouselRef.current.scrollLeft = dragScrollLeft.current - (x - dragStartX.current) * 1.4;
  };
  const stopDrag = () => { isDragging.current = false; };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-8 h-8 rounded-lg bg-white border border-outline-variant/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0"
          style={{ fontFamily: active.css }}
        >
          Ag
        </div>
        <div>
          <div className="text-[11px] font-bold text-primary">{active.name}</div>
          <div className="text-[10px] text-outline">Tipografía activa</div>
        </div>
      </div>
      <div className="-mx-1 overflow-hidden">
        <div
          ref={carouselRef}
          className="flex gap-1.5 overflow-x-auto pb-2 px-1 select-none"
          style={{ scrollbarWidth: 'none', cursor: isDragging.current ? 'grabbing' : 'grab' } as React.CSSProperties}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseLeave={stopDrag}
          onMouseUp={stopDrag}
        >
          {FONTS.map((font) => (
            <button
              key={font.name}
              onClick={() => onChange(font.css)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border-[1.5px] transition-all',
                value === font.css
                  ? 'bg-primary border-primary'
                  : 'bg-white border-outline-variant/20 hover:border-primary/40',
              )}
            >
              <span
                className={cn('text-lg font-bold leading-none', value === font.css ? 'text-white' : 'text-primary')}
                style={{ fontFamily: font.css }}
              >
                Ag
              </span>
              <span className={cn('text-[8px] font-bold uppercase tracking-wide whitespace-nowrap', value === font.css ? 'text-white/60' : 'text-outline')}>
                {font.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-[9px] text-outline/40 text-center mt-0.5">← arrastra para ver más →</p>
    </div>
  );
}

// ─── Serialization ────────────────────────────────────────────────────────────

function toBackendPage(state: PageState): BackendPage {
  return {
    blocks: [
      { type: 'hero', props: { headline: state.headline, subtitle: state.subtitle, url: state.coverImage } },
      ...state.sections.map((s) => {
        if (s.type === 'metrics') return { type: 'metrics', props: {} };
        return {
          type: s.type === 'text' ? 'narrative' : s.type,
          props: {
            title: s.title ?? '',
            body: s.body ?? '',
            quote: s.quote ?? '',
            url: s.url ?? '',
            caption: s.caption ?? '',
          },
        };
      }),
    ],
    general_props: {
      styles: {
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
        fontFamily: state.fontFamily,
      },
    },
  };
}

function fromBackendPage(page: BackendPage, fallback: { name: string; description: string }): PageState {
  const hero = page.blocks.find((b) => b.type === 'hero');
  const sections: Section[] = page.blocks
    .filter((b) => b.type !== 'hero')
    .map((b, i) => ({
      id: `${b.type}-${i}-${Date.now()}`,
      type: (b.type === 'narrative' ? 'text' : b.type) as SectionType,
      title: b.props.title as string,
      body: b.props.body as string,
      quote: b.props.quote as string,
      url: b.props.url as string,
      caption: b.props.caption as string,
    }))
    // La sección Métricas siempre queda anclada al frente, debajo de la portada.
    .sort((a, b) => Number(isMetrics(b)) - Number(isMetrics(a)));
  const styles = (page.general_props?.styles ?? {}) as {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  return {
    coverImage: (hero?.props.url as string) ?? '',
    headline: (hero?.props.headline as string) ?? fallback.name,
    subtitle: (hero?.props.subtitle as string) ?? fallback.description,
    primaryColor: styles.primaryColor ?? '#002068',
    secondaryColor: styles.secondaryColor ?? '#525d85',
    fontFamily: styles.fontFamily ?? "'Manrope', sans-serif",
    sections,
  };
}

const sectionLabel = (s: Section) => {
  if (s.type === 'text') return s.title?.trim() || 'Texto sin título';
  if (s.type === 'divider') return 'Separador';
  if (s.type === 'metrics') return 'Métricas';
  return s.title?.trim() || s.caption?.trim() || SECTION_META[s.type].label;
};

// ─── Sidebar sortable tag ─────────────────────────────────────────────────────

function SortableTag({ section, onSelect }: { section: Section; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const meta = SECTION_META[section.type];
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-xl bg-white border border-outline-variant/10 pr-2 group',
        isDragging && 'shadow-lg ring-2 ring-primary/20 z-10',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-outline-variant hover:text-primary cursor-grab active:cursor-grabbing touch-none"
        aria-label="Reordenar"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <button onClick={onSelect} className="flex items-center gap-2 flex-grow py-2.5 min-w-0 text-left">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
        <span className="text-xs font-semibold text-primary truncate">{sectionLabel(section)}</span>
      </button>
    </div>
  );
}

// ─── Section editors ──────────────────────────────────────────────────────────

function SectionCard({ type, onDelete, children }: { type: SectionType; onDelete: () => void; children: React.ReactNode }) {
  const meta = SECTION_META[type];
  return (
    <div className="rounded-2xl border border-outline-variant/10 overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 bg-surface-container-low/50 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.dot }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{meta.label}</span>
        </div>
        <button onClick={onDelete} className="p-1.5 text-outline-variant hover:text-error hover:bg-error/5 rounded-lg transition-all" title="Eliminar sección">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function TextSection({ section, onChange, fontFamily }: {
  section: Section;
  onChange: (s: Partial<Section>) => void;
  fontFamily: string;
}) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={section.title ?? ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Título de la sección (opcional)"
        className="w-full text-xl font-bold text-primary bg-transparent border-none outline-none placeholder:text-outline-variant/30"
        style={{ fontFamily }}
      />
      <div className="h-px bg-outline-variant/10" />
      <textarea
        value={section.body ?? ''}
        onChange={(e) => onChange({ body: e.target.value })}
        placeholder="Escribe aquí el contenido de esta sección..."
        className="w-full text-base text-on-surface-variant bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-outline-variant/30"
        style={{ fontFamily }}
        rows={5}
      />
      <div className="border-l-4 border-primary/20 pl-4">
        <textarea
          value={section.quote ?? ''}
          onChange={(e) => onChange({ quote: e.target.value })}
          placeholder="Cita destacada (opcional)..."
          className="w-full italic text-outline bg-transparent border-none outline-none resize-none placeholder:text-outline-variant/20 text-sm"
          style={{ fontFamily }}
          rows={2}
        />
      </div>
    </div>
  );
}

function ImageSection({ section, onChange }: { section: Section; onChange: (s: Partial<Section>) => void }) {
  return (
    <div className="space-y-4">
      {section.url ? (
        <img src={section.url} alt="" className="w-full aspect-video object-cover rounded-xl" />
      ) : (
        <div className="w-full aspect-video rounded-xl bg-surface-container flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/20 gap-3">
          <ImageIcon className="w-10 h-10 text-outline/30" />
          <p className="text-sm text-outline/40">Sube una imagen o pega su URL abajo</p>
        </div>
      )}
      <input
        type="url"
        value={section.url ?? ''}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="URL de la imagen (https://...)"
        className="w-full text-sm bg-surface-container-low rounded-xl px-4 py-3 outline-none border border-outline-variant/20 focus:border-primary/40 transition-colors placeholder:text-outline/30 font-mono"
      />
      <UploadButton
        label="Subir imagen"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onUploaded={(url) => onChange({ url })}
      />
      <input
        type="text"
        value={section.caption ?? ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Leyenda de la imagen (opcional)"
        className="w-full text-sm text-center text-on-surface-variant bg-transparent border-none outline-none placeholder:text-outline-variant/30"
      />
    </div>
  );
}

function VideoSection({ section, onChange }: { section: Section; onChange: (s: Partial<Section>) => void }) {
  return (
    <div className="space-y-4">
      {section.url ? (
        <video src={section.url} controls className="w-full rounded-xl bg-black max-h-[360px]" />
      ) : (
        <div className="w-full aspect-video rounded-xl bg-surface-container flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/20 gap-3">
          <Video className="w-10 h-10 text-outline/30" />
          <p className="text-sm text-outline/40">Sube un video o pega su URL abajo</p>
        </div>
      )}
      <input
        type="url"
        value={section.url ?? ''}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="URL del video (https://...)"
        className="w-full text-sm bg-surface-container-low rounded-xl px-4 py-3 outline-none border border-outline-variant/20 focus:border-primary/40 transition-colors placeholder:text-outline/30 font-mono"
      />
      <UploadButton
        label="Subir video"
        accept="video/mp4,video/webm"
        onUploaded={(url) => onChange({ url })}
      />
      <input
        type="text"
        value={section.title ?? ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Título del video (opcional)"
        className="w-full text-sm font-bold text-primary bg-transparent border-none outline-none placeholder:text-outline-variant/30"
      />
    </div>
  );
}

function DividerSection() {
  return (
    <div className="py-2">
      <div className="h-px bg-outline-variant/20 rounded-full" />
      <p className="text-center text-[10px] text-outline/30 mt-3 uppercase tracking-widest">Línea separadora</p>
    </div>
  );
}

function MetricsSection({ onManage }: { onManage: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <BarChart3 className="w-6 h-6 text-amber-500" />
      </div>
      <p className="text-sm text-on-surface-variant max-w-md">
        Esta sección mostrará automáticamente todas las métricas del proyecto. Edítalas en el panel de Métricas.
      </p>
      <button
        onClick={onManage}
        className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
      >
        Gestionar métricas
      </button>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

const PANELS = [
  { id: 'panel-metrics', label: 'Métricas', icon: BarChart3 },
  { id: 'panel-photos', label: 'Galería', icon: Camera },
  { id: 'panel-testimonies', label: 'Testimonios', icon: MessageSquare },
  { id: 'panel-milestones', label: 'Hitos', icon: Flag },
];

export default function Editor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProject, loadingProjects } = useProject();
  const [state, setState] = useState<PageState>(DEFAULT_STATE);
  const [projectName, setProjectName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [metrics, setMetrics] = useState<MetricOut[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!currentProject || !user) return;
    setLoading(true);
    getProject(Number(currentProject.id))
      .then((project) => {
        setProjectName(project.project_name);
        if (project.page) {
          setState(fromBackendPage(project.page as BackendPage, { name: project.project_name, description: project.description ?? '' }));
        } else {
          setState({ ...DEFAULT_STATE, headline: project.project_name, subtitle: project.description ?? '' });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentProject?.id]);

  useEffect(() => {
    if (!currentProject) return;
    getMetrics(Number(currentProject.id)).then(setMetrics).catch(console.error);
  }, [currentProject?.id]);

  const publish = async () => {
    if (!currentProject) return;
    setSaving(true);
    try {
      await savePage(Number(currentProject.id), toBackendPage(state));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: SectionType) =>
    setState((prev) => ({ ...prev, sections: [...prev.sections, { id: `${type}-${Date.now()}`, type }] }));

  const addMetricsSection = () =>
    setState((prev) =>
      prev.sections.some(isMetrics)
        ? prev
        : { ...prev, sections: [{ id: `metrics-${Date.now()}`, type: 'metrics' }, ...prev.sections] },
    );

  const updateSection = (id: string, updates: Partial<Section>) =>
    setState((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));

  const removeSection = (id: string) =>
    setState((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setState((prev) => {
      const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
      const newIndex = prev.sections.findIndex((s) => s.id === over.id);
      return { ...prev, sections: arrayMove(prev.sections, oldIndex, newIndex) };
    });
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loadingProjects || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentProject) return <NoProjectSelected />;

  const projectId = Number(currentProject.id);
  const backendPage = toBackendPage(state);
  const metricsSection = state.sections.find(isMetrics);
  const contentSections = state.sections.filter((s) => !isMetrics(s));

  return (
    <div className="min-h-screen bg-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-outline-variant/10 px-6 py-3 flex items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-outline hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
        <span className="text-sm font-bold text-primary truncate max-w-xs hidden md:block">{projectName}</span>
        <div className="flex items-center gap-3">
          <Link to={`/project/${projectId}`} target="_blank" className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-surface-container-low">
            <Eye className="w-4 h-4" /> Ver publicado
          </Link>
          <button
            onClick={() => setPreview((p) => !p)}
            className={cn('flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all', preview ? 'bg-primary text-white shadow-sm' : 'text-outline hover:text-primary hover:bg-surface-container-low')}
          >
            {preview ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{preview ? 'Editar' : 'Vista previa'}</span>
          </button>
          <button onClick={publish} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 shadow-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saved ? 'Guardado' : 'Publicar'}
          </button>
        </div>
      </div>

      {preview ? (
        <div className="bg-surface-container-low/30 min-h-[calc(100vh-57px)]">
          <div className="flex justify-center py-5 px-6">
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold px-5 py-2.5 rounded-full uppercase tracking-widest">
              Vista previa — así se verá la página al publicar
            </div>
          </div>
          <div className="bg-white shadow-2xl mx-auto max-w-5xl rounded-2xl overflow-hidden mb-16 ring-1 ring-outline-variant/10">
            <PagePreview
              blocks={backendPage.blocks}
              primaryColor={state.primaryColor}
              secondaryColor={state.secondaryColor}
              fontFamily={state.fontFamily}
              metrics={metrics}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          {/* ─── Sidebar (Blogger-style page flow) ─────────────────────────── */}
          <aside className="lg:w-72 lg:shrink-0 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-outline-variant/10 bg-surface-container-lowest p-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layout className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-extrabold text-outline uppercase tracking-[0.2em]">Flujo de la página</h3>
              </div>

              <button onClick={() => scrollTo('hero-editor')} className="w-full flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3 py-2.5 mb-2 text-left">
                <Type className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-primary truncate">Portada (Hero)</span>
              </button>

              {metricsSection && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 pr-2 mb-2">
                  <span className="p-2"><BarChart3 className="w-4 h-4 text-amber-500" /></span>
                  <button onClick={() => scrollTo(`section-${metricsSection.id}`)} className="flex items-center gap-2 flex-grow py-2.5 min-w-0 text-left">
                    <span className="text-xs font-semibold text-primary truncate">Métricas</span>
                  </button>
                  <button onClick={() => removeSection(metricsSection.id)} className="p-1.5 text-outline-variant hover:text-error rounded-lg transition-all" title="Eliminar sección">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={contentSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {contentSections.map((section) => (
                      <SortableTag key={section.id} section={section} onSelect={() => scrollTo(`section-${section.id}`)} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {state.sections.length === 0 && (
                <p className="text-[11px] text-outline italic mt-2">Añade secciones para construir el flujo.</p>
              )}
              {contentSections.length > 1 && (
                <p className="text-[10px] text-outline/70 mt-3 flex items-center gap-1">
                  <GripVertical className="w-3 h-3" /> Arrastra para reordenar
                </p>
              )}
            </div>

            <div>
              <h3 className="text-[10px] font-extrabold text-outline uppercase tracking-[0.2em] mb-3">Paleta</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-outline-variant/20 flex-shrink-0" style={{ backgroundColor: state.primaryColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-primary">Primario</div>
                    <div className="text-[10px] font-mono text-outline">{state.primaryColor}</div>
                  </div>
                  <input
                    type="color"
                    value={state.primaryColor}
                    onChange={(e) => setState((p) => ({ ...p, primaryColor: e.target.value }))}
                    className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent p-0 flex-shrink-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-outline-variant/20 flex-shrink-0" style={{ backgroundColor: state.secondaryColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-primary">Secundario</div>
                    <div className="text-[10px] font-mono text-outline">{state.secondaryColor}</div>
                  </div>
                  <input
                    type="color"
                    value={state.secondaryColor}
                    onChange={(e) => setState((p) => ({ ...p, secondaryColor: e.target.value }))}
                    className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent p-0 flex-shrink-0"
                  />
                </div>
                <div className="h-px bg-outline-variant/10" />
                <FontCarousel
                  value={state.fontFamily}
                  onChange={(css) => setState((p) => ({ ...p, fontFamily: css }))}
                />
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-extrabold text-outline uppercase tracking-[0.2em] mb-3">Añadir sección</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SECTION_META) as SectionType[])
                  .filter((type) => type !== 'metrics')
                  .map((type) => {
                    const { label, icon: Icon } = SECTION_META[type];
                    return (
                      <button
                        key={type}
                        onClick={() => addSection(type)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-outline-variant/10 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all text-xs font-bold"
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    );
                  })}
              </div>
              <button
                onClick={addMetricsSection}
                disabled={!!metricsSection}
                className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-outline-variant/10 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant/10"
                title={metricsSection ? 'La sección de métricas ya está añadida' : 'Mostrar todas las métricas del proyecto'}
              >
                <BarChart3 className="w-4 h-4" /> {metricsSection ? 'Métricas (añadida)' : 'Métricas'}
              </button>
            </div>

            <div>
              <h3 className="text-[10px] font-extrabold text-outline uppercase tracking-[0.2em] mb-3">Gestión</h3>
              <div className="space-y-1">
                {PANELS.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => scrollTo(id)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-white hover:text-primary transition-all text-xs font-bold text-left">
                    <Icon className="w-4 h-4 shrink-0" /> {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ─── Main content ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Hero editor */}
            <div id="hero-editor" className="relative w-full scroll-mt-[57px]" style={{ backgroundColor: state.primaryColor }}>
              <div className="w-full h-[55vh] relative overflow-hidden">
                {state.coverImage ? (
                  <img src={state.coverImage} alt="" className="w-full h-full object-cover opacity-70" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
                    <ImageIcon className="w-12 h-12 text-white" />
                    <span className="text-white text-sm font-medium">Pega la URL de la imagen de portada abajo</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end px-6 md:px-16 pb-12 pointer-events-none">
                <div className="pointer-events-auto max-w-4xl mx-auto w-full space-y-4">
                  <input
                    type="text"
                    value={state.headline}
                    onChange={(e) => setState((p) => ({ ...p, headline: e.target.value }))}
                    placeholder="Título del proyecto..."
                    className="w-full text-4xl md:text-6xl font-extrabold text-white bg-transparent border-none outline-none placeholder:text-white/30 tracking-tighter leading-tight"
                    style={{ fontFamily: state.fontFamily }}
                  />
                  <input
                    type="text"
                    value={state.subtitle}
                    onChange={(e) => setState((p) => ({ ...p, subtitle: e.target.value }))}
                    placeholder="Subtítulo o descripción breve..."
                    className="w-full text-xl text-white/80 bg-transparent border-none outline-none placeholder:text-white/20 font-light"
                    style={{ fontFamily: state.fontFamily }}
                  />
                </div>
              </div>
            </div>

            {/* Cover image URL */}
            <div className="bg-white border-b border-outline-variant/10 px-6 md:px-12 py-4">
              <div className="max-w-3xl mx-auto">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Imagen de portada</label>
                <input
                  type="url"
                  value={state.coverImage}
                  onChange={(e) => setState((p) => ({ ...p, coverImage: e.target.value }))}
                  placeholder="Pega una URL (https://...) o sube un archivo"
                  className="w-full text-sm bg-surface-container-low rounded-xl px-4 py-3 outline-none border border-outline-variant/20 focus:border-primary/40 transition-colors placeholder:text-outline/30 font-mono"
                />
                <UploadButton
                  label="Subir imagen de portada"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onUploaded={(url) => setState((p) => ({ ...p, coverImage: url }))}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Sections */}
            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-6">
              {metricsSection && (
                <div id={`section-${metricsSection.id}`} className="scroll-mt-[70px]">
                  <SectionCard type="metrics" onDelete={() => removeSection(metricsSection.id)}>
                    <MetricsSection onManage={() => scrollTo('panel-metrics')} />
                  </SectionCard>
                </div>
              )}
              {contentSections.map((section) => {
                const onChange = (u: Partial<Section>) => updateSection(section.id, u);
                return (
                  <div key={section.id} id={`section-${section.id}`} className="scroll-mt-[70px]">
                    <SectionCard type={section.type} onDelete={() => removeSection(section.id)}>
                      {section.type === 'text' && <TextSection section={section} onChange={onChange} fontFamily={state.fontFamily} />}
                      {section.type === 'image' && <ImageSection section={section} onChange={onChange} />}
                      {section.type === 'video' && <VideoSection section={section} onChange={onChange} />}
                      {section.type === 'divider' && <DividerSection />}
                    </SectionCard>
                  </div>
                );
              })}
              {state.sections.length === 0 && (
                <div className="py-12 text-center text-outline border-2 border-dashed border-outline-variant/20 rounded-3xl">
                  <p className="text-sm">Usa la barra lateral para añadir secciones a tu página.</p>
                </div>
              )}
            </div>

            {/* ─── Management panels (antes Dashboard) ─────────────────────── */}
            <div className="bg-surface-container-lowest border-t border-outline-variant/10">
              <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 space-y-16">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-primary tracking-tighter">Gestión del Proyecto</h1>
                    <p className="text-sm text-on-surface-variant">Métricas, galería, testimonios e hitos que aparecen en la página pública.</p>
                  </div>
                  <ReportButton projectId={projectId} />
                </div>

                <div id="panel-metrics" className="scroll-mt-[70px]"><MetricsManager projectId={projectId} /></div>
                <div id="panel-photos" className="scroll-mt-[70px]"><PhotosManager projectId={projectId} /></div>
                <div id="panel-testimonies" className="scroll-mt-[70px]"><TestimoniesManager projectId={projectId} /></div>
                <div id="panel-milestones" className="scroll-mt-[70px]"><MilestonesManager projectId={projectId} /></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
