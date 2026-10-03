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
    <div className="max-w-5xl mx-auto space-y-6 py-2 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-950 font-sans tracking-tight">
            Clientes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Relación de comitentes y empresas con proyectos en Bojana Estudio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
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
                className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected 
                    ? 'bg-white border-gray-950 ring-2 ring-gray-950/10 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                }`}
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-950 font-sans">
                    {client.nombre}
                  </h3>
                  <p className="text-xs text-gray-500 font-sans">
                    {client.empresa} {client.contactoPrincipal ? `• ${client.contactoPrincipal}` : ''}
                  </p>
                  <span className="text-[11px] font-mono text-gray-400 block pt-1">
                    {projectCount} {projectCount === 1 ? 'proyecto activo' : 'proyectos asociados'}
                  </span>
                </div>

                <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-gray-950 translate-x-1' : 'text-gray-300'}`} />
              </div>
            );
          })}
        </div>

        {/* Right: Client Details & Projects Card */}
        <div className="md:col-span-6">
          {selectedClient ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5 animate-fade-in">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">
                    Ficha de Comitente
                  </span>
                  <h3 className="text-xl font-bold text-gray-950 font-sans mt-0.5">
                    {selectedClient.nombre}
                  </h3>
                  <p className="text-xs text-gray-500 font-sans">
                    {selectedClient.empresa}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClientId(null)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-xs font-mono">
                <span className="text-[10px] uppercase text-gray-400 font-bold block">
                  Información de Contacto
                </span>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedClient.telefono}</span>
                  </div>
                  {selectedClient.contactoPrincipal && (
                    <div className="flex items-center gap-2 text-gray-700 pt-0.5">
                      <Users2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>Contacto: <strong>{selectedClient.contactoPrincipal}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects List for this client */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700 block">
                  Proyectos ({clientProjects.length})
                </span>

                <div className="space-y-2">
                  {clientProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onSelectProject(proj.id)}
                      className="p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition group"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-gray-950 font-sans group-hover:text-emerald-700 transition">
                          {proj.info?.nombre || proj.brief?.nombre}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500">
                          {proj.disciplinas?.join(' · ') || 'Arquitectura'} &bull; {proj.info?.estadoGeneral || 'En ejecución'}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-gray-900 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                        <span>Abrir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}

                  {/* Fallback mockup extra historical projects for Grupo ABC as mentioned in prompt */}
                  {selectedClient.id === 'cli-grupo-abc' && (
                    <>
                      <div className="p-3.5 bg-gray-50/60 border border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-500 font-mono">
                        <div>
                          <strong className="text-gray-700 block font-sans">Oficinas Palermo</strong>
                          <span className="text-[10px]">Layout corporativo &bull; Finalizado (2025)</span>
                        </div>
                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-bold">Archivado</span>
                      </div>
                      <div className="p-3.5 bg-gray-50/60 border border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-500 font-mono">
                        <div>
                          <strong className="text-gray-700 block font-sans">Local Córdoba</strong>
                          <span className="text-[10px]">Retail comercial &bull; Finalizado (2024)</span>
                        </div>
                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-bold">Archivado</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-xs text-gray-400 font-mono flex flex-col items-center justify-center h-64 space-y-2">
              <Users2 className="w-8 h-8 text-gray-300" />
              <span>Seleccione un cliente de la lista para ver sus datos de contacto y obras vinculadas.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
