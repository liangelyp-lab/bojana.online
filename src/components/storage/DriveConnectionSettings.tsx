import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { Field } from '../ui/DesignSystem';
import { getStorageStatus, storageJson, storageRequest, type StorageStatus } from '../../services/driveStorageService';
const button = "bojana-button bojana-button-secondary min-h-11 px-4 border border-bojana-line rounded-bojana-widget text-sm text-bojana-ink hover:bg-bojana-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bojana-ink disabled:opacity-50";
export default function DriveConnectionSettings() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function refresh() {
    try { setStatus(await getStorageStatus()); setMessage(''); } catch (e) { setMessage((e as Error).message); }
  }
  useEffect(() => { void refresh(); const focus = () => { void refresh(); }; window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus); }, []);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true); setMessage('');
    try { await fn(); await refresh(); } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  return <section aria-labelledby="drive-settings-title" className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 space-y-bojana-block">
    <div className="flex gap-3 items-start"><FolderOpen size={20} aria-hidden="true" /><div><h2 id="drive-settings-title" className="bojana-heading-section text-base font-medium text-bojana-ink">Archivos del estudio</h2><p className="text-base text-bojana-muted mt-1">Conectá Google Drive para organizar los archivos por proyecto y disciplina.</p></div></div>
    {!status ? <button type="button" className={button} disabled={busy} onClick={() => void refresh()}>Reintentar conexión</button>
      : !status.configured ? <p className="text-base text-bojana-muted">La integración necesita la configuración de Google en el servidor. Cuando esté lista, podrás conectar la cuenta del estudio desde acá.</p>
      : !status.authorized ? <form className="space-y-3" onSubmit={e => { e.preventDefault(); void act(async () => { await storageJson('/session', { password }); setPassword(''); }); }}>
        <Field id="drive-studio-key" label="Clave de archivos del estudio" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="min-h-11 text-sm" />
        <p className="text-base text-bojana-muted">Usá la clave configurada para autorizar el acceso a los archivos reales del estudio.</p>
        <button className={button} disabled={busy}>Autorizar acceso</button>
      </form> : <>
        <p className="text-sm text-bojana-ink" role="status">{status.connected ? `Google Drive conectado · ${status.account}` : 'Google Drive sin conectar'}</p>
        <div className="flex flex-wrap gap-bojana-inside">
          <a href="/api/storage/oauth/start" className={button + "inline-flex items-center"}>{status.connected ? 'Reconectar Google Drive' : 'Conectar Google Drive'}</a>
          {status.connected && <button type="button" className={button} disabled={busy} onClick={() => { if (window.confirm('¿Desconectar Drive? Se conservarán los archivos, pero no estarán disponibles en el portal hasta reconectar.')) void act(() => storageRequest('/connection', { method: 'DELETE' })); }}>Desconectar</button>}
          <button type="button" className={button} disabled={busy} onClick={() => void act(() => storageRequest('/session', { method: 'DELETE' }))}>Cerrar acceso a archivos</button>
        </div>
        <p className="text-base text-bojana-muted">Los archivos se guardan en la cuenta del estudio. Cada entregable conserva el contexto de su tarea; cargarlo no lo publica ni envía un email.</p>
      </>}
    {busy && <p className="text-base text-bojana-muted" role="status">Guardando…</p>}
    {message && <p className="text-sm text-bojana-error" role="alert">{message}</p>}
  </section>;
}
