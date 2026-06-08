import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Printer, ChevronLeft } from 'lucide-react';
import { getProject, ProjectFull } from '@/src/services/pageService';
import { formatArea } from '@/src/services/projectService';
import { getMetrics, MetricOut } from '@/src/services/metricService';
import { getTestimonies, TestimonyOut } from '@/src/services/testimonyService';
import { getPhotos, PhotoOut } from '@/src/services/photoService';
import { getMilestones, MilestoneOut } from '@/src/services/milestoneService';

interface Template {
  accent: string;
  soft: string;
  label: string;
}

const TEMPLATES: Record<string, Template> = {
  institucional: { accent: '#002068', soft: '#eef1f8', label: 'Institucional' },
  esmeralda: { accent: '#047857', soft: '#ecfdf5', label: 'Esmeralda' },
  monocromo: { accent: '#1f2937', soft: '#f3f4f6', label: 'Monocromo' },
};

const ALL_SECTIONS = ['metrics', 'milestones', 'testimonies', 'photos'] as const;
type Section = (typeof ALL_SECTIONS)[number];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

export default function ProjectReport() {
  const { projectId } = useParams<{ projectId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectFull | null>(null);
  const [metrics, setMetrics] = useState<MetricOut[]>([]);
  const [milestones, setMilestones] = useState<MilestoneOut[]>([]);
  const [testimonies, setTestimonies] = useState<TestimonyOut[]>([]);
  const [photos, setPhotos] = useState<PhotoOut[]>([]);
  const [loading, setLoading] = useState(true);

  const template = TEMPLATES[params.get('template') ?? 'institucional'] ?? TEMPLATES.institucional;
  const sectionsParam = params.get('sections');
  const sections = new Set<Section>(
    sectionsParam ? (sectionsParam.split(',') as Section[]) : ALL_SECTIONS,
  );

  useEffect(() => {
    if (!projectId) return;
    const id = Number(projectId);
    Promise.all([
      getProject(id),
      getMetrics(id),
      getMilestones(id),
      getTestimonies(id),
      getPhotos(id),
    ])
      .then(([p, m, ms, t, ph]) => {
        setProject(p);
        setMetrics(m);
        setMilestones(ms);
        setTestimonies(t);
        setPhotos(ph);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center text-error font-bold">Proyecto no encontrado.</div>;
  }

  const completedMilestones = milestones.filter((m) => m.is_completed);

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Toolbar (no se imprime) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-outline-variant/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-outline hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <span className="text-sm font-bold text-primary">Vista previa del reporte · {template.label}</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all"
          >
            <Printer className="w-4 h-4" /> Descargar PDF
          </button>
        </div>
      </div>

      {/* Documento */}
      <div id="report-printable" className="max-w-4xl mx-auto bg-white my-8 shadow-xl print:my-0 print:shadow-none">
        <header className="px-12 pt-12 pb-8" style={{ borderTop: `8px solid ${template.accent}` }}>
          <div className="flex items-center justify-between mb-10">
            <img
              src="/logo.svg"
              alt="SocialMetricTec"
              className="h-10 w-auto object-contain"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: template.accent }}>
              Reporte de Impacto Social
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">{formatArea(project.impact_area)}</span>
          <h1 className="text-4xl font-extrabold tracking-tighter mt-2" style={{ color: template.accent }}>{project.project_name}</h1>
          {project.description && <p className="text-neutral-600 mt-4 leading-relaxed max-w-2xl">{project.description}</p>}
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-6">
            Generado el {formatDate(new Date().toISOString())} · Creado el {formatDate(project.created_at)}
          </p>
        </header>

        {sections.has('metrics') && metrics.length > 0 && (
          <section className="px-12 py-8 border-t border-neutral-100">
            <h2 className="text-lg font-bold mb-6" style={{ color: template.accent }}>Métricas de Impacto</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {metrics.flatMap((metric) =>
                metric.sub_metrics.map((sm) => (
                  <div key={sm.sub_metric_id} className="rounded-xl p-5" style={{ backgroundColor: template.soft }}>
                    <p className="text-3xl font-black tracking-tighter" style={{ color: template.accent }}>
                      {sm.sub_metric_value ?? '—'}
                    </p>
                    <p className="text-[11px] font-semibold text-neutral-500 mt-1">{sm.sub_metric_title}</p>
                    <p className="text-[9px] text-neutral-400 uppercase tracking-wider mt-0.5">{metric.metric_title}</p>
                  </div>
                )),
              )}
            </div>
          </section>
        )}

        {sections.has('milestones') && completedMilestones.length > 0 && (
          <section className="px-12 py-8 border-t border-neutral-100">
            <h2 className="text-lg font-bold mb-6" style={{ color: template.accent }}>Hitos Completados</h2>
            <ul className="space-y-3">
              {completedMilestones.map((m) => (
                <li key={m.milestone_id} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: template.accent }} />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{m.title}</p>
                    {m.completed_at && <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{formatDate(m.completed_at)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sections.has('testimonies') && testimonies.length > 0 && (
          <section className="px-12 py-8 border-t border-neutral-100">
            <h2 className="text-lg font-bold mb-6" style={{ color: template.accent }}>Testimonios</h2>
            <div className="space-y-5">
              {testimonies.map((t) => (
                <blockquote key={t.testimony_id} className="pl-4" style={{ borderLeft: `3px solid ${template.accent}` }}>
                  <p className="text-sm text-neutral-700 leading-relaxed italic break-words">"{t.content}"</p>
                  <footer className="text-[11px] font-bold text-neutral-500 mt-2">
                    — {t.display_name ?? t.author_username}
                    {t.category && <span className="text-neutral-400 font-medium"> · {t.category}</span>}
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {sections.has('photos') && photos.length > 0 && (
          <section className="px-12 py-8 border-t border-neutral-100">
            <h2 className="text-lg font-bold mb-6" style={{ color: template.accent }}>Galería</h2>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.photo_id} className="aspect-square rounded-lg overflow-hidden">
                  <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="px-12 py-8 mt-4 text-center" style={{ backgroundColor: template.soft }}>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
            SocialMetricTec · Tecnológico de Monterrey · Documento generado automáticamente
          </p>
        </footer>
      </div>
    </div>
  );
}
