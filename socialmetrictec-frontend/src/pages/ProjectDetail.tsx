import { motion, AnimatePresence } from 'motion/react';
import { withOpacity } from '@/src/lib/utils';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2, Mail, Globe, Linkedin, Instagram, Facebook, Twitter, ChevronDown, Users } from 'lucide-react';
import { getProject } from '@/src/services/pageService';
import { formatArea, getProjectLeaders, ProjectLeader } from '@/src/services/projectService';
import { getMetrics, MetricOut } from '@/src/services/metricService';
import { getPhotos, PhotoOut } from '@/src/services/photoService';
import { getTestimonies, TestimonyOut } from '@/src/services/testimonyService';
import { getMilestones, MilestoneOut } from '@/src/services/milestoneService';
import { getChangeLog, ChangeLogEntry } from '../services/changeLogService';
import { PagePreview, type BackendBlock } from '../components/BlockRenderer';
import ProjectTimeline from '../components/ProjectTimeline';
import { Flag, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PageStyles {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

const withProtocol = (url?: string) =>
  !url || /^https?:\/\//i.test(url) ? url : `https://${url}`;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Awaited<ReturnType<typeof getProject>> | null>(null);
  const [metrics, setMetrics] = useState<MetricOut[]>([]);
  const [photos, setPhotos] = useState<PhotoOut[]>([]);
  const [testimonies, setTestimonies] = useState<TestimonyOut[]>([]);
  const [leaders, setLeaders] = useState<ProjectLeader[]>([]);
  const [milestones, setMilestones] = useState<MilestoneOut[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProject(Number(id)),
      getMetrics(Number(id)),
      getPhotos(Number(id)),
      getTestimonies(Number(id)),
      getProjectLeaders(Number(id)),
      getMilestones(Number(id)),
    ])
      .then(([p, m, ph, t, l, ms]) => {
        setProject(p);
        setMetrics(m);
        setPhotos(ph);
        setTestimonies(t);
        setLeaders(l);
        setMilestones(ms);

        if (user?.is_admin) {
          getChangeLog(Number(id))
            .then(setChangeLogs)
            .catch(console.error);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, user?.is_admin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-error font-bold">
        Proyecto no encontrado.
      </div>
    );
  }

  const page = project.page as { blocks: BackendBlock[]; general_props: { styles?: PageStyles; edit_log?: string[] } } | null;
  const styles: PageStyles = page?.general_props?.styles ?? {};
  const primaryColor = styles.primaryColor ?? '#002068';
  const secondaryColor = styles.secondaryColor ?? '#525d85';
  const fontFamily = styles.fontFamily ?? 'Manrope';
  const blocks: BackendBlock[] = page?.blocks ?? [];

  const defaultHero = (
    <section className="relative h-[70vh] w-full bg-slate-900 overflow-hidden">
      {project.cover_image_url && (
        <img
          alt={project.project_name}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          src={project.cover_image_url}
        />
      )}
      <div
        className="relative h-full flex flex-col justify-center items-center text-center p-6 sm:p-10 md:p-16"
        style={{
          background: `linear-gradient(to bottom, transparent, ${withOpacity(primaryColor, 0.2)}, ${withOpacity(primaryColor, 0.8)})`,
          backgroundColor: project.cover_image_url ? undefined : primaryColor,
        }}
      >
        <span className="text-white/60 font-bold text-xs uppercase tracking-widest mb-4">
          {formatArea(project.impact_area)}
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight max-w-5xl mb-6 tracking-tighter break-words" style={{ fontFamily }}>
          {project.project_name}
        </h1>
        {project.description && (
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl font-light leading-relaxed break-words" style={{ fontFamily }}>
            {project.description}
          </p>
        )}
      </div>
    </section>
  );

  const teamSection = leaders.length > 0 && (
    <section className="py-20 bg-surface">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="mb-12 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--p-secondary)' }}>
            Conoce al equipo
          </span>
          <h2 className="text-3xl font-extrabold tracking-tighter mt-2" style={{ color: 'var(--p-primary)' }}>
            Equipo y Contacto
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {leaders.map((leader, i) => (
            <LeaderCard key={leader.username} leader={leader} index={i} primaryColor={primaryColor} />
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div
      className="flex flex-col min-h-screen bg-surface"
      style={{
        fontFamily,
        '--p-primary': primaryColor,
        '--p-secondary': secondaryColor,
      } as React.CSSProperties}
    >
      {blocks.length === 0 && defaultHero}

      <PagePreview
        blocks={blocks}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        metrics={metrics}
        fontFamily={fontFamily}
        heroFallbackUrl={project.cover_image_url ?? undefined}
        afterMetrics={teamSection}
      />

      {/* Widget de beneficiarios */}
      <section className="bg-primary-container py-12">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-5 sm:gap-6 rounded-3xl text-white p-6 sm:p-8"
            style={{ backgroundColor: 'var(--p-primary)', boxShadow: `0 25px 60px -30px ${withOpacity(primaryColor, 0.7)}` }}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-none">
                {(project.numero_beneficiarios ?? 0).toLocaleString('es-MX')}
              </p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/70 mt-2">
                Personas beneficiadas
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <section className="py-16 bg-surface-container-lowest">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight mb-8" style={{ color: 'var(--p-primary)' }}>
              Galería del Proyecto
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, idx) => (
                <motion.div
                  key={photo.photo_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="aspect-square rounded-2xl overflow-hidden group relative"
                >
                  <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {photo.caption && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-white text-xs font-medium">{photo.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonies */}
      {testimonies.length > 0 && (
        <section className="py-20 bg-secondary-container">
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--p-secondary)' }}>
                En sus palabras
              </span>
              <h2 className="text-3xl font-extrabold tracking-tighter mt-2" style={{ color: 'var(--p-primary)' }}>
                Testimonios
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonies.map((t, i) => (
                <motion.figure
                  key={t.testimony_id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, ease: 'easeOut' }}
                  className="group relative flex flex-col bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/10 hover:border-primary/30 hover:shadow-[0_20px_50px_-25px_rgba(124,48,170,0.25)] transition-all duration-300"
                >
                  <span
                    className="absolute top-6 right-7 font-serif text-6xl leading-none select-none"
                    style={{ color: withOpacity(primaryColor, 0.1) }}
                  >&rdquo;</span>

                  {t.category && (
                    <span
                      className="self-start text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-5"
                      style={{ backgroundColor: withOpacity(primaryColor, 0.05), color: 'var(--p-primary)' }}
                    >
                      {t.category}
                    </span>
                  )}

                  <blockquote className="text-[15px] text-on-surface leading-relaxed flex-grow break-words whitespace-pre-line">{t.content}</blockquote>

                  {t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      {t.tags.map((tag) => <span key={tag} className="text-[9px] font-bold px-2.5 py-1 bg-white border border-outline-variant/10 text-outline rounded-full">{tag}</span>)}
                    </div>
                  )}

                  <figcaption className="flex items-center gap-3 mt-7 pt-6 border-t border-outline-variant/10">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: withOpacity(primaryColor, 0.1) }}
                    >
                      <span className="text-xs font-extrabold" style={{ color: 'var(--p-primary)' }}>
                        {(t.display_name ?? t.author_username).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--p-primary)' }}>{t.display_name ?? t.author_username}</p>
                      <p className="text-[10px] text-outline uppercase tracking-wider font-medium">{new Date(t.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hitos */}
      {milestones.length > 0 && (
        <section className="py-20 bg-surface-container-lowest">
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--p-secondary)' }}>
                Avances del proyecto
              </span>
              <h2 className="text-3xl font-extrabold tracking-tighter mt-2" style={{ color: 'var(--p-primary)' }}>
                Hitos
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.milestone_id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-start gap-3 rounded-2xl p-5 border ${
                    m.is_completed
                      ? 'bg-surface-container-lowest border-outline-variant/10'
                      : 'bg-surface-container-lowest/40 border-dashed border-outline-variant/30'
                  }`}
                >
                  {m.is_completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-outline-variant shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold break-words ${!m.is_completed ? 'text-on-surface-variant' : ''}`}
                      style={m.is_completed ? { color: 'var(--p-primary)' } : undefined}
                    >
                      {m.title}
                    </p>
                    {m.is_completed ? (
                      m.completed_at && (
                        <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-1">
                          {new Date(m.completed_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )
                    ) : (
                      <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-1">Pendiente</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Línea de tiempo (solo administradores) */}
      {user?.is_admin && (
        <section className="py-20 bg-surface">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--p-secondary)' }}>
                Evolución
              </span>
              <h2 className="text-3xl font-extrabold tracking-tighter mt-2" style={{ color: 'var(--p-primary)' }}>
                Publicaciones y Eventos
              </h2>
            </div>
            <ProjectTimeline changeLogs={changeLogs} />
          </div>
        </section>
      )}

      <footer className="py-24 text-white text-center" style={{ backgroundColor: 'var(--p-primary)' }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter">SocialMetricTec</h2>
          <p className="text-lg text-white/60 font-light max-w-lg mx-auto">
            Plataforma de curaduría de impacto social para la excelencia académica.
          </p>
          <div className="pt-12 border-t border-white/10 text-xs uppercase tracking-widest opacity-50">
            © 2026 Tecnológico de Monterrey
          </div>
        </div>
      </footer>
    </div>
  );
}

function LeaderCard({ leader, index, primaryColor }: { leader: ProjectLeader; index: number; primaryColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const p = leader.profile ?? {};

  const socials = [
    { url: p.linkedin, icon: Linkedin, label: 'LinkedIn' },
    { url: p.instagram, icon: Instagram, label: 'Instagram' },
    { url: p.facebook, icon: Facebook, label: 'Facebook' },
    { url: p.twitter, icon: Twitter, label: 'X / Twitter' },
  ].filter((s) => s.url);

  const contacts = [
    { href: `mailto:${leader.email}`, icon: Mail, value: leader.email, external: false },
    p.website ? { href: withProtocol(p.website)!, icon: Globe, value: p.website.replace(/^https?:\/\//, ''), external: true } : null,
  ].filter(Boolean) as { href: string; icon: typeof Mail; value: string; external: boolean }[];

  const hasMore = socials.length > 0 || contacts.length > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, ease: 'easeOut' }}
      className="group relative bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_-20px_rgba(124,48,170,0.3)] transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div
        className="h-20 relative"
        style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${withOpacity(primaryColor, 0.7)})` }}
      >
        <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
      </div>

      <div className="px-5 sm:px-7 pb-7 flex flex-col">
        <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg shrink-0 mt-5">
          <div
            className="w-full h-full rounded-[14px] flex items-center justify-center"
            style={{ backgroundColor: withOpacity(primaryColor, 0.1) }}
          >
            <span className="text-xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
              {leader.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-extrabold tracking-tight mt-5" style={{ color: primaryColor }}>{leader.username}</h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: 'var(--p-secondary)' }}>Líder del proyecto</p>

        {p.description && (
          <p className="text-sm text-on-surface-variant leading-relaxed mt-4 break-words whitespace-pre-line">{p.description}</p>
        )}

        {hasMore && (
          <>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  {socials.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-5">
                      {socials.map(({ url, icon: Icon, label }) => (
                        <a
                          key={label}
                          href={withProtocol(url)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={label}
                          className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-outline hover:bg-primary hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <Icon className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 pt-5 border-t border-outline-variant/10 space-y-1">
                    {contacts.map(({ href, icon: Icon, value, external }) => (
                      <a
                        key={href}
                        href={href}
                        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-xl text-xs text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors group/contact"
                      >
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover/contact:bg-primary group-hover/contact:text-white transition-colors" style={{ backgroundColor: withOpacity(primaryColor, 0.05), color: primaryColor }}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="truncate font-medium">{value}</span>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-5 self-start inline-flex items-center gap-1.5 text-xs font-bold hover:gap-2.5 transition-all"
              style={{ color: primaryColor }}
            >
              {expanded ? 'Ver menos' : 'Ver más'}
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
}
