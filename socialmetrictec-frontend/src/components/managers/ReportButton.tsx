import { useState } from 'react';
import { motion } from 'motion/react';
import { Download, X, FileText, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const TEMPLATES = [
  { key: 'institucional', label: 'Institucional', color: '#002068' },
  { key: 'esmeralda', label: 'Esmeralda', color: '#047857' },
  { key: 'monocromo', label: 'Monocromo', color: '#1f2937' },
];

const SECTIONS = [
  { key: 'metrics', label: 'Métricas' },
  { key: 'milestones', label: 'Hitos completados' },
  { key: 'testimonies', label: 'Testimonios' },
  { key: 'photos', label: 'Fotos' },
];

export default function ReportButton({ projectId }: { projectId: number }) {
  const [showModal, setShowModal] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>({
    metrics: true, milestones: true, testimonies: true, photos: true,
  });
  const [template, setTemplate] = useState('institucional');

  const generate = () => {
    const selected = Object.entries(sections).filter(([, on]) => on).map(([key]) => key);
    const query = new URLSearchParams({ sections: selected.join(','), template });
    window.open(`/project/${projectId}/report?${query.toString()}`, '_blank');
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-primary text-white px-6 py-3 cursor-pointer rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
      >
        <Download className="w-4 h-4" /> Generar Reporte PDF
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-10">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-outline hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Generar Reporte PDF</h2>
                <p className="text-on-surface-variant font-light text-sm mt-2 font-body">Elige qué incluir y la plantilla visual. Verás una vista previa antes de descargar.</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Secciones a incluir</label>
                <div className="grid grid-cols-2 gap-2">
                  {SECTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSections((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all',
                        sections[key] ? 'bg-primary/5 text-primary border-primary/30' : 'bg-surface-container-low text-on-surface-variant border-transparent',
                      )}
                    >
                      {sections[key] ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Plantilla corporativa</label>
                <div className="flex gap-2">
                  {TEMPLATES.map(({ key, label, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTemplate(key)}
                      className={cn('flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all', template === key ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/20')}
                    >
                      <span className="w-full h-8 rounded-md" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-bold text-on-surface-variant">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={generate}
                disabled={!Object.values(sections).some(Boolean)}
                className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> Ver vista previa
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
