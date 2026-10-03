import React, { useState } from 'react';
import { 
  ProjectData, 
  AvancePost 
} from '../../types';
import { 
  Camera, 
  Calendar, 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  Share2,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface AvancesModuleProps {
  project: ProjectData;
  isAdmin: boolean;
  onUpdateAvances: (avances: AvancePost[]) => void;
  onToast: (msg: string) => void;
}

export default function AvancesModule({
  project,
  isAdmin,
  onUpdateAvances,
  onToast
}: AvancesModuleProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Lightbox modal state
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    currentIndex: number;
    title: string;
  } | null>(null);

  // New Avance form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('02 OCT 2026');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('Terminaciones');
  const [newPhotosRaw, setNewPhotosRaw] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');

  const posts = project.avances || [];

  const handleOpenLightbox = (images: string[], index: number, title: string) => {
    setLightboxData({
      images,
      currentIndex: index,
      title
    });
  };

  const handleNextPhoto = () => {
    if (!lightboxData) return;
    setLightboxData(prev => prev ? ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }) : null);
  };

  const handlePrevPhoto = () => {
    if (!lightboxData) return;
    setLightboxData(prev => prev ? ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }) : null);
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('¿Desea eliminar esta publicación de avance de obra?')) {
      const updated = posts.filter(p => p.id !== id);
      onUpdateAvances(updated);
      onToast('Avance eliminado.');
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    // Parse photos from textarea lines or comma-separated
    const photos = newPhotosRaw
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const archivos = newFileName.trim() ? [
      {
        nombre: newFileName.trim(),
        url: newFileUrl.trim() || '#',
        tamano: 'PDF Técnico'
      }
    ] : undefined;

    const newPost: AvancePost = {
      id: `av-${Date.now()}`,
      titulo: newTitle.trim(),
      fecha: newDate.trim() || new Date().toLocaleDateString('es-AR').toUpperCase(),
      texto: newText.trim(),
      categoria: newCategory.trim() || 'General',
      autor: 'Bojana Estudio',
      fotos: photos.length > 0 ? photos : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
      ],
      archivos
    };

    const updated = [newPost, ...posts];
    onUpdateAvances(updated);
    setShowCreateModal(false);
    setNewTitle('');
    setNewText('');
    setNewPhotosRaw('');
    setNewFileName('');
    setNewFileUrl('');
    onToast(`Avance "${newPost.titulo}" publicado.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      
      {/* 1. TOP HEADER & ACTION */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-600 font-bold">
              Módulo de Avances
            </span>
            <span className="text-[10px] font-mono text-gray-400">&bull;</span>
            <span className="text-[10px] font-mono text-gray-500">¿Qué pasó en la obra?</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 font-sans tracking-tight mt-0.5">
            Registro Fotográfico & Bitácora Visual
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Actualizaciones periódicas con galería fotográfica, descripciones técnicas y reportes.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>+ Publicar Nuevo Avance</span>
          </button>
        )}
      </div>

      {/* 2. CHRONOLOGICAL FEED OF POSTS */}
      {posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
          <Camera className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">Aún no hay avances publicados</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Bojana Estudio publicará aquí las actualizaciones fotográficas del proyecto a medida que se ejecuten las tareas.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 px-3 py-1.5 rounded-lg bg-gray-950 text-white text-xs font-mono"
            >
              Publicar primer avance
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article 
              key={post.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition hover:border-gray-300"
            >
              {/* Post Header */}
              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md">
                      {post.fecha}
                    </span>
                    {post.categoria && (
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {post.categoria}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-gray-400">
                      Publicado por {post.autor || 'Bojana Estudio'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight pt-1">
                    {post.titulo}
                  </h3>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-rose-600 transition"
                    title="Eliminar publicación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Post Body Description */}
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans">
                  {post.texto}
                </p>

                {/* Photo Grid */}
                {post.fotos && post.fotos.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                      <span>Registro Fotográfico ({post.fotos.length} fotos)</span>
                      <span>Haga clic en una imagen para ampliar</span>
                    </div>

                    <div className={`grid gap-2.5 ${
                      post.fotos.length === 1 
                        ? 'grid-cols-1' 
                        : post.fotos.length === 2 
                          ? 'grid-cols-2' 
                          : 'grid-cols-2 sm:grid-cols-3'
                    }`}>
                      {post.fotos.map((imgUrl, imgIdx) => (
                        <div 
                          key={imgIdx}
                          onClick={() => handleOpenLightbox(post.fotos, imgIdx, post.titulo)}
                          className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group shadow-2xs"
                        >
                          <img 
                            src={imgUrl} 
                            alt={`${post.titulo} - foto ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white font-mono text-xs bg-black/60 px-2 py-1 rounded backdrop-blur-xs transition">
                              Ver en alta &rarr;
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {post.archivos && post.archivos.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 mt-2 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                      Archivos adjuntos
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {post.archivos.map((file, fIdx) => (
                        <a
                          key={fIdx}
                          href={file.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-gray-700 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span className="font-medium">{file.nombre}</span>
                          {file.tamano && <span className="text-gray-400">({file.tamano})</span>}
                          <Download className="w-3 h-3 text-gray-400 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 3. LIGHTBOX MODAL */}
      {lightboxData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col justify-between p-4 sm:p-6 animate-fade-in">
          {/* Lightbox Topbar */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div>
              <h4 className="text-sm font-bold truncate">{lightboxData.title}</h4>
              <p className="text-[11px] font-mono text-gray-400">
                Foto {lightboxData.currentIndex + 1} de {lightboxData.images.length}
              </p>
            </div>
            <button
              onClick={() => setLightboxData(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Photo View */}
          <div className="relative flex-1 flex items-center justify-center p-2">
            <img 
              src={lightboxData.images[lightboxData.currentIndex]}
              alt="Vista completa"
              className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl"
            />

            {lightboxData.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition border border-white/10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition border border-white/10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {lightboxData.images.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
              {lightboxData.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxData(prev => prev ? ({ ...prev, currentIndex: i }) : null)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                    i === lightboxData.currentIndex ? 'border-sky-400 scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: PUBLICAR NUEVO AVANCE (ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Publicar Nuevo Avance de Obra
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Título del Avance</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Colocación de revestimientos"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Fecha</label>
                  <input
                    type="text"
                    placeholder="02 OCT 2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Categoría / Rubro</label>
                  <input
                    type="text"
                    placeholder="ej: Terminaciones, Instalaciones"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Texto Descriptivo</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Se completó el revestimiento del sector SUM y comienza la preparación del gimnasio..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">
                  Fotos (URLs de imágenes, una por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                  value={newPhotosRaw}
                  onChange={(e) => setNewPhotosRaw(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Si se deja vacío, se agregará una foto arquitectónica de muestra en alta resolución.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">Archivo Opcional (Nombre)</label>
                  <input
                    type="text"
                    placeholder="Reporte-Inspeccion.pdf"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-mono text-gray-500 font-bold block mb-1">URL de Descarga</label>
                  <input
                    type="text"
                    placeholder="#"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-950 text-white font-mono font-bold"
                >
                  Publicar Avance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
