import type { EstadoEtapa, DecisionStatus } from '../types';

export type StatusBadgeTone = 'neutral' | 'active' | 'warning' | 'waiting' | 'danger' | 'info' | 'gray' | 'white' | 'black';
export type ProjectStatusLabel = 'Borrador' | 'En progreso' | 'En revisión' | 'Requiere ajustes' | 'Requiere acción' | 'Completado';

export function projectProgressStatusLabel(progress: number, status: ProjectStatusLabel | string): string {
  return status === 'Completado' ? `${Math.round(progress)}% completado` : `${Math.round(progress)}% · ${status}`;
}

const studioLabels: Record<EstadoEtapa, string> = {
  Pendiente: 'No iniciada',
  'En curso': 'En curso',
  'En revisión': 'En revisión',
  'Esperando al cliente': 'Esperando cliente',
  'Requiere ajustes': 'Requiere ajustes',
  Completado: 'Completada',
  Pausada: 'Pausada',
  'Fuera de alcance': 'Fuera de alcance'
};

const clientLabels: Record<EstadoEtapa, string> = {
  Pendiente: 'Próximamente',
  'En curso': 'En desarrollo',
  'En revisión': 'En revisión interna',
  'Esperando al cliente': 'Requiere tu acción',
  'Requiere ajustes': 'Requiere ajustes',
  Completado: 'Completado',
  Pausada: 'En pausa',
  'Fuera de alcance': 'No se muestra'
};

export function taskStateLabel(state: EstadoEtapa, audience: 'studio' | 'client' = 'studio'): string {
  return (audience === 'client' ? clientLabels : studioLabels)[state] || state;
}

/** One semantic color rule for task statuses across portal and studio surfaces. */
export function taskStatusTone(status: string): StatusBadgeTone {
  switch (status) {
    case 'Completado':
    case 'Completada':
    case 'Aprobado':
    case 'Aprobada':
      return 'active';
    case 'En curso':
    case 'En desarrollo':
      return 'info';
    case 'En revisión':
    case 'En revision':
    case 'En revisión interna':
      return 'neutral';
    case 'Esperando al cliente':
    case 'Esperando cliente':
    case 'Requiere tu acción':
      return 'waiting';
    case 'Requiere ajustes':
    case 'Cambios solicitados':
      return 'warning';
    case 'Pendiente':
    case 'No iniciada':
    case 'Próximamente':
    case 'Pausada':
    case 'En pausa':
    case 'Fuera de alcance':
    case 'No se muestra':
    case 'Borrador':
    case 'Revocada':
    case 'Cerrado':
    case 'Cerrada':
      return 'gray';
    default:
      return 'gray';
  }
}

export function projectStatusTone(status: ProjectStatusLabel | string): StatusBadgeTone {
  switch (status) {
    case 'En progreso': return 'info';
    case 'En revisión': return 'neutral';
    case 'Requiere ajustes': return 'warning';
    case 'Requiere acción': return 'waiting';
    case 'Completado': return 'active';
    case 'Borrador':
    default: return 'gray';
  }
}

export function updateStatusTone(status: string, action: string): StatusBadgeTone {
  if (status === 'cambios_solicitados') return 'warning';
  if (status === 'aprobada') return 'active';
  if (status === 'borrador' || action === 'borrador') return 'gray';
  if (action === 'revision') return 'neutral';
  if (action === 'solicitud_informacion') return 'waiting';
  return 'active';
}

export function decisionStatusTone(status: DecisionStatus): StatusBadgeTone {
  if (status === 'Aprobado') return 'active';
  if (status === 'Requiere cambios') return 'warning';
  return 'waiting';
}

export function taskStateBadgeClasses(state: EstadoEtapa, _audience: 'studio' | 'client' = 'studio'): string {
  switch (state) {
    case 'Completado':
      return 'bg-mint-pale text-mint-strong border-mint/40';
    case 'En curso':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'En revisión':
      return 'bg-stone text-ink border-line-strong';
    case 'Requiere ajustes':
      return 'bg-warning-pale text-warning-strong border-warning/40';
    case 'Esperando al cliente':
      return 'bg-clay-pale text-clay-dark border-clay/40';
    case 'Pausada':
    case 'Fuera de alcance':
      return 'bg-stone text-ink-faint border-line';
    case 'Pendiente':
    default:
      return 'bg-stone text-ink-muted border-line';
  }
}

export function decisionStateBadgeClasses(status: DecisionStatus): string {
  switch (status) {
    case 'Aprobado':
      return 'bg-mint-pale text-mint-strong border-mint/40';
    case 'Requiere cambios':
      return 'bg-warning-pale text-warning-strong border-warning/40';
    case 'Pendiente':
    default:
      return 'bg-clay-pale text-clay-dark border-clay/40';
  }
}
