import type { DisciplinaType, ProjectData } from '../types';
export interface ProjectStorage {
  provider: 'google-drive';
  projectFolderId: string;
  disciplineFolderIds: Partial<Record<DisciplinaType, string>>;
}
export interface StoredDeliverable {
  id: string;
  projectId: string;
  discipline: DisciplinaType;
  needId: string;
  taskId: string;
  taskTitle?: string;
  needTitle?: string;
  provider: 'google-drive';
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  createdAt: string;
  version: number;
  published: boolean;
  url: string;
  thumbnailUrl?: string;
}
export interface StorageStatus {
  configured: boolean;
  authorized: boolean;
  connected: boolean;
  account?: string;
  picker?: { apiKey?: string; appId?: string };
  maxUploadBytes: number;
}
export class StorageApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}
export async function storageRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch('/api/storage' + path, { credentials: 'same-origin', ...init });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new StorageApiError('El servicio de archivos no está disponible. Configurá el servidor de Drive.', 503, 'not_configured');
  const data = await response.json();
  if (!response.ok) throw new StorageApiError(data.message || 'No pudimos completar la operación.', response.status, data.code);
  return data;
}
export const storageJson = <T,>(path: string, body: unknown) => storageRequest<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const getStorageStatus = () => storageRequest<StorageStatus>('/status');
export const prepareProjectStorage = (project: ProjectData) => storageJson<ProjectStorage>('/projects', { project });
export async function publishStorageProject(project: ProjectData): Promise<ProjectData> {
  if (!project.storage) return project;
  return (await storageJson<{ project: ProjectData }>(`/projects/${encodeURIComponent(project.id)}/publish`, { project })).project;
}
export const getDeliverables = (projectId: string) => storageRequest<{ files: StoredDeliverable[] }>(`/projects/${encodeURIComponent(projectId)}/deliverables`);
export const selectDriveFile = (project: ProjectData, taskId: string, discipline: DisciplinaType, fileId: string) => storageJson<StoredDeliverable>(`/projects/${encodeURIComponent(project.id)}/tasks/${encodeURIComponent(taskId)}/select`, { discipline, fileId });
export function uploadDriveFile(project: ProjectData, taskId: string, discipline: DisciplinaType, file: File, onProgress: (n: number) => void): Promise<StoredDeliverable> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ discipline, name: file.name, mimeType: file.type || 'application/octet-stream' });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/storage/projects/${encodeURIComponent(project.id)}/tasks/${encodeURIComponent(taskId)}/upload?${params}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onerror = () => reject(new Error('La carga se interrumpió. Revisá tu conexión y reintentá.'));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new StorageApiError(data.message || 'No se pudo cargar el archivo.', xhr.status, data.code));
      } catch { reject(new Error('El servicio de archivos no está disponible.')); }
    };
    xhr.send(file);
  });
}
let pickerScript: Promise<void> | undefined;
export async function openGooglePicker(status: StorageStatus): Promise<string | null> {
  if (!status.picker?.apiKey || !status.picker?.appId) throw new Error('El selector de Drive necesita su configuración en el servidor. Podés seleccionar los archivos de la carpeta del proyecto.');
  if (!pickerScript) pickerScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => (window as any).gapi.load('picker', { callback: resolve, onerror: () => reject(new Error('No se pudo abrir el selector de Google.')), timeout: 15000, ontimeout: () => reject(new Error('El selector de Google no respondió.')) });
    script.onerror = () => reject(new Error('No se pudo cargar el selector de Google.'));
    document.head.appendChild(script);
  }).catch(e => { pickerScript = undefined; throw e; });
  await pickerScript;
  const { accessToken } = await storageRequest<{ accessToken: string }>('/picker-token');
  return new Promise(resolve => {
    const picker = (window as any).google.picker;
    new picker.PickerBuilder().addView(picker.ViewId.DOCS).setOAuthToken(accessToken).setDeveloperKey(status.picker!.apiKey).setAppId(status.picker!.appId).setOrigin(window.location.origin).setCallback((data: any) => {
      if (data.action === picker.Action.PICKED) resolve(data.docs?.[0]?.id || null);
      if (data.action === picker.Action.CANCEL) resolve(null);
    }).build().setVisible(true);
  });
}
export function fileSize(bytes?: string) {
  const n = Number(bytes);
  if (!bytes || !Number.isFinite(n)) return 'Archivo de Google';
  return n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
}
