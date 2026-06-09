import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, HeartPulse, CheckCircle2 } from 'lucide-react';
import { listProjects, formatArea, ProjectSummary } from '@/src/services/projectService';

const SDG_GOALS = Array.from({ length: 17 }, (_, i) => i + 1);

// Colores oficiales de cada ODS, para diferenciar cada proyecto por su área de impacto.
const SDG_COLORS: Record<number, string> = {
  1: '#E5243B',  2: '#DDA63A',  3: '#4C9F38',  4: '#C5192D',  5: '#FF3A21',
  6: '#26BDE2',  7: '#FCC30B',  8: '#A21942',  9: '#FD6925', 10: '#DD1367',
  11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
  16: '#00689D', 17: '#19486A',
};

const sdgColor = (area: string): string =>
  SDG_COLORS[Number(area.replace('ods_', ''))] ?? '#6750A4';

export default function Home() {
  const rm = useReducedMotion();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(console.error);
  }, []);

  const featuredProjects = projects.slice(0, 4);
  const currentYear = new Date().getFullYear();

  const projectsPerArea = projects.reduce<Record<string, number>>((acc, project) => {
    acc[project.impact_area] = (acc[project.impact_area] ?? 0) + 1;
    return acc;
  }, {});

  // Las ODS con más proyectos (hasta 3, o las que haya si son menos).
  const topAreas = Object.entries(projectsPerArea)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const metrics = [
    { label: 'Iniciativas Documentadas', value: projects.length },
    { label: 'Proyectos Activos', value: projects.filter((p) => p.is_active).length },
    { label: 'Áreas de Mayor Impacto', areas: topAreas },
    { label: `Publicados en ${currentYear}`, value: projects.filter((p) => new Date(p.created_at).getFullYear() === currentYear).length },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-surface py-20 md:py-32 px-6 md:px-12">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: rm ? 0 : 0.8 }}
            className="lg:w-3/5 space-y-8"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-xs">Legado Institucional y Social</span>
            <h1 id="hero-heading" className="text-5xl md:text-7xl font-extrabold text-primary tracking-tighter leading-tight">
              Construyendo el futuro a través del impacto social
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-2xl font-light">
              Nuestra plataforma académica documenta, gestiona y potencializa las iniciativas que transforman realidades en Puebla y el mundo.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link 
                to="/directory"
                className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold transition-all hover:scale-105 shadow-lg inline-block"
              >
                Explorar Proyectos
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: rm ? 0 : 0.8, delay: rm ? 0 : 0.2 }}
            className="lg:w-2/5 relative"
          >
            <div className="w-full aspect-[4/5] bg-surface-container-low rounded-2xl overflow-hidden relative shadow-2xl">
              <img
                className="w-full h-full object-cover opacity-90"
                src="https://static.wixstatic.com/media/6f8753_a64ed9907504448d92f14d82543e4811~mv2.gif"
                alt="Campus del Tecnológico de Monterrey"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Section */}
      <section aria-labelledby="metrics-heading" className="bg-surface-container py-20 px-6 md:px-12">
        <h2 id="metrics-heading" className="sr-only">Métricas de impacto</h2>
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {metrics.map((metric, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: rm ? 0 : idx * 0.1 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              {'areas' in metric ? (
                metric.areas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {metric.areas.map(([area, count]) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: sdgColor(area) }}
                      >
                        ODS {area.replace('ods_', '')}
                        <span>· {count}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-4xl md:text-5xl font-extrabold text-primary tracking-tighter">0</span>
                )
              ) : (
                <span className="text-4xl md:text-5xl font-extrabold text-primary tracking-tighter">{metric.value}</span>
              )}
              <p className="text-xs md:text-sm uppercase tracking-widest text-on-surface-variant font-semibold">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section aria-labelledby="featured-heading" className="bg-surface py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 id="featured-heading" className="text-4xl font-bold text-primary mb-4 tracking-tight">Proyectos Destacados</h2>
              <p className="text-on-surface-variant leading-relaxed">Selección curada de iniciativas con mayor incidencia social durante el último ciclo académico.</p>
            </div>
            <Link 
              to="/directory" 
              className="text-primary font-bold flex items-center gap-2 hover:underline underline-offset-4 group"
            >
              Ver todos los proyectos <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProjects.map((project, idx) => {
              const accent = sdgColor(project.impact_area);
              return (
                <motion.div
                  key={project.project_id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: rm ? 0 : idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group flex flex-col h-full rounded-2xl overflow-hidden tonal-card border-t-4"
                  style={{ borderTopColor: accent }}
                >
                  <div className="h-52 overflow-hidden">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={project.cover_image_url || 'https://picsum.photos/seed/project/800/600'}
                      alt={project.project_name}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    <span className="font-bold text-xs uppercase tracking-widest" style={{ color: accent }}>
                      {formatArea(project.impact_area)}
                    </span>
                    <h3 className="text-xl font-bold text-primary leading-tight">{project.project_name}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3 flex-grow">
                      {project.description ?? 'Sin descripción.'}
                    </p>
                    <Link
                      to={`/project/${project.project_id}`}
                      aria-label={`Ver detalles de ${project.project_name}`}
                      className="self-start text-primary border-b-2 border-primary pb-1 font-bold hover:text-secondary hover:border-secondary transition-colors"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </motion.div>
              );
            })}
            {featuredProjects.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-4 py-16 text-center text-on-surface-variant">
                Aún no hay proyectos publicados.{' '}
                <Link to="/create-project" aria-label="Crear el primer proyecto" className="text-primary font-bold hover:underline">
                  Crea el primero
                </Link>
                .
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Impact Areas (ODS) */}
      <section aria-labelledby="ods-heading" className="bg-surface-container-low py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 id="ods-heading" className="text-3xl md:text-4xl font-bold text-primary tracking-tighter">Áreas de Impacto Estratégico</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Nuestra labor se alinea con los 17 Objetivos de Desarrollo Sostenible (ODS) de la ONU para generar un cambio sistémico.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {SDG_GOALS.map((goal, idx) => {
              const area = `ods_${goal}`;
              const count = projectsPerArea[area] ?? 0;
              return (
                <motion.div
                  key={goal}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: rm ? 0 : (idx % 6) * 0.05 }}
                >
                  <Link
                    to={`/directory?area=${area}`}
                    aria-label={formatArea(area)}
                    className="block relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <img
                      src={`/sdg/ods-${goal}.jpg`}
                      alt={formatArea(area)}
                      className={count > 0
                        ? 'w-full h-full object-cover'
                        : 'w-full h-full object-cover opacity-20 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300'}
                    />
                    {count > 0 && (
                      <span className="absolute top-2 right-2 min-w-6 h-6 px-2 rounded-full bg-white/95 text-primary text-xs font-extrabold flex items-center justify-center shadow-sm">
                        {count}
                      </span>
                    )}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-3"
                      style={{ backgroundColor: `${SDG_COLORS[goal]}CC` }}
                    >
                      <span className="text-white text-sm font-bold leading-tight">{count} Proyecto{count !== 1 ? 's' : ''}</span>
                      <span className="text-white text-[10px] uppercase tracking-widest font-bold mt-1">Ver directorio</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
