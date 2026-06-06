import { useRef, useState } from 'react';
import { CloudUpload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { uploadMedia } from '@/src/services/mediaService';

interface MediaUploaderProps {
  projectId: number;
  onUpload: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  currentUrl?: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function MediaUploader({
  projectId,
  onUpload,
  accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',
  maxSizeMB = 100,
  currentUrl,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo excede el límite de ${maxSizeMB}MB.`);
      setState('error');
      return;
    }

    setState('uploading');
    setProgress(0);
    setError('');

    try {
      const result = await uploadMedia(projectId, file, setProgress);
      setPreviewUrl(result.url);
      setState('success');
      onUpload(result.url);
    } catch {
      setError('Error al subir el archivo. Intenta de nuevo.');
      setState('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative group aspect-video rounded-xl overflow-hidden bg-surface-container shadow-inner border border-outline-variant/10 cursor-pointer transition-all',
          state === 'uploading' && 'pointer-events-none',
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-outline/40">
            <CloudUpload className="w-8 h-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Arrastra o haz clic</span>
          </div>
        )}

        {state === 'uploading' && (
          <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <div className="w-3/4 bg-white/30 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">{progress}%</span>
          </div>
        )}

        {state !== 'uploading' && (
          <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-white">
              <CloudUpload className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {previewUrl ? 'Cambiar archivo' : 'Cargar archivo'}
              </span>
            </div>
          </div>
        )}
      </div>

      {state === 'success' && (
        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
          <CheckCircle2 className="w-3 h-3" /> Archivo subido correctamente
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-2 text-error text-[10px] font-bold uppercase tracking-widest">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
