import React, { useState } from 'react';
import {
  ProjectData,
  DisciplinaType,
  TeamMember,
  PortalModuleId,
  PortalModuleConfig
} from '../types';
import { SYSTEM_MODULES, getRecommendedModulesForDisciplines } from '../services/storageService';
import {
  X,
  Building2,
  Users,
  KeyRound,
  Layers,
  Sliders,
  Check,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Globe,
  Info,
  Calendar,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface ProjectConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onSaveProject: (updated: ProjectData) => void;
  onToast: (msg: string) => void;
}

export default function ProjectConfigModal({
  isOpen,
  onClose,
  project,
  onSaveProject,
  onToast
}: ProjectConfigModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'disciplinas' | 'equipo' | 'cliente' | 'modulos'>('info');
  const [copiedLink, setCopiedLink] = useState(false);

  // Local draft
  const [draft, setDraft] = useState<ProjectData>(() => JSON.parse(JSON.stringify(project)));

  // Team form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRol, setNewMemberRol] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const dedicatedUrl = `${window.location.origin}${window.location.pathname}?portal=${draft.cliente.dedicatedToken || 'portal-direct'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dedicatedUrl);
    setCopiedLink(true);
    onToast('Enlace directo del portal copiado al portapapeles.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Toggle discipline and suggest recommended modules
  const toggleDiscipline = (disc: DisciplinaType) => {
    const current = draft.disciplinas || [];
    const exists = current.includes(disc);
    const updated = exists ? current.filter(d => d !== disc) : [...current, disc];
    setDraft({ ...draft, disciplinas: updated });
  };

  // Apply discipline recommendations to modules
  const handleApplyDisciplineRecommendations = () => {
    const recommended = getRecommendedModulesForDisciplines(draft.disciplinas || []);
    setDraft({ ...draft, modulos: recommended });
    onToast('Módulos recomendados aplicados según las disciplinas seleccionadas.');
  };

  // Toggle portal module
  const toggleModule = (modId: PortalModuleId) => {
    if (modId === 'resumen') {
      onToast('La introducción del proyecto es parte fija de la historia editorial del cliente.');
      return;
    }
    const updated = draft.modulos.map(m => m.id === modId ? { ...m, habilitado: !m.habilitado } : m);
    setDraft({ ...draft, modulos: updated });
  };

  // Add team member
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: TeamMember = {
      id: `eq-${Date.now()}`,
      nombre: newMemberName.trim(),
      rol: newMemberRol.trim() || 'Coordinación Técnica',
      email: newMemberEmail.trim()
    };

    setDraft({
      ...draft,
      equipo: [...(draft.equipo || []), newMember]
    });

    setNewMemberName('');
    setNewMemberRol('');
    setNewMemberEmail('');
    onToast(`Integrante "${newMember.nombre}" agregado al equipo.`);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setDraft({
      ...draft,
      equipo: (draft.equipo || []).filter(m => m.id !== memberId)
    });
  };

  // Save changes
  const handleSave = () => {
    // Sync info with brief & plazo for backwards compatibility
    const updated: ProjectData = {
      ...draft,
      brief: {
        ...(draft.brief || {}),
        nombre: draft.info.nombre,
        subtitulo: draft.info.subtitulo,
        descripcion: draft.info.descripcion,
        ubicacion: draft.info.ubicacion,
        superficie: draft.info.superficie,
        estadoGeneral: draft.info.estadoGeneral
      },
      plazo: {
        ...(draft.plazo || {}),
        fechaInicio: draft.info.fechaInicio,
        fechaFin: draft.info.fechaFin,
        proximaEntregaOHito: draft.info.proximoHito
      },
      tipoProyecto: draft.disciplinas?.join(' & ') || 'Arquitectura & Obras'
    };

    onSaveProject(updated);
    onToast('Configuración del proyecto guardada.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in">
      <div className="bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full max-h-[92vh] flex flex-col shadow-bojana-widget overflow-hidden animate-scale-up">

        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-bojana-line flex items-center justify-between bg-bojana-surface/70">
          <div className="flex items-center gap-bojana-inside">
            <div className="w-8 h-8 rounded-bojana-widget bg-bojana-ink text-bojana-inverse flex items-center justify-center font-medium text-xs font-sans">
              BE
            </div>
            <div>
              <div className="flex items-center gap-bojana-inside">
                <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans tracking-normal">
                  Configuración del Proyecto
                </h3>
                <span className="text-xs font-sans text-bojana-muted uppercase bg-bojana-soft px-2 py-0.5 rounded-bojana-badge font-medium">
                  Bojana Estudio
                </span>
              </div>
              <p className="text-xs text-bojana-muted">
                {draft.info.nombre} &bull; Ajustes de metadata, accesos del comitente y módulos activos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bojana-icon-button p-1.5 rounded-bojana-widget text-bojana-muted hover:text-bojana-ink hover:bg-bojana-soft transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS (LO QUE NO SON MÓDULOS) */}
        <div className="px-6 border-b border-bojana-line bg-bojana-surface flex items-center gap-bojana-inside overflow-x-auto scrollbar-none py-2 text-xs font-sans font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`bojana-button bojana-button-primary px-3 py-2 rounded-bojana-widget transition flex items-center gap-bojana-inside cursor-pointer whitespace-nowrap ${
              activeTab === "info"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:bg-bojana-soft"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Información General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disciplinas')}
            className={`bojana-button bojana-button-primary px-3 py-2 rounded-bojana-widget transition flex items-center gap-bojana-inside cursor-pointer whitespace-nowrap ${
              activeTab === "disciplinas"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:bg-bojana-soft"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-bojana-ink" />
            <span>Disciplinas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipo')}
            className={`bojana-button bojana-button-primary px-3 py-2 rounded-bojana-widget transition flex items-center gap-bojana-inside cursor-pointer whitespace-nowrap ${
              activeTab === "equipo"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:bg-bojana-soft"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo del Estudio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cliente')}
            className={`bojana-button bojana-button-primary px-3 py-2 rounded-bojana-widget transition flex items-center gap-bojana-inside cursor-pointer whitespace-nowrap ${
              activeTab === "cliente"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:bg-bojana-soft"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cliente y Accesos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modulos')}
            className={`bojana-button bojana-button-primary px-3 py-2 rounded-bojana-widget transition flex items-center gap-bojana-inside cursor-pointer whitespace-nowrap ${
              activeTab === "modulos"
                ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                : "text-bojana-muted hover:bg-bojana-soft"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-bojana-success" />
            <span>Módulos del Portal ({draft.modulos.filter(m => m.habilitado).length})</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-bojana-block text-xs font-sans">

          {/* TAB 1: INFORMACIÓN GENERAL */}
          {activeTab === 'info' && (
            <div className="space-y-bojana-block animate-fade-in max-w-2xl">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={draft.info.nombre}
                  onChange={(e) => setDraft({ ...draft, info: { ...draft.info, nombre: e.target.value } })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-medium focus:bg-bojana-surface"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Subtítulo / Tipo de Intervención</label>
                <input
                  type="text"
                  value={draft.info.subtitulo}
                  onChange={(e) => setDraft({ ...draft, info: { ...draft.info, subtitulo: e.target.value } })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Descripción del Alcance</label>
                <textarea
                  rows={2}
                  value={draft.info.descripcion}
                  onChange={(e) => setDraft({ ...draft, info: { ...draft.info, descripcion: e.target.value } })}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={draft.info.ubicacion}
                    onChange={(e) => setDraft({ ...draft, info: { ...draft.info, ubicacion: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Superficie</label>
                  <input
                    type="text"
                    value={draft.info.superficie}
                    onChange={(e) => setDraft({ ...draft, info: { ...draft.info, superficie: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Estado General</label>
                  <select
                    value={draft.info.estadoGeneral}
                    onChange={(e) => setDraft({ ...draft, info: { ...draft.info, estadoGeneral: e.target.value as any } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  >
                    <option value="En Planificación">En Planificación</option>
                    <option value="En Ejecución">En Ejecución</option>
                    <option value="En Revisión">En Revisión</option>
                    <option value="En Licitación">En Licitación</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Etapa Actual (para Dashboard)</label>
                  <input
                    type="text"
                    value={draft.info.etapaActual}
                    onChange={(e) => setDraft({ ...draft, info: { ...draft.info, etapaActual: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Próximo Hito de Obra</label>
                  <input
                    type="text"
                    value={draft.info.proximoHito}
                    onChange={(e) => setDraft({ ...draft, info: { ...draft.info, proximoHito: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Última Actualización</label>
                  <input
                    type="text"
                    value={draft.info.ultimaActualizacion}
                    onChange={(e) => setDraft({ ...draft, info: { ...draft.info, ultimaActualizacion: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              {/* Publicar / Despublicar */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 flex items-center justify-between">
                <div>
                  <h4 className="bojana-heading-component font-medium text-bojana-ink">Estado de Publicación del Portal</h4>
                  <p className="text-xs text-bojana-muted mt-0.5">
                    Si está despublicado, el comitente verá un aviso de mantenimiento o acceso restringido.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, info: { ...draft.info, publicado: !draft.info.publicado } })}
                  className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget text-xs font-sans font-medium transition cursor-pointer ${
                    draft.info.publicado ? "bg-bojana-success text-bojana-inverse" : "bg-bojana-soft text-bojana-ink"
                  }`}
                >
                  {draft.info.publicado ? 'Publicado' : 'Borrador'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DISCIPLINAS (METADATA) */}
          {activeTab === 'disciplinas' && (
            <div className="space-y-bojana-block animate-fade-in max-w-2xl">
              <div>
                <h4 className="bojana-heading-component font-medium text-sm text-bojana-ink font-sans">
                  Disciplinas que Integran este Proyecto
                </h4>
                <p className="text-xs text-bojana-muted mt-0.5">
                  Las disciplinas definen la metadata y disparan sugerencias automáticas de módulos para el portal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['Arquitectura', 'Ingeniería', 'Construcción', 'Diseño'] as DisciplinaType[]).map((disc) => {
                  const isChecked = (draft.disciplinas || []).includes(disc);

                  return (
                    <div
                      key={disc}
                      onClick={() => toggleDiscipline(disc)}
                      className={`bojana-widget p-4 rounded-bojana-widget border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "border-bojana-line bg-bojana-surface/80 shadow-bojana-widget"
                          : "border-bojana-line hover:border-bojana-line bg-bojana-surface"
                      }`}
                    >
                      <div>
                        <h5 className="bojana-heading-component font-medium text-bojana-ink">{disc}</h5>
                        <span className="text-xs font-sans text-bojana-muted block mt-0.5">
                          {disc === 'Arquitectura' && 'Resumen, Progreso, Planos, Renders, Decisiones'}
                          {disc === 'Ingeniería' && 'Resumen, Documentos técnicos, Revisiones'}
                          {disc === 'Construcción' && 'Resumen, Progreso, Avances fotográficos'}
                          {disc === 'Diseño' && 'Visualizaciones, Materiales & Propuestas'}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-bojana-widget border flex items-center justify-center transition ${
                        isChecked ? "bg-bojana-ink text-bojana-inverse border-bojana-line" : "border-bojana-line"
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation Callout */}
              <div className="bojana-widget bg-bojana-soft/80 border border-bojana-success rounded-bojana-widget p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="bojana-heading-component font-medium text-bojana-success text-xs flex items-center gap-bojana-inside">
                    <Sparkles className="w-4 h-4 text-bojana-success" />
                    <span>Matriz de Recomendaciones Automáticas</span>
                  </h5>
                  <p className="text-xs text-bojana-success/80 mt-0.5">
                    Reconfigurar los módulos del portal recomendados para: <strong>{draft.disciplinas.join(', ')}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyDisciplineRecommendations}
                  className="bojana-button bojana-button-primary px-3.5 py-1.5 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-sans font-medium transition cursor-pointer whitespace-nowrap"
                >
                  Aplicar Módulos Recomendados
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EQUIPO DE BOJANA ESTUDIO */}
          {activeTab === 'equipo' && (
            <div className="space-y-bojana-block animate-fade-in max-w-2xl">
              <div>
                <h4 className="bojana-heading-component font-medium text-sm text-bojana-ink font-sans">
                  Integrantes del Equipo Asignados al Proyecto
                </h4>
                <p className="text-xs text-bojana-muted mt-0.5">
                  Aparecen en el dashboard del cliente como responsables técnicos de contacto directo.
                </p>
              </div>

              {/* Members List */}
              <div className="space-y-bojana-inside">
                {(draft.equipo || []).map((m) => (
                  <div key={m.id} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-bojana-ink block font-medium">{m.nombre}</strong>
                      <span className="text-xs text-bojana-muted font-sans">{m.rol}</span>
                      {m.email && <span className="text-xs text-bojana-muted font-sans block">{m.email}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTeamMember(m.id)}
                      className="bojana-icon-button p-1 rounded-bojana-widget text-bojana-muted hover:text-bojana-error transition"
                      title="Quitar integrante"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddTeamMember} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-3">
                <span className="text-xs font-sans font-medium uppercase text-bojana-ink block">
                  + Asignar Nuevo Integrante
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-bojana-inside">
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Rol (ej: D.O. / Interiores)..."
                    value={newMemberRol}
                    onChange={(e) => setNewMemberRol(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email de contacto..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bojana-button bojana-button-primary px-3.5 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium"
                  >
                    Agregar Integrante
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CLIENTE Y ACCESOS */}
          {activeTab === 'cliente' && (
            <div className="space-y-bojana-block animate-fade-in max-w-2xl">
              <div>
                <h4 className="bojana-heading-component font-medium text-sm text-bojana-ink font-sans">
                  Datos del Comitente & Credenciales de Acceso
                </h4>
                <p className="text-xs text-bojana-muted mt-0.5">
                  Configure los accesos protegidos o genere un enlace directo sin contraseña para WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={draft.cliente.nombre}
                    onChange={(e) => setDraft({ ...draft, cliente: { ...draft.cliente, nombre: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Empresa / Razón Social</label>
                  <input
                    type="text"
                    value={draft.cliente.empresa}
                    onChange={(e) => setDraft({ ...draft, cliente: { ...draft.cliente, empresa: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Usuario de Acceso</label>
                  <input
                    type="text"
                    value={draft.cliente.usuario}
                    onChange={(e) => setDraft({ ...draft, cliente: { ...draft.cliente, usuario: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Contraseña</label>
                  <input
                    type="text"
                    value={draft.cliente.password || 'bojana2026'}
                    onChange={(e) => setDraft({ ...draft, cliente: { ...draft.cliente, password: e.target.value } })}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs font-sans"
                  />
                </div>
              </div>

              {/* Dedicated Direct Link Box */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="bojana-heading-component font-medium text-bojana-ink">Acceso Directo sin Contraseña</h5>
                    <p className="text-xs text-bojana-muted mt-0.5">
                      Permite al cliente ingresar directamente con un token seguro en la URL.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft({
                      ...draft,
                      cliente: { ...draft.cliente, linkSinProteccion: !draft.cliente.linkSinProteccion }
                    })}
                    className={`bojana-button bojana-button-primary px-3 py-1 rounded-bojana-widget text-xs font-sans font-medium transition cursor-pointer ${
                      draft.cliente.linkSinProteccion ? "bg-bojana-success text-bojana-inverse" : "bg-bojana-soft text-bojana-ink"
                    }`}
                  >
                    {draft.cliente.linkSinProteccion ? 'Habilitado' : 'Deshabilitado'}
                  </button>
                </div>

                {draft.cliente.linkSinProteccion && (
                  <div className="flex items-center gap-bojana-inside pt-1">
                    <input
                      type="text"
                      readOnly
                      value={dedicatedUrl}
                      className="bojana-field flex-1 bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 text-xs text-bojana-muted font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MÓDULOS DEL PORTAL (GESTIÓN MODULAR) */}
          {activeTab === 'modulos' && (
            <div className="space-y-bojana-block animate-fade-in max-w-2xl">
              <div>
                <h4 className="bojana-heading-component font-medium text-sm text-bojana-ink font-sans">
                  Gestión de Módulos del Portal
                </h4>
                <p className="text-xs text-bojana-muted mt-0.5">
                  El Resumen es obligatorio en todos los proyectos. Active o desactive cualquiera de los otros 6 módulos según la necesidad de Bojana Estudio.
                </p>
              </div>

              <div className="space-y-3">
                {draft.modulos.map((mod) => (
                  <div
                    key={mod.id}
                    className={`bojana-widget p-4 rounded-bojana-widget border transition flex items-center justify-between gap-bojana-block ${
                      mod.habilitado ? "bg-bojana-surface border-bojana-line shadow-bojana-widget" : "bg-bojana-surface border-bojana-line opacity-60"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-bojana-inside">
                        <strong className="text-sm font-medium text-bojana-ink font-sans">{mod.titulo}</strong>
                        {mod.esObligatorio && (
                          <span className="text-xs font-sans text-bojana-success bg-bojana-soft px-1.5 py-0.2 rounded-bojana-badge font-medium">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-bojana-muted">{mod.descripcion}</p>
                    </div>

                    <button
                      type="button"
                      disabled={mod.esObligatorio}
                      onClick={() => toggleModule(mod.id)}
                      className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget text-xs font-sans font-medium transition cursor-pointer shrink-0 ${
                        mod.habilitado
                          ? "bg-bojana-success text-bojana-inverse"
                          : "bg-bojana-soft text-bojana-ink hover:bg-bojana-soft"
                      }  ${mod.esObligatorio ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {mod.habilitado ? 'Activo' : '+ Habilitar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-bojana-line flex items-center justify-between bg-bojana-surface/70">
          <button
            type="button"
            onClick={onClose}
            className="bojana-button bojana-button-secondary px-4 py-2 rounded-bojana-widget border border-bojana-line text-bojana-ink text-xs font-sans font-medium hover:bg-bojana-soft transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bojana-button bojana-button-primary px-5 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium transition shadow-bojana-widget"
          >
            Guardar Configuración
          </button>
        </div>

      </div>
    </div>
  );
}
