import { useState } from 'react';
import { ProjectData, ClientEntity } from '../../types';
import { getAllClients } from '../../services/storageService';
import {
  Users2,
  Mail,
  Phone,
  ArrowRight,
  X,
  ChevronRight
} from 'lucide-react';
import { EmptyState } from '../ui/DesignSystem';

interface StudioClientsViewProps {
  projects: ProjectData[];
  onSelectProject: (projectId: string) => void;
}

export default function StudioClientsView({
  projects,
  onSelectProject
}: StudioClientsViewProps) {
  const [clients] = useState<ClientEntity[]>(() => getAllClients());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Projects associated with the selected client
  const clientProjects = selectedClient
    ? projects.filter(
        (p) =>
          selectedClient.proyectosIds.includes(p.id) ||
          p.cliente?.nombre === selectedClient.nombre
      )
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-line pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
          Directorio de comitentes
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-normal text-ink md:text-5xl">
          Clientes
        </h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Relación de comitentes, empresas y promotores con proyectos activos en Bojana Estudio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Clients List (Column 1 of 2) */}
        <div className="space-y-4">
          {clients.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="Todavía no hay clientes"
              description="Los clientes aparecerán aquí cuando estén asociados a un proyecto del estudio."
            />
          ) : clients.map((client) => {
            const isSelected = selectedClientId === client.id;
            const projectCount = projects.filter(
              (p) =>
                client.proyectosIds.includes(p.id) ||
                p.cliente?.nombre === client.nombre
            ).length;

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`flex items-center justify-between gap-4 rounded-3xl border p-6 transition cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-forest bg-mint-pale/30 ring-2 ring-forest/20'
                    : 'border-line bg-white hover:border-line-strong hover:shadow-md'
                }`}
              >
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-normal text-ink">
                    {client.nombre}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    {client.empresa} {client.contactoPrincipal ? `• ${client.contactoPrincipal}` : ''}
                  </p>
                  <span className="inline-block pt-1 text-xs font-semibold text-ink-faint">
                    {projectCount} {projectCount === 1 ? 'proyecto activo' : 'proyectos asociados'}
                  </span>
                </div>

                <div className={`grid size-9 place-items-center rounded-full transition ${
                  isSelected ? 'bg-forest text-white' : 'bg-stone text-ink-muted'
                }`}>
                  <ChevronRight className="size-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Client Details & Projects Card (Column 2 of 2) */}
        <div>
          {selectedClient ? (
            <div className="rounded-3xl border border-line bg-white p-7 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-start justify-between border-b border-line pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
                    Ficha de comitente
                  </p>
                  <h3 className="mt-1 font-display text-2xl sm:text-3xl font-normal text-ink">
                    {selectedClient.nombre}
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {selectedClient.empresa}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClientId(null)}
                  className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-stone hover:text-ink transition cursor-pointer active:scale-95"
                  aria-label="Cerrar ficha"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-xs">
                <p className="font-bold uppercase tracking-widest text-ink-faint">
                  Información de contacto
                </p>
                <div className="rounded-2xl border border-line bg-canvas/60 p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-ink font-medium">
                    <Mail className="size-4 text-ink-faint shrink-0" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-ink font-medium">
                    <Phone className="size-4 text-ink-faint shrink-0" />
                    <span>{selectedClient.telefono}</span>
                  </div>
                  {selectedClient.contactoPrincipal && (
                    <div className="flex items-center gap-2.5 text-ink font-medium pt-1 border-t border-line/60">
                      <Users2 className="size-4 text-ink-faint shrink-0" />
                      <span>Contacto: <strong className="font-semibold text-ink">{selectedClient.contactoPrincipal}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects of this Client */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
                  Obras y proyectos asociados ({clientProjects.length})
                </p>

                {clientProjects.length === 0 ? (
                  <p className="text-xs text-ink-muted italic">
                    No hay proyectos registrados para este comitente.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {clientProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectProject(p.id)}
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/40 p-4 transition hover:border-line-strong hover:bg-stone/50 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <strong className="text-sm font-semibold text-ink group-hover:text-forest transition">
                            {p.info?.nombre || p.brief?.nombre || 'Proyecto'}
                          </strong>
                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <span>{p.info?.ubicacion || 'Ubicación'}</span>
                            <span>&bull;</span>
                            <span className="font-medium text-forest">{p.info?.estadoGeneral || 'En ejecución'}</span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest transition group-hover:translate-x-1">
                          <span>Ver</span>
                          <ArrowRight className="size-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-white/50 p-12 text-center text-xs text-ink-muted space-y-2">
              <Users2 className="size-8 mx-auto text-ink-faint opacity-60 mb-2" />
              <p className="font-medium text-ink">Selecciona un comitente</p>
              <p className="text-ink-muted max-w-xs mx-auto">
                Haz clic en cualquier cliente de la lista para ver su información de contacto y obras asociadas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
