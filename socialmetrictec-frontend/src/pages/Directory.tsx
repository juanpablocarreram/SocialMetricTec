import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, ChevronDown, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { listProjects, formatArea, ProjectSummary } from '@/src/services/projectService';

export default function Directory() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const rm = useReducedMotion();

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const uniqueAreas = Array.from(new Set(projects.map((p) => p.impact_area)));

  const filteredProjects = projects.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.project_name.toLowerCase().includes(query) ||
      formatArea(p.impact_area).toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? p.is_active : !p.is_active);

    const matchesArea = areaFilter === 'all' || p.impact_area === areaFilter;

    return matchesSearch && matchesStatus && matchesArea;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-surface-container py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-screen-2xl mx-auto flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: rm ? 0 : 0.4 }}
            className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-4 font-bold"
          >
            Repositorio de Impacto Social
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rm ? 0 : 0.1, duration: rm ? 0 : 0.4 }}
            className="text-4xl md:text-6xl font-extrabold text-primary mb-12 tracking-tighter leading-tight max-w-4xl"
          >
            Descubre el Legado de la Transformación Colectiva.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: rm ? 0 : 0.2, duration: rm ? 0 : 0.4 }}
            className="w-full max-w-3xl relative group"
          >
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-outline group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="search"
              aria-label="Buscar proyectos por nombre o área"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, palabra clave o área..."
              className="w-full pl-16 pr-8 py-6 bg-surface-container-lowest border-none shadow-sm rounded-2xl font-body text-lg focus:ring-2 focus:ring-primary transition-all outline-none"
            />
          </motion.div>
        </div>
      </section>

      <section className="bg-surface py-8 px-6 md:px-12 border-b border-outline-variant/15 sticky top-[73px] z-40 glass-header">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full border border-outline-variant/10">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Filtrar por:</span>
            </div>

            <div className="relative">
              <select
                aria-label="Filtrar por estado de actividad"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-container-high border-none rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-secondary focus:ring-primary cursor-pointer hover:bg-surface-container-highest transition-colors outline-none appearance-none"
              >
                <option value="all">Estado de Actividad</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
              <ChevronDown className="w-4 h-4 text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                aria-label="Filtrar por área de impacto"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="bg-surface-container-high border-none rounded-lg py-2 pl-4 pr-10 text-sm font-semibold text-secondary focus:ring-primary cursor-pointer hover:bg-surface-container-highest transition-colors outline-none appearance-none"
              >
                <option value="all">Área de Impacto</option>
                {uniqueAreas.map((area) => (
                  <option key={area} value={area}>
                    {formatArea(area)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true" aria-label="Resultados de búsqueda" className="text-on-surface-variant text-sm font-medium">
            Mostrando <span className="font-bold text-primary">{filteredProjects.length}</span> proyectos
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-16 max-w-screen-2xl mx-auto w-full">
        {loading ? (
          <div role="status" className="flex justify-center py-24">
            <span className="sr-only">Cargando proyectos</span>
            <Loader2 aria-hidden="true" className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProjects.map((project, idx) => (
              <Link
                key={project.project_id}
                to={`/project/${project.project_id}`}
                aria-label={`Ver proyecto: ${project.project_name}`}
                className="flex flex-col bg-surface-container-lowest group cursor-pointer tonal-card rounded-2xl p-2"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: rm ? 0 : (idx % 3) * 0.1, duration: rm ? 0 : 0.4 }}
                  viewport={{ once: true }}
                  className="flex flex-col h-full"
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl mb-6">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={project.cover_image_url || 'https://picsum.photos/seed/project/800/600'}
                      alt={project.project_name}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-primary text-on-primary px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {formatArea(project.impact_area)}
                      </span>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm',
                          project.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {project.is_active ? (
                          <Clock className="w-2.5 h-2.5" />
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        )}
                        {project.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow px-4 pb-4">
                    <h3 className="text-xl font-bold text-primary mb-3 leading-snug group-hover:text-secondary transition-colors">
                      {project.project_name}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-3 mb-6 leading-relaxed">
                      {project.description ?? 'Sin descripción.'}
                    </p>

                    <div className="mt-auto pt-4 flex justify-end items-center text-[10px] font-bold text-outline uppercase tracking-wider border-t border-outline-variant/10">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.created_at).getFullYear()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-on-surface-variant text-lg">No se encontraron proyectos que coincidan con tu búsqueda.</p>
          </div>
        )}
      </section>

      <section className="bg-surface-container-low py-24 px-6 md:px-12 border-t border-outline-variant/10">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
          {[
            { label: 'Proyectos en la Plataforma', value: String(projects.length) },
            { label: 'Proyectos Activos', value: String(projects.filter((p) => p.is_active).length) },
            { label: 'Áreas de Impacto', value: String(uniqueAreas.length) },
            { label: 'Inactivos', value: String(projects.filter((p) => !p.is_active).length) },
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-primary tracking-tighter">{stat.value}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
