import React, { useEffect, useState } from 'react';
import { getDeliverables, storageJson, fileSize, StorageApiError, type StoredDeliverable } from '../../services/driveStorageService';
import type { DisciplinaType } from '../../types';
export function useClientDeliverables(projectId: string, enabled: boolean) {
  const [files, setFiles] = useState<StoredDeliverable[]>([]);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    const data = await getDeliverables(projectId);
    setFiles(data.files.filter(f => f.published)); setLocked(false); setError('');
  }
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setFiles([]); setError(''); setLocked(false);
    void (async () => {
      try {
        const token = new URLSearchParams(window.location.search).get('portal');
        if (token) await storageJson('/client-session', { projectId, token });
        const data = await getDeliverables(projectId);
        if (!cancelled) { setFiles(data.files.filter(f => f.published)); setLocked(false); }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof StorageApiError && e.status === 401) setLocked(true);
        else setError((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, enabled]);
  async function unlock(password: string) {
    setBusy(true); setError('');
    try { await storageJson('/client-session', { projectId, password }); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return { files, locked, error, busy, unlock, refresh: async () => { setBusy(true); try { await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } } };
}
export function ClientStorageAccess({ access }: { access: ReturnType<typeof useClientDeliverables> }) {
  const [password, setPassword] = useState('');
  if (!access.locked && !access.error) return null;
  return <div className="max-w-bojana-reading mx-auto px-6 sm:px-12 lg:px-16 py-8 text-sm space-y-3">
    {access.locked && <form onSubmit={e => { e.preventDefault(); void access.unlock(password).then(() => setPassword('')); }} className="bojana-widget border border-bojana-line rounded-bojana-widget p-5 space-y-3">
      <h2 className="bojana-heading-section font-medium text-bojana-ink">Acceso a tus entregables</h2>
      <label className="block text-bojana-ink" htmlFor="client-file-password">Clave de acceso del proyecto</label>
      <div className="flex gap-3 flex-wrap">
        <input id="client-file-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="bojana-field min-h-11 border border-bojana-line rounded-bojana-widget px-3 flex-1 min-w-0" />
        <button className="bojana-button bojana-button-primary min-h-11 px-4 bg-bojana-ink text-bojana-inverse rounded-bojana-widget disabled:opacity-50" disabled={access.busy}>Acceder a archivos</button>
      </div>
    </form>}
    {access.error && <><p role="alert" className="text-bojana-error">{access.error}</p>{!access.locked && <button className="bojana-button bojana-button-text min-h-11 underline" type="button" disabled={access.busy} onClick={() => void access.refresh()}>Reintentar</button>}</>}
    {access.busy && <p role="status">Consultando entregables…</p>}
  </div>;
}
export function ClientTaskFiles({ files, discipline, taskId }: { files: StoredDeliverable[]; discipline: DisciplinaType; taskId?: string }) {
  const relevant = files.filter(f => f.discipline === discipline && (!taskId || f.taskId === taskId));
  if (!relevant.length) return null;
  const groups = new Map<string, StoredDeliverable[]>();
  for (const file of relevant) groups.set(file.taskId, [...(groups.get(file.taskId) || []), file]);
  return <div className="space-y-bojana-block">{Array.from(groups.entries()).map(([taskId, versions]) => <section key={taskId} className="border-t border-bojana-line pt-5 space-y-3">
    <p className="text-xs text-bojana-muted">{versions[0].needTitle}</p>
    <h3 className="bojana-heading-component text-base text-bojana-ink font-medium">{versions[0].taskTitle || 'Entregables de la tarea'}</h3>
    <ul className="space-y-3">{versions.map(f => <li key={f.id} className="flex gap-3 flex-wrap items-center justify-between">
      {f.thumbnailUrl && <img src={f.thumbnailUrl} alt="" loading="lazy" className="bojana-media w-16 h-16 object-contain" onError={e => { e.currentTarget.hidden = true; }} />}
      <a className="text-sm text-bojana-ink underline underline-offset-4 break-all min-h-11 inline-flex items-center" href={f.url}>{f.name}</a>
      <span className="text-xs text-bojana-muted">Versión {f.version} · {fileSize(f.size)} · {new Date(f.createdAt).toLocaleDateString('es-AR')}</span>
    </li>)}</ul>
  </section>)}</div>;
}
