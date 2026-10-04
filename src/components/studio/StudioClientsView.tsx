import React, { useState } from 'react';
import { ProjectData, ClientEntity } from '../../types';
import { getAllClients, saveAllClients } from '../../services/storageService';
import {
  Users2,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Plus,
  FolderKanban,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface StudioClientsViewProps {
  projects: ProjectData[];
  onSelectProject: (projectId: string) => void;
  onToast: (msg: string) => void;
}

export default function StudioClientsView({
  projects,
  onSelectProject,
  onToast
}: StudioClientsViewProps) {
  const [clients, setClients] = useState<ClientEntity[]>(() => getAllClients());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Projects associated with the selected client
  const clientProjects = selectedClient
    ? projects.filter(p => selectedClient.proyectosIds.includes(p.id) || p.cliente?.nombre === selectedClient.nombre)
    : [];

  return (
    <div className="max-w-bojana-shell mx-auto space-y-bojana-block py-2 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bojana-heading-page text-2xl font-medium text-bojana-ink font-sans tracking-normal">
            Clientes
          </h1>
          <p className="text-xs text-bojana-muted mt-0.5">
            Relación de comitentes y empresas con proyectos en Bojana Estudio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-bojana-block">

        {/* Left: Clients List */}
        <div className="md:col-span-6 space-y-3">
          {clients.map((client) => {
            const isSelected = selectedClientId === client.id;
            const projectCount = projects.filter(
              p => client.proyectosIds.includes(p.id) || p.cliente?.nombre === client.nombre
            ).length;

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`bojana-widget p-5 rounded-bojana-widget border transition cursor-pointer flex items-center justify-between gap-bojana-block ${
                  isSelected
                    ? "bg-bojana-surface border-bojana-line ring-2 ring-bojana-focus/10 shadow-bojana-widget"
                    : "bg-bojana-surface border-bojana-line hover:border-bojana-line shadow-bojana-widget"
                }`}
              >
                <div className="space-y-bojana-inside">
                  <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">
                    {client.nombre}
                  </h3>
                  <p className="text-xs text-bojana-muted font-sans">
                    {client.empresa} {client.contactoPrincipal ? `• ${client.contactoPrincipal}` : ''}
                  </p>
                  <span className="text-xs font-sans text-bojana-muted block pt-1">
                    {projectCount} {projectCount === 1 ? 'proyecto activo' : 'proyectos asociados'}
                  </span>
                </div>

                <ChevronRight className={`w-4 h-4 transition ${isSelected ? "text-bojana-ink translate-x-1" : "text-bojana-line"}`} />
              </div>
            );
          })}
        </div>

        {/* Right: Client Details & Projects Card */}
        <div className="md:col-span-6">
          {selectedClient ? (
            <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget space-y-bojana-block animate-fade-in">
              <div className="flex items-start justify-between border-b border-bojana-line pb-4">
                <div>
                  <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium block">
                    Ficha de Comitente
                  </span>
                  <h3 className="bojana-heading-component text-xl font-medium text-bojana-ink font-sans mt-0.5">
                    {selectedClient.nombre}
                  </h3>
                  <p className="text-xs text-bojana-muted font-sans">
                    {selectedClient.empresa}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClientId(null)}
                  className="bojana-icon-button text-bojana-muted hover:text-bojana-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-bojana-inside text-xs font-sans">
                <span className="text-xs uppercase text-bojana-muted font-medium block">
                  Información de Contacto
                </span>
                <div className="bojana-widget bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line space-y-bojana-inside">
                  <div className="flex items-center gap-bojana-inside text-bojana-ink">
                    <Mail className="w-3.5 h-3.5 text-bojana-muted" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-bojana-inside text-bojana-ink">
                    <Phone className="w-3.5 h-3.5 text-bojana-muted" />
                    <span>{selectedClient.telefono}</span>
                  </div>
                  {selectedClient.contactoPrincipal && (
                    <div className="flex items-center gap-bojana-inside text-bojana-ink pt-0.5">
                      <Users2 className="w-3.5 h-3.5 text-bojana-muted" />
                      <span>Contacto: <strong>{selectedClient.contactoPrincipal}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects List for this client */}
              <div className="space-y-bojana-inside pt-2">
                <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-ink block">
                  Proyectos ({clientProjects.length})
                </span>

                <div className="space-y-bojana-inside">
                  {clientProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onSelectProject(proj.id)}
                      className="bojana-widget p-3.5 bg-bojana-surface hover:bg-bojana-soft border border-bojana-line rounded-bojana-widget flex items-center justify-between gap-3 cursor-pointer transition group"
                    >
                      <div>
                        <h4 className="bojana-heading-component text-xs font-medium text-bojana-ink font-sans group-hover:text-bojana-success transition">
                          {proj.info?.nombre || proj.brief?.nombre}
                        </h4>
                        <span className="text-xs font-sans text-bojana-muted">
                          {proj.disciplinas?.join(' · ') || 'Arquitectura'} &bull; {proj.info?.estadoGeneral || 'En ejecución'}
                        </span>
                      </div>

                      <span className="text-xs font-sans text-bojana-ink font-medium flex items-center gap-bojana-inside group-hover:translate-x-0.5 transition">
                        <span>Abrir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}

                  {/* Fallback mockup extra historical projects for Grupo ABC as mentioned in prompt */}
                  {selectedClient.id === 'cli-grupo-abc' && (
                    <>
                      <div className="bojana-widget p-3.5 bg-bojana-surface/60 border border-bojana-line rounded-bojana-widget flex items-center justify-between text-xs text-bojana-muted font-sans">
                        <div>
                          <strong className="text-bojana-ink block font-sans">Oficinas Palermo</strong>
                          <span className="text-xs">Layout corporativo &bull; Finalizado (2025)</span>
                        </div>
                        <span className="text-xs bg-bojana-soft px-2 py-0.5 rounded-bojana-badge font-medium">Archivado</span>
                      </div>
                      <div className="bojana-widget p-3.5 bg-bojana-surface/60 border border-bojana-line rounded-bojana-widget flex items-center justify-between text-xs text-bojana-muted font-sans">
                        <div>
                          <strong className="text-bojana-ink block font-sans">Local Córdoba</strong>
                          <span className="text-xs">Retail comercial &bull; Finalizado (2024)</span>
                        </div>
                        <span className="text-xs bg-bojana-soft px-2 py-0.5 rounded-bojana-badge font-medium">Archivado</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bojana-widget bg-bojana-surface border border-dashed border-bojana-line rounded-bojana-widget p-10 text-center text-xs text-bojana-muted font-sans flex flex-col items-center justify-center h-64 space-y-bojana-inside">
              <Users2 className="w-8 h-8 text-bojana-line" />
              <span>Seleccione un cliente de la lista para ver sus datos de contacto y obras vinculadas.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
