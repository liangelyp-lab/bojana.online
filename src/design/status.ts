import type { EstadoEtapa } from '../types';
const studio: Record<EstadoEtapa, string> = { Pendiente:'No iniciada', 'En curso':'En curso', 'En revisión':'En revisión', 'Esperando al cliente':'Esperando al cliente', 'Requiere ajustes':'En revisión', Completado:'Completada', Pausada:'Pausada', 'Fuera de alcance':'Fuera de alcance' };
const client: Record<EstadoEtapa, string> = { Pendiente:'Próximamente', 'En curso':'En desarrollo', 'En revisión':'En revisión', 'Esperando al cliente':'Esperando tu respuesta', 'Requiere ajustes':'En revisión', Completado:'Completado', Pausada:'En pausa', 'Fuera de alcance':'No se muestra' };
export function taskStateLabel(state: EstadoEtapa, audience: 'studio'|'client' = 'studio') { return (audience === 'client' ? client : studio)[state] || state; }
