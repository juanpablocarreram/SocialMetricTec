import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, ToggleRight, BarChart3, Flag, PlusCircle, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ChangeLogEntry } from '@/src/services/changeLogService';

interface PublicationGroup {
  type: 'publication';
  publishEvent: ChangeLogEntry;
  children: ChangeLogEntry[];
}

interface StatusEvent {
  type: 'status';
  event: ChangeLogEntry;
}

type TimelineItem = PublicationGroup | StatusEvent;

const KNOWN_EVENTS = new Set([
  'page_edited', 'project_activated', 'project_deactivated',
  'page_block_added', 'page_block_modified', 'page_block_removed',
  'metric_created', 'metric_updated', 'metric_deleted', 'milestone_updated',
]);

function buildGroups(changeLogs: ChangeLogEntry[]): TimelineItem[] {
  const sorted = [...changeLogs]
    .filter(e => KNOWN_EVENTS.has(e.event_type))
    .sort((a, b) => {
      const tDiff = new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
      return tDiff !== 0 ? tDiff : a.log_id - b.log_id;
    });

  const groups: TimelineItem[] = [];
  let pending: ChangeLogEntry[] = [];

  for (const entry of sorted) {
    if (entry.event_type === 'page_edited') {
      groups.push({
        type: 'publication',
        publishEvent: entry,
        children: [...pending].reverse(),
      });
      pending = [];
    } else if (entry.event_type === 'project_activated' || entry.event_type === 'project_deactivated') {
      groups.push({ type: 'status', event: entry });
    } else {
      pending.push(entry);
    }
  }

  // Remaining pending entries (no subsequent page_edited) are intentionally dropped.
  return groups.reverse();
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} · ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const SUB_EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  page_block_added:    { label: 'añadido',           icon: PlusCircle, color: 'bg-blue-50 text-blue-500' },
  page_block_modified: { label: 'modificado',        icon: Pencil,     color: 'bg-blue-50 text-blue-500' },
  page_block_removed:  { label: 'eliminado',         icon: Trash2,     color: 'bg-blue-50 text-blue-500' },
  metric_created:      { label: 'Métrica creada',    icon: BarChart3,  color: 'bg-teal-50 text-teal-600' },
  metric_updated:      { label: 'Métrica editada',   icon: BarChart3,  color: 'bg-teal-50 text-teal-600' },
  metric_deleted:      { label: 'Métrica eliminada', icon: BarChart3,  color: 'bg-teal-50 text-teal-600' },
  milestone_updated:   { label: 'Hito editado',      icon: Flag,       color: 'bg-purple-50 text-purple-600' },
};

function subEventLabel(entry: ChangeLogEntry): string {
  const meta = SUB_EVENT_META[entry.event_type];
  if (!meta) return entry.event_type;
  if (entry.event_type.startsWith('page_block_')) {
    return `${entry.entity_name ?? 'Bloque'} ${meta.label}`;
  }
  return entry.entity_name ? `${meta.label}: ${entry.entity_name}` : meta.label;
}

export interface ProjectTimelineProps {
  changeLogs: ChangeLogEntry[];
}

export default function ProjectTimeline({ changeLogs }: ProjectTimelineProps) {
  const items = useMemo(() => buildGroups(changeLogs), [changeLogs]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (items.length === 0) return null;

  return (
    <div className="relative pl-10">
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-400 to-outline-variant/10" />
      <div className="space-y-4">
        {items.map((item, i) => {
          if (item.type === 'status') {
            const label =
              item.event.event_type === 'project_activated'
                ? 'Proyecto marcado como activo'
                : 'Proyecto marcado como inactivo';
            return (
              <motion.div
                key={item.event.log_id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="relative"
              >
                <span className="absolute -left-10 top-1 w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shadow-sm">
                  <ToggleRight className="w-3.5 h-3.5" />
                </span>
                <div className="px-4 py-3 bg-white rounded-xl border border-outline-variant/15">
                  <p className="text-sm font-bold text-on-surface leading-tight">{label}</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-1">
                    {formatDateTime(item.event.occurred_at)}
                  </p>
                </div>
              </motion.div>
            );
          }

          const { publishEvent, children } = item;
          const isOpen = expanded.has(publishEvent.log_id);
          const hasChildren = children.length > 0;
          const blockChildren = children.filter(c => c.event_type.startsWith('page_block_'));
          const dataChildren = children.filter(c => !c.event_type.startsWith('page_block_'));

          return (
            <motion.div
              key={publishEvent.log_id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="relative"
            >
              <span className="absolute -left-10 top-1 w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                <Pencil className="w-3.5 h-3.5" />
              </span>
              <div
                className={cn(
                  'bg-white rounded-xl border overflow-hidden',
                  hasChildren ? 'border-blue-200' : 'border-outline-variant/15',
                )}
              >
                <button
                  onClick={() => toggle(publishEvent.log_id)}
                  disabled={!hasChildren}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left',
                    hasChildren
                      ? 'cursor-pointer hover:bg-blue-50/50 transition-colors'
                      : 'cursor-default',
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-blue-700 leading-tight">
                      Publicación de página
                    </p>
                    <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-1">
                      {formatDateTime(publishEvent.occurred_at)}
                      {hasChildren && (
                        <span className="text-blue-500 font-bold">
                          {' '}·{' '}
                          {children.length}{' '}
                          {children.length === 1 ? 'cambio' : 'cambios'}
                        </span>
                      )}
                    </p>
                  </div>
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-blue-400 transition-transform duration-200 shrink-0 ml-3',
                        isOpen && 'rotate-180',
                      )}
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-blue-100 bg-blue-50/40 px-4 py-3 space-y-2">
                        {blockChildren.map(entry => {
                          const meta = SUB_EVENT_META[entry.event_type];
                          if (!meta) return null;
                          const Icon = meta.icon as React.ElementType;
                          return (
                            <div key={entry.log_id} className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                  meta.color,
                                )}
                              >
                                <Icon className="w-2.5 h-2.5" />
                              </span>
                              <span className="text-xs text-on-surface font-medium">
                                {subEventLabel(entry)}
                              </span>
                              <span className="text-[9px] text-outline ml-auto shrink-0">
                                {formatTime(entry.occurred_at)}
                              </span>
                            </div>
                          );
                        })}

                        {blockChildren.length > 0 && dataChildren.length > 0 && (
                          <div className="border-t border-blue-100 my-1" />
                        )}

                        {dataChildren.map(entry => {
                          const meta = SUB_EVENT_META[entry.event_type];
                          if (!meta) return null;
                          const Icon = meta.icon as React.ElementType;
                          return (
                            <div key={entry.log_id} className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                  meta.color,
                                )}
                              >
                                <Icon className="w-2.5 h-2.5" />
                              </span>
                              <span className="text-xs text-on-surface font-medium">
                                {subEventLabel(entry)}
                              </span>
                              <span className="text-[9px] text-outline ml-auto shrink-0">
                                {formatTime(entry.occurred_at)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
