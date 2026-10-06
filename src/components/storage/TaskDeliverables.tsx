import { Button, Field, Skeleton, Spinner } from '../ui/DesignSystem';
import { useEffect, useRef, useState } from 'react';
import { Paperclip, Upload, FolderOpen } from 'lucide-react';
import type { ProjectData, DisciplinaType, TaskContentType } from '../../types';
import { fileSize, getStorageStatus, getDeliverables, prepareProjectStorage, openGooglePicker, selectDriveFile, uploadDriveFile, storageRequest, type StorageStatus, type StoredDeliverable, type ProjectStorage } from '../../services/driveStorageService';
const button = "bojana-button bojana-button-secondary min-h-11 px-3 border border-bojana-line rounded-bojana-widget text-sm text-bojana-ink hover:bg-bojana-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bojana-ink disabled:opacity-50 flex items-center gap-bojana-inside";
export default function TaskDeliverables({ project, taskId, discipline, onChange, compact = false, allowedContentTypes = ['archivo'] }: { project: ProjectData; taskId: string; discipline: DisciplinaType; onChange: (storage: ProjectStorage, file?: StoredDeliverable) => void; compact?: boolean; allowedContentTypes?: TaskContentType[] }) {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [files, setFiles] = useState<StoredDeliverable[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [choices, setChoices] = useState<{ id: string; name: string; size?: string }[]>([]);
  const [nextPage, setNextPage] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const acceptsImages = allowedContentTypes.includes('imagenes');
  const acceptsVideos = allowedContentTypes.includes('videos');
  const acceptsDownloads = allowedContentTypes.includes('descargables');
  const acceptsAnyFile = allowedContentTypes.includes('archivo');
  const inputAccept = acceptsAnyFile
    ? undefined
    : [acceptsImages ? 'image/*' : '', acceptsVideos ? 'video/*' : '', acceptsDownloads ? 'application/pdf,.zip,.rar,.7z,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.ppt,.pptx' : ''].filter(Boolean).join(',');
  useEffect(() => {
    let active = true;
    void getStorageStatus().then(async s => { if (active) setStatus(s); if (s.authorized && project.storage) { const data = await getDeliverables(project.id); if (active) setFiles(data.files.filter(f => f.taskId === taskId && f.discipline === discipline)); } }).catch(() => { if (active) setStatus({ configured: false, authorized: false, connected: false, maxUploadBytes: 0 }); });
    return () => { active = false; };
  }, [project.id, taskId, discipline, project.storage?.projectFolderId]);
  async function run(fn: (storage: ProjectStorage) => Promise<StoredDeliverable | void>) {
    setBusy(true); setError('');
    try {
      const storage = await prepareProjectStorage(project);
      onChange(storage);
      const file = await fn(storage);
      if (file) { setFiles(old => [...old.filter(f => f.id !== file.id), file]); onChange(storage, file); setSelecting(false); }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); setProgress(null); }
  }
  async function listChoices(pageToken = '') {
    const params = new URLSearchParams({ discipline, search, pageToken });
    const data = await storageRequest<{ files: typeof choices; nextPageToken?: string }>(`/projects/${encodeURIComponent(project.id)}/files?${params}`);
    setChoices(old => pageToken ? [...old, ...data.files] : data.files); setNextPage(data.nextPageToken);
  }
  if (!status) return <section aria-label="Contenido de la actualización"><Skeleton rows={2} label="Consultando archivos" /></section>;
  const ready = status?.authorized && status?.connected;
  return <section className="space-y-3" aria-label="Contenido de la actualización">
    {files.length > 0 && <ul className="space-y-bojana-inside">{files.map(file => <li key={file.id} className="bojana-file border border-bojana-line rounded-bojana-widget p-3 bg-bojana-surface flex flex-wrap gap-bojana-inside justify-between items-center">
      {file.thumbnailUrl && <img src={file.thumbnailUrl} alt="" loading="lazy" className="bojana-media w-12 h-12 object-contain" onError={e => { e.currentTarget.hidden = true; }} />}
      <a href={file.url} className="text-sm text-bojana-ink underline underline-offset-4 break-all"><Paperclip size={14} className="inline mr-1" aria-hidden="true" />{file.name}</a>
      <span className="text-xs text-bojana-muted">Versión {file.version} · {fileSize(file.size)} · {file.published ? 'Publicado' : 'Sin publicar'}</span>
    </li>)}</ul>}
    {!files.length && !compact && <p className="text-sm text-bojana-muted">Agregá el resultado de esta tarea. Se compartirá cuando publiques los cambios.</p>}
    <div className="flex flex-wrap gap-bojana-inside">
      <Button variant="secondary" className="!min-h-9 !rounded-bojana-widget !px-3 text-xs" disabled={!ready || busy} onClick={() => input.current?.click()}><Upload size={15} aria-hidden="true" />Subir archivo</Button>
      <Button variant="secondary" className="!min-h-9 !rounded-bojana-widget !px-3 text-xs" disabled={!ready || busy} onClick={() => void run(async () => { await listChoices(); setSelecting(true); })}><FolderOpen size={15} aria-hidden="true" />Seleccionar Drive</Button>
      <input ref={input} className="sr-only" type="file" tabIndex={-1} aria-label="Archivo para entregar" onChange={e => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        const matchesType = acceptsAnyFile || (acceptsImages && file.type.startsWith('image/')) || (acceptsVideos && file.type.startsWith('video/')) || (acceptsDownloads && !file.type.startsWith('image/') && !file.type.startsWith('video/'));
        if (!matchesType) { setError('Este archivo no coincide con los tipos de contenido configurados para la tarea.'); return; }
        if (!file.size || file.size > (status?.maxUploadBytes || 0)) { setError(`Seleccioná un archivo de hasta ${Math.floor((status?.maxUploadBytes || 0) / 1048576)} MB.`); return; }
        void run(() => uploadDriveFile(project, taskId, discipline, file, setProgress));
      }} accept={inputAccept} />
    </div>
    {selecting && <div className="bojana-widget border border-bojana-line bg-bojana-surface rounded-bojana-widget p-4 space-y-3">
      <p className="text-sm text-bojana-ink">Archivos de {discipline} en este proyecto</p>
      <form className="flex gap-bojana-inside" onSubmit={e => { e.preventDefault(); void run(async () => { await listChoices(); }); }}>
        <Field aria-label="Buscar archivos por nombre" type="search" value={search} onChange={e => setSearch(e.target.value)} className="min-h-11 min-w-0 flex-1 text-sm" placeholder="Buscar archivos" />
        <button className={button} disabled={busy}>Buscar</button>
      </form>
      {choices.length ? <ul className="space-y-bojana-inside">{choices.map(f => <li key={f.id}><button type="button" className={button + " bojana-button bojana-button-text w-full text-left justify-between"} disabled={busy} onClick={() => void run(() => selectDriveFile(project, taskId, discipline, f.id))}><span className="break-all">{f.name}</span><span className="shrink-0 text-xs">{fileSize(f.size)}</span></button></li>)}</ul> : <p className="text-sm text-bojana-muted">Todavía no hay archivos en esta carpeta. Subí uno o elegí un archivo de otra carpeta de Drive.</p>}
      <div className="flex gap-bojana-inside flex-wrap">
        {nextPage && <button type="button" className={button} disabled={busy} onClick={() => void run(async () => { await listChoices(nextPage); })}>Ver más archivos</button>}
        <button type="button" className={button} disabled={busy || !status?.picker?.apiKey || !status?.picker?.appId} onClick={() => void run(async () => { const id = await openGooglePicker(status!); if (id) return selectDriveFile(project, taskId, discipline, id); })}>Elegir de otra carpeta</button>
        <button type="button" className={button} disabled={busy} onClick={() => setSelecting(false)}>Cerrar selector</button>
      </div>
      <p className="text-sm text-bojana-muted">Se conserva una copia como versión del entregable. El archivo original permanece en su carpeta.</p>
    </div>}
    {busy && <p role="status" className="text-sm text-bojana-ink"><Spinner label={progress === null ? 'Preparando archivos…' : progress < 100 ? `Subiendo archivo · ${progress}%` : 'Guardando en Drive…'} /></p>}
    {error && <p role="alert" className="text-sm text-bojana-error">{error}</p>}
  </section>;
}
