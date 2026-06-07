import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import { getPhotos, uploadPhoto, deletePhoto, PhotoOut } from '@/src/services/photoService';

export default function PhotosManager({ projectId }: { projectId: number }) {
  const [photos, setPhotos] = useState<PhotoOut[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPhotos(projectId).then(setPhotos).catch(console.error);
  }, [projectId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const photo = await uploadPhoto(projectId, file);
      setPhotos((prev) => [...prev, photo]);
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Error al subir la foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    try {
      await deletePhoto(projectId, photoId);
      setPhotos((prev) => prev.filter((p) => p.photo_id !== photoId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary tracking-tight">Galería del Proyecto</h2>
        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">{photos.length}/10</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
      />
      {photos.length === 0 ? (
        <button onClick={() => inputRef.current?.click()} className="w-full py-12 border-2 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center gap-3 text-outline hover:border-primary/30 hover:text-primary transition-all">
          <Camera className="w-8 h-8 opacity-40" />
          <span className="text-xs font-bold uppercase tracking-widest">Sube hasta 10 fotos del proyecto (JPG/PNG, máx. 5 MB)</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <div key={photo.photo_id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
              <button onClick={() => handleDelete(photo.photo_id)} className="absolute top-1 right-1 p-1 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {photos.length < 10 && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="relative aspect-square rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center gap-2 text-outline hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6 opacity-40 group-hover:opacity-100" />}
              <span className="text-[10px] font-bold uppercase tracking-widest">Añadir</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
