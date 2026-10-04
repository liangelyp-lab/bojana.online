import React from 'react';
import {
  ProjectData,
  PortalModuleId
} from '../../types';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Users,
  Camera,
  FileText,
  Layers,
  CheckSquare,
  Palette,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ResumenModuleProps {
  project: ProjectData;
  isAdmin: boolean;
  onNavigateToModule: (moduleId: PortalModuleId) => void;
  onOpenConfig?: () => void;
}

export default function ResumenModule({
  project,
  isAdmin,
  onNavigateToModule,
  onOpenConfig
}: ResumenModuleProps) {
  const info = project.info || {
    nombre: project.brief?.nombre || 'Proyecto Sin Nombre',
    subtitulo: project.brief?.subtitulo || 'Estudio de Arquitectura',
    descripcion: project.brief?.descripcion || '',
    ubicacion: project.brief?.ubicacion || 'Buenos Aires',
    superficie: project.brief?.superficie || '0 m²',
    estadoGeneral: project.brief?.estadoGeneral || 'En Ejecución',
    etapaActual: 'Documentación ejecutiva',
    proximoHito: 'Inicio de obra · 18 octubre',
    ultimaActualizacion: '02 OCT 2026',
    fechaInicio: '15/08/2026',
    fechaFin: '20/12/2026',
    publicado: true
  };

  const activeModules = project.modulos.filter(m => m.habilitado && m.id !== 'resumen');

  // Pending decisions count for alert banner
  const pendingDecisions = (project.decisiones || []).filter(d => d.estado === 'Pendiente');
  const latestAvance = (project.avances || [])[0];
  const totalDocs = (project.documentos || []).length;
  const totalRenders = (project.visualizaciones?.galeria || []).length;
  const totalTours = (project.visualizaciones?.tours || []).length;
  const totalMateriales = (project.materiales || []).length;

  const getModuleIcon = (id: PortalModuleId) => {
    switch (id) {
      case 'progreso': return <Clock className="w-5 h-5 text-bojana-success" />;
      case 'avances': return <Camera className="w-5 h-5 text-sky-600" />;
      case 'documentos': return <FileText className="w-5 h-5 text-bojana-ink" />;
      case 'visualizaciones': return <Layers className="w-5 h-5 text-bojana-discipline" />;
      case 'decisiones': return <CheckSquare className="w-5 h-5 text-bojana-error" />;
      case 'materiales': return <Palette className="w-5 h-5 text-bojana-success" />;
      default: return <Building2 className="w-5 h-5 text-bojana-muted" />;
    }
  };

  const getModuleMetric = (id: PortalModuleId) => {
    switch (id) {
      case 'progreso':
        const completed = (project.progreso || []).filter(p => p.estado === 'Completado').length;
        const total = (project.progreso || []).length;
        return `${completed} de ${total} etapas e hitos completados`;
      case 'avances':
        return `${(project.avances || []).length} reportes fotográficos publicados`;
      case 'documentos':
        return `${totalDocs} documentos técnicos con control de versiones`;
      case 'visualizaciones':
        return `${totalRenders} renders 3D · ${totalTours} tour interactivo`;
      case 'decisiones':
        return pendingDecisions.length > 0
          ? `${pendingDecisions.length} decisión pendiente de aprobación`
          : 'Todas las decisiones al día';
      case 'materiales':
        return `${totalMateriales} especificaciones de materiales y muestras`;
      default:
        return 'Acceso al módulo';
    }
  };

  return (
    <div className="space-y-bojana-block max-w-bojana-shell mx-auto pb-8">

      {/* 1. PROJECT HERO / EXECUTIVE CLIENT DASHBOARD */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 sm:p-8 shadow-bojana-widget relative overflow-hidden">
        {/* Subtle accent border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bojana-ink via-bojana-ink to-bojana-success" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-bojana-block">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-bojana-inside">
              <span className="text-xs font-sans uppercase tracking-normal px-2.5 py-0.5 rounded-bojana-badge bg-bojana-soft text-bojana-success font-medium border border-bojana-success">
                {info.estadoGeneral}
              </span>
              {project.disciplinas && project.disciplinas.length > 0 && (
                <span className="text-xs font-sans text-bojana-muted bg-bojana-soft px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                  {project.disciplinas.join(' • ')}
                </span>
              )}
              {info.ubicacion && (
                <span className="text-xs text-bojana-muted font-sans flex items-center gap-bojana-inside">
                  <MapPin className="w-3.5 h-3.5 text-bojana-muted" />
                  {info.ubicacion}
                </span>
              )}
            </div>

            <div>
              <h1 className="bojana-heading-page text-2xl sm:text-3xl font-medium text-bojana-ink tracking-normal font-sans">
                {info.nombre}
              </h1>
              <p className="text-sm sm:text-base text-bojana-muted font-medium mt-0.5">
                {info.subtitulo}
              </p>
            </div>

            {info.descripcion && (
              <p className="text-xs sm:text-sm text-bojana-muted leading-relaxed max-w-3xl pt-1">
                {info.descripcion}
              </p>
            )}
          </div>

          {/* Studio Brand Stamp */}
          <div className="flex lg:flex-col items-end justify-between lg:justify-start gap-3 border-t lg:border-t-0 lg:border-l border-bojana-line pt-4 lg:pt-0 lg:pl-6 shrink-0">
            <div className="text-left lg:text-right">
              <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Equipo a cargo</span>
              <strong className="text-sm font-medium text-bojana-ink block">Bojana Estudio</strong>
              <span className="text-xs text-bojana-muted font-sans">Arquitectura & Dirección</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Última actualización</span>
              <span className="text-xs font-sans font-medium text-bojana-ink bg-bojana-soft px-2 py-0.5 rounded-bojana-badge inline-block mt-0.5">
                {info.ultimaActualizacion}
              </span>
            </div>
          </div>
        </div>

        {/* 4 KEY METRICS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-bojana-line">
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Etapa Actual</span>
            <span className="text-xs sm:text-sm font-medium text-bojana-ink mt-1 block truncate">
              {info.etapaActual || 'Documentación ejecutiva'}
            </span>
          </div>

          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Próximo Hito</span>
            <span className="text-xs sm:text-sm font-medium text-bojana-success mt-1 block truncate">
              {info.proximoHito || 'Inicio de obra · 18 octubre'}
            </span>
          </div>

          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Superficie</span>
            <span className="text-xs sm:text-sm font-medium text-bojana-ink mt-1 block truncate">
              {info.superficie || '540 m²'}
            </span>
          </div>

          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5">
            <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">Plazo de Obra</span>
            <span className="text-xs sm:text-sm font-sans font-medium text-bojana-ink mt-1 block truncate">
              {info.fechaInicio} &rarr; {info.fechaFin}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ATTENTION CALLOUTS (Decisiones pendientes & Último Avance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-bojana-block">
        {/* Pending Decisions Alert */}
        {pendingDecisions.length > 0 ? (
          <div
            onClick={() => onNavigateToModule('decisiones')}
            className="bojana-widget bg-bojana-waiting/80 border border-bojana-line rounded-bojana-widget p-4 flex items-center justify-between gap-bojana-block cursor-pointer hover:bg-bojana-waiting hover:border-bojana-line transition shadow-bojana-widget"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-bojana-widget bg-bojana-waiting text-bojana-ink flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-sans uppercase font-medium text-bojana-ink tracking-normal">
                  Acción Requerida del Cliente
                </span>
                <h4 className="bojana-heading-component text-xs sm:text-sm font-medium text-bojana-ink mt-0.5">
                  {pendingDecisions[0].titulo}
                </h4>
                <p className="text-xs text-bojana-ink/80 mt-0.5">
                  Haga clic para revisar las opciones y confirmar su aprobación.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-bojana-ink shrink-0" />
          </div>
        ) : (
          <div className="bojana-widget bg-bojana-soft/60 border border-bojana-success rounded-bojana-widget p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-bojana-widget bg-bojana-soft text-bojana-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-sans uppercase font-medium text-bojana-success tracking-normal">
                Revisiones al día
              </span>
              <p className="text-xs text-bojana-success font-medium mt-0.5">
                No hay decisiones ni planos pendientes de aprobación por parte del cliente.
              </p>
            </div>
          </div>
        )}

        {/* Latest Avance Card */}
        {latestAvance ? (
          <div
            onClick={() => onNavigateToModule('avances')}
            className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 flex items-center justify-between gap-bojana-block cursor-pointer hover:border-bojana-line hover:shadow-bojana-widget transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              {latestAvance.fotos && latestAvance.fotos[0] ? (
                <img
                  src={latestAvance.fotos[0]}
                  alt="Avance de obra"
                  className="bojana-media w-12 h-12 rounded-bojana-widget object-contain border border-bojana-line shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-bojana-widget bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-sans uppercase font-medium text-sky-700 tracking-normal">
                  Último Avance • {latestAvance.fecha}
                </span>
                <h4 className="bojana-heading-component text-xs sm:text-sm font-medium text-bojana-ink mt-0.5 truncate">
                  {latestAvance.titulo}
                </h4>
                <p className="text-xs text-bojana-muted truncate mt-0.5">
                  {latestAvance.texto}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-bojana-muted shrink-0" />
          </div>
        ) : (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-bojana-widget bg-bojana-soft text-bojana-muted flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-sans uppercase font-medium text-bojana-muted">
                Registro Fotográfico
              </span>
              <p className="text-xs text-bojana-muted mt-0.5">
                Los avances de obra periódicos se publicarán en el módulo Avances.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. ACCESOS A LOS MÓDULOS ACTIVOS DEL PORTAL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="bojana-heading-component text-sm font-medium font-sans uppercase tracking-normal text-bojana-ink">
              Accesos a los Módulos Activos
            </h3>
            <p className="text-xs text-bojana-muted">
              Módulos habilitados y sincronizados para este proyecto.
            </p>
          </div>

          {isAdmin && onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              className="bojana-button bojana-button-secondary text-xs font-sans text-bojana-success hover:text-bojana-success bg-bojana-soft hover:bg-bojana-soft border border-bojana-success px-2.5 py-1 rounded-bojana-widget font-medium transition flex items-center gap-bojana-inside cursor-pointer"
            >
              <span>+ Gestionar Módulos</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-bojana-inside">
          {activeModules.map((module) => (
            <div
              key={module.id}
              onClick={() => onNavigateToModule(module.id)}
              className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget hover:border-bojana-line/30 hover:shadow-bojana-widget transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-bojana-widget bg-bojana-surface border border-bojana-line flex items-center justify-center group-hover:scale-105 transition">
                    {getModuleIcon(module.id)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-bojana-line group-hover:text-bojana-ink group-hover:translate-x-0.5 transition" />
                </div>

                <div>
                  <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink group-hover:text-bojana-success transition">
                    {module.titulo}
                  </h4>
                  <p className="text-xs text-bojana-muted line-clamp-2 mt-1 leading-relaxed">
                    {module.descripcion}
                  </p>
                </div>
              </div>

              <div className="border-t border-bojana-line pt-3 mt-4 flex items-center justify-between text-xs font-sans text-bojana-muted">
                <span className="truncate">{getModuleMetric(module.id)}</span>
                <span className="text-bojana-ink font-medium group-hover:underline">Abrir &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EQUIPO BOJANA ESTUDIO (Configuración del proyecto visible en resumen) */}
      {project.equipo && project.equipo.length > 0 && (
        <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget space-y-bojana-block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-bojana-inside">
              <Users className="w-4 h-4 text-bojana-ink" />
              <h3 className="bojana-heading-component text-xs font-sans font-medium uppercase tracking-normal text-bojana-ink">
                Equipo de Bojana Estudio Asignado
              </h3>
            </div>
            <span className="text-xs text-bojana-muted font-sans">
              Contacto directo para el comitente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {project.equipo.map((member) => (
              <div
                key={member.id}
                className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h5 className="bojana-heading-component text-xs font-medium text-bojana-ink truncate">{member.nombre}</h5>
                  <p className="text-xs text-bojana-muted truncate">{member.rol}</p>
                </div>
                <div className="flex items-center gap-bojana-inside shrink-0">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="p-1 rounded-bojana-widget bg-bojana-surface hover:bg-bojana-soft border border-bojana-line text-bojana-muted transition"
                      title={member.email}
                    >
                      <Mail className="w-3 h-3" />
                    </a>
                  )}
                  {member.telefono && (
                    <a
                      href={`tel:${member.telefono}`}
                      className="p-1 rounded-bojana-widget bg-bojana-surface hover:bg-bojana-soft border border-bojana-line text-bojana-muted transition"
                      title={member.telefono}
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
