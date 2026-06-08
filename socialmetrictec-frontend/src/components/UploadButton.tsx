import { useRef, useState } from 'react';
import { CloudUpload, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { uploadMediaStandalone } from '@/src/services/mediaService';

interface UploadButtonProps {
  onUploaded: (url: string) => void;
  accept?: string;
  label?: string;
  className?: string;
}

/**
 * Botón compacto para subir un archivo a Supabase y devolver su URL.
 * Se coloca junto a un campo de URL para que el usuario pueda elegir:
 * pegar un enlace o subir el archivo directamente.
 */
export default function UploadButton({
  onUploaded,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  label = 'Subir archivo',
  className,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      const { url } = await uploadMediaStandalone(file);
      onUploaded(url);
    } catch {
      setError('No se pudo subir el archivo.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full flex cursor-pointer items-center justify-center gap-2 bg-primary/10 text-primary rounded-xl py-2.5 px-4 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-primary/20 disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
        {loading ? 'Subiendo...' : label}
      </button>

      {error && (
        <div className="flex items-center gap-1.5 text-error text-[10px] font-bold uppercase tracking-widest">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  );
}
