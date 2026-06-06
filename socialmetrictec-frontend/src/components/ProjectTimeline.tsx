import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Rocket, Pencil, MessageSquare, Camera, Flag, CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { TestimonyOut } from '@/src/services/testimonyService';
import { PhotoOut } from '@/src/services/photoService';
import { MilestoneOut } from '@/src/services/milestoneService';

type EventType = 'creacion' | 'edicion' | 'testimonio' | 'foto' | 'hito';

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  timestamp: string;
}

interface ProjectTimelineProps {
  createdAt: string;
  editLog?: string[];
  testimonies: TestimonyOut[];
  photos: PhotoOut[];
  milestones: MilestoneOut[];
}

const TYPE_META: Record<EventType, { label: string; icon: typeof Rocket; color: string }> = {
  creacion: { label: 'Creación', icon: Rocket, color: 'bg-primary text-white' },
  edicion: { label: 'Ediciones', icon: Pencil, color: 'bg-blue-100 text-blue-600' },
  testimonio: { label: 'Testimonios', icon: MessageSquare, color: 'bg-orange-100 text-orange-600' },
  foto: { label: 'Fotos', icon: Camera, color: 'bg-emerald-100 text-emerald-600' },
  hito: { label: 'Hitos', icon: Flag, color: 'bg-purple-100 text-purple-600' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

function buildEvents({ createdAt, editLog, testimonies, photos, milestones }: ProjectTimelineProps): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({ id: 'created', type: 'creacion', title: 'Proyecto creado', timestamp: createdAt });

  (editLog ?? []).forEach((ts, i) => {
    events.push({ id: `edit-${i}`, type: 'edicion', title: 'Página del proyecto editada', timestamp: ts });
  });

  testimonies.forEach((t) => {
    events.push({
      id: `testimony-${t.testimony_id}`,
      type: 'testimonio',
      title: `Testimonio de ${t.display_name ?? t.author_username}`,
      timestamp: t.created_at,
    });
  });

  photos.forEach((p) => {
    events.push({ id: `photo-${p.photo_id}`, type: 'foto', title: 'Foto subida al proyecto', timestamp: p.created_at });
  });

  milestones.forEach((m) => {
    events.push({ id: `milestone-new-${m.milestone_id}`, type: 'hito', title: `Hito creado: ${m.title}`, timestamp: m.created_at });
    if (m.is_completed && m.completed_at) {
      events.push({ id: `milestone-done-${m.milestone_id}`, type: 'hito', title: `Hito completado: ${m.title}`, timestamp: m.completed_at });
    }
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export default function ProjectTimeline(props: ProjectTimelineProps) {
  const allEvents = useMemo(() => buildEvents(props), [props]);
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set());

  const toggleFilter = (type: EventType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const visibleEvents = activeFilters.size === 0
    ? allEvents
    : allEvents.filter((e) => activeFilters.has(e.type));

  if (allEvents.length === 0) return null;

  const availableTypes = (Object.keys(TYPE_META) as EventType[]).filter((type) =>
    allEvents.some((e) => e.type === type),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {availableTypes.map((type) => {
          const { label, icon: Icon } = TYPE_META[type];
          const active = activeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all',
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/30',
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          );
        })}
      </div>

      <div className="relative pl-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-outline-variant/20" />
        <div className="space-y-6">
          {visibleEvents.map((event, i) => {
            const { icon: Icon, color } = TYPE_META[event.type];
            const isCompletion = event.id.startsWith('milestone-done');
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="relative"
              >
                <span className={cn('absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm', color)}>
                  {isCompletion ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </span>
                <div className="pb-1">
                  <p className="text-sm font-bold text-primary leading-tight">{event.title}</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-0.5">{formatDate(event.timestamp)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {visibleEvents.length === 0 && (
          <p className="text-sm text-outline italic">No hay eventos de este tipo.</p>
        )}
      </div>
    </div>
  );
}
