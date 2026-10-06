import type { EstadoEtapa, ProjectLifecycleStatus, DecisionStatus } from '../types';

const studioLabels: Record<EstadoEtapa, string> = {
  Pendiente: 'No iniciada',
  'En curso': 'En curso',
  'En revisión': 'En revisión',
  'Esperando al cliente': 'Esperando cliente',
  'Requiere ajustes': 'En revisión',
  Completado: 'Completada',
  Pausada: 'Pausada',
  'Fuera de alcance': 'Fuera de alcance'
};

const clientLabels: Record<EstadoEtapa, string> = {
  Pendiente: 'Próximamente',
  'En curso': 'En desarrollo',
  'En revisión': 'En revisión interna',
  'Esperando al cliente': 'Requiere tu acción',
  'Requiere ajustes': 'En revisión',
  Completado: 'Completado',
  Pausada: 'En pausa',
  'Fuera de alcance': 'No se muestra'
};

export function taskStateLabel(state: EstadoEtapa, audience: 'studio' | 'client' = 'studio'): string {
  return (audience === 'client' ? clientLabels : studioLabels)[state] || state;
}

export function taskStateBadgeClasses(state: EstadoEtapa, audience: 'studio' | 'client' = 'studio'): string {
  switch (state) {
    case 'Completado':
      return 'bg-forest text-white border-transparent';
    case 'En curso':
      return 'bg-mint-pale text-forest border-mint/40';
    case 'En revisión':
    case 'Requiere ajustes':
      return 'bg-sand/30 text-ink border-sand-strong/40';
    case 'Esperando al cliente':
      return 'bg-clay-pale text-clay-dark border-clay/40 font-semibold';
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
      return 'bg-mint-pale text-forest border-mint/40 font-semibold';
    case 'Requiere cambios':
      return 'bg-clay-pale text-clay-dark border-clay/40 font-semibold';
    case 'Pendiente':
    default:
      return 'bg-sand/30 text-ink border-sand-strong/40';
  }
}

export function lifecycleBadgeClasses(status: ProjectLifecycleStatus | undefined): string {
  switch (status) {
    case 'ACTIVO':
      return 'bg-mint-pale text-forest border-mint/40';
    case 'COMPLETADO':
      return 'bg-stone text-ink-muted border-line';
    case 'LISTO_PARA_COMPARTIR':
      return 'bg-sand/30 text-ink border-sand-strong/40';
    case 'BORRADOR':
    default:
      return 'bg-stone text-ink-faint border-line';
  }
}
