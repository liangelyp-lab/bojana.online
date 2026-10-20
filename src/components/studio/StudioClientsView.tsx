import { useMemo, useState } from 'react';
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
import { SelectionCard, Card, Button, EmptyState, PageHeader } from '../ui/DesignSystem';

interface StudioClientsViewProps {
  projects: ProjectData[];
  onSelectProject: (projectId: string) => void;
}

export default function StudioClientsView({
  projects,
  onSelectProject
}: StudioClientsViewProps) {
  const clients = useMemo<ClientEntity[]>(() => {
    const directory = getAllClients().map(client => ({ ...client, proyectosIds: [...client.proyectosIds] }));
    for (const project of projects) {
      const source = project.cliente;
      const nombre = (source?.nombre || source?.empresa || '').trim();
      const email = (source?.email || '').trim().toLowerCase();
      if (!nombre && !email) continue;
      const index = directory.findIndex(client => client.proyectosIds.includes(project.id) || (email && client.email.toLowerCase() === email) || (!email && client.nombre.toLowerCase() === nombre.toLowerCase()));
      if (index >= 0) {
        if (!directory[index].proyectosIds.includes(project.id)) directory[index].proyectosIds.push(project.id);
        continue;
      }
      const contact = source?.personas?.find(person => person.nombre.trim());
      directory.push({ id: `cli-${project.id}`, nombre: nombre || 'Cliente', empresa: (source?.empresa || nombre).trim(), email, telefono: source?.telefono || '', proyectosIds: [project.id], contactoPrincipal: contact ? `${contact.nombre}${contact.cargo ? ` (${contact.cargo})` : ''}` : undefined });
    }
    return directory;
  }, [projects]);
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
      <PageHeader
        divider
        title="Clientes"
      />

      <div className="space-y-4">
        {/* The directory and the selected record share the same area. */}
        {!selectedClient && <div className="space-y-4">
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
              <SelectionCard key={client.id} selected={isSelected} onClick={() => setSelectedClientId(client.id)}>
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
              </SelectionCard>
            );
          })}
        </div>}

        {selectedClient && (
            <Card key={selectedClient.id} expandable elevation="raised" expandLabel={`ficha de ${selectedClient.nombre}`} header={<>
                  <span className="block text-xs font-bold uppercase tracking-widest text-ink-faint">
                    Ficha de comitente
                  </span>
                  <span className="block mt-1 font-display text-2xl sm:text-3xl font-normal text-ink">
                    {selectedClient.nombre}
                  </span>
                  <span className="block text-xs text-ink-muted mt-0.5">
                    {selectedClient.empresa}
                  </span>
</>} headerActions={<Button type="button" variant="icon" size="xs" onClick={() => setSelectedClientId(null)} ariaLabel="Cerrar ficha"><X /></Button>}>
              <div className="space-y-6">

              {/* Contact Info */}
              <div className="space-y-2 text-xs">
                <p className="font-bold uppercase tracking-widest text-ink-faint">
                  Información de contacto
                </p>
                <div className="rounded-bojana-widget border border-line bg-canvas/60 p-4 space-y-2.5">
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
                        className="group flex items-center justify-between gap-3 rounded-bojana-widget border border-line bg-canvas/40 p-4 transition hover:border-line-strong hover:bg-stone/50 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <strong className="text-sm font-semibold text-ink group-hover:text-forest transition">
                            {p.info?.nombre || p.brief?.nombre || 'Proyecto'}
                          </strong>
                          <div className="text-xs text-ink-muted">
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
            </Card>
        )}
      </div>
    </div>
  );
}
