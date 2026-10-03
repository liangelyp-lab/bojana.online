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
      case 'progreso': return <Clock className="w-5 h-5 text-emerald-600" />;
      case 'avances': return <Camera className="w-5 h-5 text-sky-600" />;
      case 'documentos': return <FileText className="w-5 h-5 text-amber-600" />;
      case 'visualizaciones': return <Layers className="w-5 h-5 text-indigo-600" />;
      case 'decisiones': return <CheckSquare className="w-5 h-5 text-rose-600" />;
      case 'materiales': return <Palette className="w-5 h-5 text-teal-600" />;
      default: return <Building2 className="w-5 h-5 text-gray-600" />;
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
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      
      {/* 1. PROJECT HERO / EXECUTIVE CLIENT DASHBOARD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle accent border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-950 via-gray-700 to-emerald-600" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {info.estadoGeneral}
              </span>
              {project.disciplinas && project.disciplinas.length > 0 && (
                <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {project.disciplinas.join(' • ')}
                </span>
              )}
              {info.ubicacion && (
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {info.ubicacion}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight font-sans">
                {info.nombre}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium mt-0.5">
                {info.subtitulo}
              </p>
            </div>

            {info.descripcion && (
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl pt-1">
                {info.descripcion}
              </p>
            )}
          </div>

          {/* Studio Brand Stamp */}
          <div className="flex lg:flex-col items-end justify-between lg:justify-start gap-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 shrink-0">
            <div className="text-left lg:text-right">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Equipo a cargo</span>
              <strong className="text-sm font-bold text-gray-950 block">Bojana Estudio</strong>
              <span className="text-[11px] text-gray-500 font-mono">Arquitectura & Dirección</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Última actualización</span>
              <span className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded inline-block mt-0.5">
                {info.ultimaActualizacion}
              </span>
            </div>
          </div>
        </div>

        {/* 4 KEY METRICS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-gray-100">
          <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Etapa Actual</span>
            <span className="text-xs sm:text-sm font-bold text-gray-950 mt-1 block truncate">
              {info.etapaActual || 'Documentación ejecutiva'}
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Próximo Hito</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-800 mt-1 block truncate">
              {info.proximoHito || 'Inicio de obra · 18 octubre'}
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Superficie</span>
            <span className="text-xs sm:text-sm font-bold text-gray-950 mt-1 block truncate">
              {info.superficie || '540 m²'}
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Plazo de Obra</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-gray-950 mt-1 block truncate">
              {info.fechaInicio} &rarr; {info.fechaFin}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ATTENTION CALLOUTS (Decisiones pendientes & Último Avance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Decisions Alert */}
        {pendingDecisions.length > 0 ? (
          <div 
            onClick={() => onNavigateToModule('decisiones')}
            className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-800 tracking-wider">
                  Acción Requerida del Cliente
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                  {pendingDecisions[0].titulo}
                </h4>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  Haga clic para revisar las opciones y confirmar su aprobación.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-700 shrink-0" />
          </div>
        ) : (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 tracking-wider">
                Revisiones al día
              </span>
              <p className="text-xs text-emerald-950 font-medium mt-0.5">
                No hay decisiones ni planos pendientes de aprobación por parte del cliente.
              </p>
            </div>
          </div>
        )}

        {/* Latest Avance Card */}
        {latestAvance ? (
          <div 
            onClick={() => onNavigateToModule('avances')}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-gray-300 hover:shadow-xs transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              {latestAvance.fotos && latestAvance.fotos[0] ? (
                <img 
                  src={latestAvance.fotos[0]} 
                  alt="Avance de obra" 
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase font-bold text-sky-700 tracking-wider">
                  Último Avance • {latestAvance.fecha}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 truncate">
                  {latestAvance.titulo}
                </h4>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {latestAvance.texto}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-gray-500">
                Registro Fotográfico
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
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
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-gray-900">
              Accesos a los Módulos Activos
            </h3>
            <p className="text-xs text-gray-500">
              Módulos habilitados y sincronizados para este proyecto.
            </p>
          </div>

          {isAdmin && onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              className="text-[11px] font-mono text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>+ Gestionar Módulos</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeModules.map((module) => (
            <div
              key={module.id}
              onClick={() => onNavigateToModule(module.id)}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:border-gray-900/30 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-150 flex items-center justify-center group-hover:scale-105 transition">
                    {getModuleIcon(module.id)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-950 group-hover:text-emerald-700 transition">
                    {module.titulo}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                    {module.descripcion}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span className="truncate">{getModuleMetric(module.id)}</span>
                <span className="text-gray-900 font-bold group-hover:underline">Abrir &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EQUIPO BOJANA ESTUDIO (Configuración del proyecto visible en resumen) */}
      {project.equipo && project.equipo.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-700" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900">
                Equipo de Bojana Estudio Asignado
              </h3>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              Contacto directo para el comitente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {project.equipo.map((member) => (
              <div 
                key={member.id} 
                className="bg-gray-50 border border-gray-150 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-gray-900 truncate">{member.nombre}</h5>
                  <p className="text-[11px] text-gray-500 truncate">{member.rol}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`}
                      className="p-1 rounded bg-white hover:bg-gray-200 border border-gray-200 text-gray-600 transition"
                      title={member.email}
                    >
                      <Mail className="w-3 h-3" />
                    </a>
                  )}
                  {member.telefono && (
                    <a 
                      href={`tel:${member.telefono}`}
                      className="p-1 rounded bg-white hover:bg-gray-200 border border-gray-200 text-gray-600 transition"
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
