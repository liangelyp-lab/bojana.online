import { Readable } from 'node:stream';
import { StorageError } from './provider.mjs';
const API = 'https://www.googleapis.com/drive/v3';
const FIELDS = 'id,name,mimeType,size,modifiedTime,thumbnailLink,parents,capabilities(canDownload),trashed';
const escapeQuery = value => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
export class GoogleDriveProvider {
  id = 'google-drive';
  constructor(accessToken, fetcher = fetch) { this.accessToken = accessToken; this.fetcher = fetcher; }
  async request(url, init = {}, retry = true) {
    const response = await this.fetcher(url, { ...init, headers: { Authorization: `Bearer ${this.accessToken}`, ...init.headers } });
    if (!response.ok) {
      // Retry read requests only; replaying a streamed upload or copy may duplicate a file.
      if (retry && (!init.method || init.method === 'GET') && [429, 500, 502, 503, 504].includes(response.status)) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return this.request(url, init, false);
      }
      const payload = await response.json().catch(() => ({}));
      const reason = payload.error?.errors?.[0]?.reason;
      const messages = { storageQuotaExceeded: 'La cuenta de Drive no tiene espacio disponible.', rateLimitExceeded: 'Drive alcanzó su cuota de solicitudes. Reintentá en unos minutos.', userRateLimitExceeded: 'Drive alcanzó su cuota de solicitudes. Reintentá en unos minutos.' };
      throw new StorageError(messages[reason] || (response.status === 401 ? 'Reconectá la cuenta de Google Drive.' : response.status === 404 ? 'El archivo o la carpeta ya no está disponible en Drive.' : 'Drive no pudo completar la operación. Verificá los permisos y reintentá.'), response.status === 404 ? 404 : 502, reason || 'drive_error');
    }
    return response;
  }
  async json(path, init) { return (await this.request(`${API}${path}`, init)).json(); }
  async generateId() { return (await this.json('/files/generateIds?count=1&space=drive')).ids[0]; }
  async ensureFolder(id, name, parentId) {
    const existing = await this.request(`${API}/files/${encodeURIComponent(id)}?fields=id,mimeType,trashed`).then(r => r.json()).catch(e => { if (e.status === 404) return null; throw e; });
    if (existing) {
      if (existing.trashed || existing.mimeType !== 'application/vnd.google-apps.folder') throw new StorageError('La carpeta del proyecto fue eliminada o modificada. Restaurala en Drive antes de continuar.', 409);
      return id;
    }
    await this.json('/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name, mimeType: 'application/vnd.google-apps.folder', ...(parentId ? { parents: [parentId] } : {}) }) });
    return id;
  }
  async metadata(id) { return this.json(`/files/${encodeURIComponent(id)}?fields=${encodeURIComponent(FIELDS)}`); }
  async list(parentId, search = '', pageToken = '') {
    const q = [`'${escapeQuery(parentId)}' in parents`, 'trashed = false', "mimeType != 'application/vnd.google-apps.folder'", ...(search ? [`name contains '${escapeQuery(search)}'`] : [])].join(' and ');
    const params = new URLSearchParams({ q, pageSize: '50', fields: `nextPageToken,files(${FIELDS})`, orderBy: 'modifiedTime desc', ...(pageToken ? { pageToken } : {}) });
    return this.json(`/files?${params}`);
  }
  async upload(id, parentId, name, mimeType, bytes, stream) {
    const init = await this.request('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=' + encodeURIComponent(FIELDS), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': mimeType, 'X-Upload-Content-Length': String(bytes) },
      body: JSON.stringify({ id, name, parents: [parentId] })
    });
    const location = init.headers.get('location');
    if (!location || new URL(location).origin !== 'https://www.googleapis.com') throw new StorageError('Drive no pudo iniciar la carga.');
    const response = await this.request(location, { method: 'PUT', headers: { 'Content-Type': mimeType, 'Content-Length': String(bytes) }, body: Readable.toWeb(stream), duplex: 'half' }, false);
    return response.json();
  }
  async copy(id, parentId) {
    return this.json(`/files/${encodeURIComponent(id)}/copy?fields=${encodeURIComponent(FIELDS)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parents: [parentId] }) });
  }
  async content(id, exportMimeType) {
    return this.request(`${API}/files/${encodeURIComponent(id)}${exportMimeType ? '/export?mimeType=' + encodeURIComponent(exportMimeType) : '?alt=media'}`);
  }
  async thumbnail(id) {
    const file = await this.metadata(id);
    if (!file.thumbnailLink) throw new StorageError('Este archivo no tiene miniatura.', 404);
    const url = new URL(file.thumbnailLink);
    if (url.protocol !== 'https:' || !(url.hostname.endsWith('.googleusercontent.com') || url.hostname.endsWith('.google.com'))) throw new StorageError('La miniatura no está disponible.', 404);
    // Do not forward OAuth credentials to thumbnail hosts or redirects.
    const response = await this.fetcher(url, { redirect: 'error' });
    if (!response.ok) throw new StorageError('La miniatura no está disponible.', 404);
    return response;
  }
  async move(id, parentId) {
    const file = await this.metadata(id);
    return this.json(`/files/${encodeURIComponent(id)}?addParents=${encodeURIComponent(parentId)}&removeParents=${encodeURIComponent((file.parents || []).join(','))}&fields=${encodeURIComponent(FIELDS)}`, { method: 'PATCH' });
  }
}
