import { FolderOpen } from 'lucide-react';

export default function NoProjectSelected() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
      <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
        <FolderOpen className="w-10 h-10 text-primary/40" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-primary tracking-tighter">
          Ningún proyecto seleccionado
        </h2>
        <p className="text-on-surface-variant font-light max-w-sm">
          Usa el selector de proyectos en la barra de navegación para elegir sobre cuál trabajar.
        </p>
      </div>
    </div>
  );
}
