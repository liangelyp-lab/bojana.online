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
    <div className="space-y-bojana-block max-w-bojana-modal mx-auto pb-8">

      {/* 1. TOP HEADER & ACTION */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget flex flex-col sm:flex-row sm:items-center justify-between gap-bojana-block">
        <div>
          <div className="flex items-center gap-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-sky-600 font-medium">
              Módulo de Avances
            </span>
            <span className="text-xs font-sans text-bojana-muted">&bull;</span>
            <span className="text-xs font-sans text-bojana-muted">¿Qué pasó en la obra?</span>
          </div>
          <h2 className="bojana-heading-section text-xl font-medium text-bojana-ink font-sans tracking-normal mt-0.5">
            Registro Fotográfico & Bitácora Visual
          </h2>
          <p className="text-xs text-bojana-muted mt-1">
            Actualizaciones periódicas con galería fotográfica, descripciones técnicas y reportes.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget shrink-0"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>+ Publicar Nuevo Avance</span>
          </button>
        )}
      </div>

      {/* 2. CHRONOLOGICAL FEED OF POSTS */}
      {posts.length === 0 ? (
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-12 text-center space-y-3">
          <Camera className="w-10 h-10 text-bojana-line mx-auto" />
          <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink">Aún no hay avances publicados</h3>
          <p className="text-xs text-bojana-muted max-w-md mx-auto">
            Bojana Estudio publicará aquí las actualizaciones fotográficas del proyecto a medida que se ejecuten las tareas.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bojana-button bojana-button-primary mt-2 px-3 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse text-xs font-sans"
            >
              Publicar primer avance
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-bojana-block">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-bojana-surface border border-bojana-line rounded-bojana-widget shadow-bojana-widget overflow-hidden transition hover:border-bojana-line"
            >
              {/* Post Header */}
              <div className="p-5 sm:p-6 border-b border-bojana-line flex items-start justify-between gap-bojana-block">
                <div className="space-y-bojana-inside">
                  <div className="flex flex-wrap items-center gap-bojana-inside">
                    <span className="text-xs font-sans font-medium uppercase tracking-normal text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-bojana-badge">
                      {post.fecha}
                    </span>
                    {post.categoria && (
                      <span className="text-xs font-sans text-bojana-muted bg-bojana-soft px-2 py-0.5 rounded-bojana-badge">
                        {post.categoria}
                      </span>
                    )}
                    <span className="text-xs font-sans text-bojana-muted">
                      Publicado por {post.autor || 'Bojana Estudio'}
                    </span>
                  </div>

                  <h3 className="bojana-heading-component text-base sm:text-lg font-medium text-bojana-ink tracking-normal pt-1">
                    {post.titulo}
                  </h3>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="bojana-icon-button p-1.5 rounded-bojana-widget text-bojana-muted hover:text-bojana-error transition"
                    title="Eliminar publicación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Post Body Description */}
              <div className="p-5 sm:p-6 space-y-bojana-block">
                <p className="text-xs sm:text-sm text-bojana-ink leading-relaxed font-sans">
                  {post.texto}
                </p>

                {/* Photo Grid */}
                {post.fotos && post.fotos.length > 0 && (
                  <div className="space-y-bojana-inside pt-1">
                    <div className="flex items-center justify-between text-xs font-sans text-bojana-muted">
                      <span>Registro Fotográfico ({post.fotos.length} fotos)</span>
                      <span>Haga clic en una imagen para ampliar</span>
                    </div>

                    <div className={`grid gap-bojana-inside ${
                      post.fotos.length === 1
                        ? "grid-cols-1"
                        : post.fotos.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 sm:grid-cols-3"
                    }`}>
                      {post.fotos.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => handleOpenLightbox(post.fotos, imgIdx, post.titulo)}
                          className="relative aspect-16/10 rounded-bojana-widget overflow-hidden bg-bojana-soft border border-bojana-line cursor-pointer group shadow-bojana-widget"
                        >
                          <img
                            src={imgUrl}
                            alt={`${post.titulo} - foto ${imgIdx + 1}`}
                            className="bojana-media w-full h-full object-contain group-hover:scale-105 transition duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-bojana-inverse font-sans text-xs bg-black/60 px-2 py-1 rounded-bojana-badge backdrop-blur-xs transition">
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
                  <div className="border-t border-bojana-line pt-3 mt-2 space-y-bojana-inside">
                    <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">
                      Archivos adjuntos
                    </span>
                    <div className="flex flex-wrap gap-bojana-inside">
                      {post.archivos.map((file, fIdx) => (
                        <a
                          key={fIdx}
                          href={file.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="bg-bojana-surface hover:bg-bojana-soft border border-bojana-line rounded-bojana-widget px-3 py-1.5 flex items-center gap-bojana-inside text-xs font-sans text-bojana-ink transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span className="font-medium">{file.nombre}</span>
                          {file.tamano && <span className="text-bojana-muted">({file.tamano})</span>}
                          <Download className="w-3 h-3 text-bojana-muted ml-1" />
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
          <div className="flex items-center justify-between text-bojana-inverse border-b border-white/10 pb-3">
            <div>
              <h4 className="bojana-heading-component text-sm font-medium truncate">{lightboxData.title}</h4>
              <p className="text-xs font-sans text-bojana-muted">
                Foto {lightboxData.currentIndex + 1} de {lightboxData.images.length}
              </p>
            </div>
            <button
              onClick={() => setLightboxData(null)}
              className="bojana-icon-button p-2 rounded-bojana-widget bg-white/10 hover:bg-white/20 text-bojana-inverse transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Photo View */}
          <div className="relative flex-1 flex items-center justify-center p-2">
            <img
              src={lightboxData.images[lightboxData.currentIndex]}
              alt="Vista completa"
              className="bojana-media max-h-[78vh] max-w-full rounded-bojana-widget object-contain shadow-bojana-widget"
            />

            {lightboxData.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="bojana-icon-button absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-bojana-widget bg-black/50 hover:bg-black/80 text-bojana-inverse transition border border-white/10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="bojana-icon-button absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-bojana-widget bg-black/50 hover:bg-black/80 text-bojana-inverse transition border border-white/10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {lightboxData.images.length > 1 && (
            <div className="flex items-center justify-center gap-bojana-inside overflow-x-auto py-2">
              {lightboxData.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxData(prev => prev ? ({ ...prev, currentIndex: i }) : null)}
                  className={`bojana-icon-button w-12 h-12 rounded-bojana-widget overflow-hidden border transition shrink-0 ${
                    i === lightboxData.currentIndex ? "border-sky-400 scale-105" : "border-transparent opacity-60"
                  }`}
                >
                  <img src={img} alt="Miniatura" className="bojana-media w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: PUBLICAR NUEVO AVANCE (ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full p-6 shadow-bojana-widget space-y-bojana-block animate-scale-up">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Publicar Nuevo Avance de Obra
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bojana-button bojana-button-text text-bojana-muted hover:text-bojana-ink"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-bojana-block text-xs">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Título del Avance</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Colocación de revestimientos"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Fecha</label>
                  <input
                    type="text"
                    placeholder="02 OCT 2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>

                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Categoría / Rubro</label>
                  <input
                    type="text"
                    placeholder="ej: Terminaciones, Instalaciones"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Texto Descriptivo</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Se completó el revestimiento del sector SUM y comienza la preparación del gimnasio..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">
                  Fotos (URLs de imágenes, una por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                  value={newPhotosRaw}
                  onChange={(e) => setNewPhotosRaw(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                />
                <span className="text-xs text-bojana-muted block mt-1">
                  Si se deja vacío, se agregará una foto arquitectónica de muestra en alta resolución.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-bojana-line">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Archivo Opcional (Nombre)</label>
                  <input
                    type="text"
                    placeholder="Reporte-Inspeccion.pdf"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">URL de Descarga</label>
                  <input
                    type="text"
                    placeholder="#"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-bojana-inside pt-3 border-t border-bojana-line">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line text-bojana-ink font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans font-medium"
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
