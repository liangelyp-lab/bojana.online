import type { ProjectStorage, StoredDeliverable } from './services/driveStorageService';

// Types for Bojana Estudio - Client & Admin Portal System

export type UserRole = 'admin' | 'cliente';

export type DisciplinaType = 'Arquitectura' | 'Ingeniería' | 'Construcción' | 'Diseño';

// ─── PROJECT LIFECYCLE ──────────────────────────────────────────────────────
// A project only starts (progress = 0%) when the budget is approved and
// Bojana formally creates it in the system. The lifecycle state controls
// what is visible and editable, both in the admin panel and the client portal.
export type ProjectLifecycleStatus =
  | 'BORRADOR'              // Project created after budget approval; portal not yet published
  | 'LISTO_PARA_COMPARTIR'  // Base configured, ready to send invite to client
  | 'ACTIVO'                // Portal published; execution can start independently of communication
  | 'COMPLETADO';           // Project finished, portal becomes an archive

// ─── CONTRACTUAL BASE ───────────────────────────────────────────────────────
// Static information that defines the project contractually. This data is
// loaded at project creation and does NOT affect execution progress (%).
export interface ContractualBase {
  alcance: string;              // Scope description agreed upon with the client
  fueraDeAlcance?: string;
  presupuestoAprobado: boolean; // True once the budget is formally approved
  fechaPresupuestoAprobado?: string; // ISO date when budget was approved
  plazoInicio: string;          // Agreed start date (e.g. '15 OCT 2026')
  plazoFin: string;             // Agreed end date (e.g. '30 MAR 2027')
  documentosBase?: {            // Initial documents uploaded at project creation
    id: string;
    nombre: string;
    tipo: 'presupuesto' | 'planos_existentes' | 'documentacion_tecnica' | 'otros';
    url?: string;
    fecha: string;
    visibleCliente?: boolean;
    contexto?: string;
  }[];
  notasInternas?: string;       // Internal notes not visible to the client
}

// ─── INVITATION LOG ──────────────────────────────────────────────────────────
export interface ProjectInvitationLog {
  id: string;
  fecha: string;               // e.g. "03 OCT 2026 · 10:42"
  destinatario: string;        // Client name
  email: string;               // Client email
  enviadoPor: string;          // e.g. "Bojana Estudio <proyectos@bojana.com.ar>"
  asunto: string;              // Email subject
  metodo: 'lark_smtp' | 'resend_api' | 'manual_link';
  estado: 'entregado' | 'abierto' | 'pendiente';
  fechaAcceso?: string;
}

export type EstadoGeneralProyecto = 
  | 'En Planificación' 
  | 'En Ejecución' 
  | 'En Revisión' 
  | 'En Licitación' 
  | 'Finalizado';

export type ItemProgressStatus = 'Próximo' | 'En curso' | 'Completado' | 'Demorado';

export type ProgressType = 'etapa' | 'tarea' | 'hito';

export interface ProgressItem {
  id: string;
  nombre: string;
  tipo: ProgressType; // 'etapa' | 'tarea' | 'hito'
  mes?: string; // ej: 'Octubre 2026'
  fechaInicio: string;
  fechaFin: string;
  estado: ItemProgressStatus;
  descripcion?: string;
  orden: number;
}

export interface AvancePost {
  id: string;
  titulo: string; // ej: "Colocación de revestimientos"
  fecha: string; // ej: "02 OCT 2026"
  texto: string; // ej: "Se completó el revestimiento del sector SUM y comienza la preparación del gimnasio."
  fotos: string[]; // URLs de fotos
  archivos?: { nombre: string; url: string; tamano?: string }[];
  categoria?: string; // ej: "Terminaciones", "Albañilería", "Instalaciones"
  autor: string; // "Bojana Estudio"
}

export interface DocumentRevision {
  id: string;
  numeroRevision: string; // ej: "Rev. 03", "Rev. 02", "Rev. 01"
  fecha: string;
  url: string;
  tamano?: string;
  esActual: boolean;
  cambios?: string; // Notas de la revisión
  aprobadoPor?: string;
}

export interface DocumentoEntregable {
  id: string;
  titulo: string; // ej: "Planta General", "Instalación Sanitaria", "Memoria de Cálculo"
  categoria: 'Planos' | 'Documentación técnica' | 'Entregables' | 'Memorias' | string;
  formato: 'PDF' | 'DWG' | 'BIM' | 'DOC' | string;
  revisiones: DocumentRevision[]; // Historial de revisiones
}

// 5. Visualizaciones (Galería + Tour sobre plano)
export interface GalleryRenderItem {
  id: string;
  titulo: string;
  fase?: string;
  fecha?: string;
  imagenUrl: string;
  descripcion?: string;
  categoria?: string; // 'Exterior', 'Interior', 'Detalle'
}

export interface HotspotPin {
  id: string;
  label: string; // ej: "Living & Comedor", "Master Suite", "Cocina", "Terraza"
  x: number; // Porcentaje 0 - 100
  y: number; // Porcentaje 0 - 100
  renderUrl: string; // URL de la imagen 3D asociada
  descripcion?: string; // Descripción del ambiente
  angulo?: string; // ej: "Vista Noroeste"
}

export interface PlanTour {
  id: string;
  titulo: string; // ej: "Planta Principal - Áreas Comunes"
  planoUrl: string; // URL o plano SVG del proyecto
  puntos: HotspotPin[];
  publicado: boolean;
}

// 6. Decisiones & Revisiones
export type DecisionStatus = 'Pendiente' | 'Aprobado' | 'Requiere cambios';

export interface DecisionOption {
  id: string;
  letra: string; // "Opción A", "Opción B", "Opción C"
  titulo: string; // ej: "Roble natural"
  descripcion?: string;
  imagenUrl?: string;
  costoEstimado?: string;
}

export interface DecisionComment {
  id: string;
  autor: string; // "Bojana Estudio" | "Cliente"
  rol: 'admin' | 'cliente';
  fecha: string;
  texto: string;
}

export interface DecisionItem {
  id: string;
  titulo: string; // ej: "Terminación de cocina" o "Plano eléctrico — Rev. 02"
  tipo: 'decision_diseno' | 'revision_tecnica';
  descripcion: string;
  fechaCreacion: string;
  fechaDecision?: string;
  estado: DecisionStatus; // 'Pendiente' | 'Aprobado' | 'Requiere cambios'
  opcionAprobadaId?: string; // Si fue decisión con opciones
  opciones?: DecisionOption[]; // Alternativas propuestas por Bojana
  comentarios: DecisionComment[];
  archivoAdjuntoUrl?: string;
  origenMaterialId?: string; // Si proviene de Materiales & Propuestas
}

// 7. Materiales & Propuestas
export interface MaterialAlternative {
  id: string;
  numero: string; // "01", "02", "03"
  titulo: string;
  especificacion: string;
  imagenUrl?: string;
}

export interface MaterialItem {
  id: string;
  nombre: string; // ej: "Piso SUM"
  especificacion: string; // ej: "Porcelanato símil piedra"
  proveedor: string; // ej: "Ilva"
  marca: string; // ej: "Ilva Porcellanato"
  modelo: string; // ej: "Tribeca Grey"
  medidas: string; // ej: "60x120 cm"
  imagenUrl?: string;
  notas: string;
  alternativas: MaterialAlternative[];
  decisionAsociadaId?: string; // Vinculación con Módulo Decisiones
}

// System Modules Definition
export type PortalModuleId = 
  | 'resumen'
  | 'progreso'
  | 'avances'
  | 'documentos'
  | 'visualizaciones'
  | 'decisiones'
  | 'materiales';

export interface PortalModuleConfig {
  id: PortalModuleId;
  titulo: string;
  descripcion: string;
  icono: string;
  habilitado: boolean;
  esObligatorio?: boolean; // 'resumen' es obligatorio
  disciplinasRecomendadas: DisciplinaType[];
}

// Team Member (Configuration, NOT a module)
export interface TeamMember {
  id: string;
  nombre: string;
  rol: string;
  email?: string;
  telefono?: string;
  avatarUrl?: string;
}

export interface ClientContactPerson {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  cargo?: string;
  accesoPortal: boolean;
  ultimoAcceso?: string;
}

// Client and access (Configuration, NOT a module)
export interface ClientConfig {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  usuario: string;
  password?: string;
  linkSinProteccion: boolean;
  dedicatedToken: string;
  personas?: ClientContactPerson[];
}

export interface InternalMilestone {
  id: string;
  fecha: string; // ej: "15 OCT"
  nombre: string; // ej: "Entrega documentación"
  estado?: string;
}

export interface ProjectActivityLog {
  id: string;
  fecha: string;
  descripcion: string;
  autor?: string;
  taskId?: string;
  updateId?: string;
}

// Operational Execution Hierarchy (Disciplina -> Necesidad -> Etapas/Tareas -> %)
export type TipoEtapa = 'binaria' | 'estado' | 'coleccion';
export type EstadoEtapa = 
  | 'Pendiente' 
  | 'En curso' 
  | 'En revisión' 
  | 'Esperando al cliente' 
  | 'Requiere ajustes' 
  | 'Completado'
  | 'Pausada'
  | 'Fuera de alcance';

// ─── CONTEXTUAL CLIENT ACTION / APPROVAL ─────────────────────────────────────
// Can be activated on any task or stage where client action/decision is needed.
export type ClientActionType = 
  | 'aprobar_rechazar'       // Aprobar / rechazar propuesta o entregable
  | 'elegir_alternativa'     // Elegir una alternativa (A / B)
  | 'enviar_informacion'     // Enviar información requerida
  | 'subir_documento'        // Subir un documento técnico
  | 'confirmar_decision';    // Confirmar una decisión

export type ClientActionStatus = 
  | 'pendiente'              // Esperando respuesta del cliente
  | 'aprobado'               // Convalidado / aprobado por el cliente
  | 'requiere_ajustes'       // Cliente solicitó cambios
  | 'informacion_enviada';   // Cliente proveyó la información

export interface ClientActionAlternative {
  id: string;
  letra?: string;            // 'Opción A', 'Opción B'
  titulo: string;            // ej: "Roble natural"
  descripcion?: string;
  imagenUrl?: string;
  costoEstimado?: string;
}

export interface ClientActionRequired {
  id: string;
  activa: boolean;
  tipo: ClientActionType;
  titulo: string;            // ej: "Aprobación de propuesta de cocina"
  mensaje: string;           // ej: "Necesitamos tu aprobación para continuar con el desarrollo final."
  accionRequeridaTexto: string; // ej: "Aprobar propuesta"
  fechaLimite?: string;      // ej: "12 OCT"
  bloquearSiguientesEtapas?: boolean; // Bloquea avance hasta recibir respuesta
  pesoPorcentaje?: number;   // Legacy/configuración visual. No modifica el avance ADN v1.

  // Alternatives if tipo === 'elegir_alternativa'
  alternativas?: ClientActionAlternative[];

  // Attachments to review
  adjuntos?: {
    id: string;
    nombre: string;
    url?: string;
    tipo?: 'pdf' | 'imagen' | 'otro';
  }[];

  // Request status & notification tracking
  estado: ClientActionStatus;
  fechaSolicitud?: string;   // ej: "08 OCT · 10:42 hs"
  solicitudEnviadaEmail?: boolean;
  emailDestinatario?: string;
  emailEntregado?: boolean;
  emailAbierto?: boolean;

  // Resolution by client
  respuestaCliente?: {
    fecha: string;           // ej: "09 OCT · 14:32 hs"
    decision: 'aprobado' | 'requiere_cambios' | 'alternativa_elegida' | 'info_enviada';
    alternativaElegidaId?: string;
    comentario?: string;
    archivoSubidoUrl?: string;
  };
}

export interface SubEtapaItem {
  id: string;
  label: string; // ej: "Cargar render", "Agregar vista al plano", "Revisar", "Aprobar"
  completada: boolean;
  pesoPorcentaje?: number; // Peso de la etapa dentro de la tarea.
  estado?: EstadoEtapa;
}

export type DocumentFunction = 'entrada' | 'trabajo' | 'evidencia' | 'resultado';

export type DeliverableInteractionType = 'entrega_final' | 'para_revision' | 'solicitud_informacion';
export type ExpectedDeliverableStatus = 'pendiente' | 'preparado' | 'publicado' | 'aprobado' | 'cambios_solicitados' | 'recibido' | 'validado';
export type TaskUpdateAction = 'borrador' | 'publicar_avance' | 'revision' | 'solicitud_informacion' | 'publicar_terminar';
export type TaskUpdateStatus = 'borrador' | 'en_revision' | 'solicitud_enviada' | 'publicada' | 'aprobada' | 'cambios_solicitados';

export interface TaskUpdate {
  id: string;
  version: number;
  titulo: string;
  descripcion?: string;
  recursos?: string[];
  accion: TaskUpdateAction;
  estado: TaskUpdateStatus;
  fecha: string;
  autor?: string;
  visibilidad?: 'interna' | 'publicada';
  responsableRespuesta?: string;
  fechaLimiteRespuesta?: string;
  respuesta?: string;
  opciones?: ClientActionAlternative[];
  visibleCliente?: boolean;
}

export interface ExpectedDeliverable {
  id: string;
  nombre: string;
  tipo: DeliverableInteractionType;
  descripcion?: string;
  requerido?: boolean;
  publicadoCliente?: boolean;
  estado?: ExpectedDeliverableStatus;
}

export interface ExecutionTask {
  id: string;
  titulo: string; // ej: "SUM — Vista hacia el lago", "Planta de demolición", "Definir piso SUM"
  pesoPorcentaje: number; // Peso de la tarea dentro de la necesidad.
  estado: EstadoEtapa;
  descripcionTrabajo?: string;
  requisitosCierre?: string[];
  tipoEtapa?: TipoEtapa; // 'binaria' | 'estado' | 'coleccion'
  tiposContenido?: TaskContentType[]; // Contenido que el cliente puede consultar cuando la tarea está visible.
  etapasActivas?: boolean; // Indica si la tarea usa etapas configurables.
  fecha?: string;
  subetapas?: SubEtapaItem[];
  entregablesEsperados?: ExpectedDeliverable[];
  actualizaciones?: TaskUpdate[];
  archivos?: {
    nombre: string;
    url: string;
    tipo: 'imagen' | 'pdf' | 'video' | 'descargable' | 'archivo';
    funcion?: DocumentFunction;
    entregableId?: string;
    version?: number;
    revisadoInternamente?: boolean;
    publicadoCliente?: boolean;
    aprobadoPor?: string;
    storage?: StoredDeliverable;
  }[];
  comentarioInterno?: string;
  visibleCliente: boolean;
  etapa?: string; // Optional grouping chosen inside a need; never a global default.
  responsableId?: string;
  dependencias?: string[];
  notaCliente?: string; // ej: "Finalizamos las vistas principales del SUM."
  
  // Contextual Client Action (No separate module: lives exactly where needed)
  accionCliente?: ClientActionRequired;
}

export type TaskContentType = 'archivo' | 'imagenes' | 'videos' | 'descargables';

export interface OperationalNeed {
  publishedProgress?: number; // Server-computed progress including hidden tasks in a public snapshot.
  id: string; // ej: 'etapas', 'planos', 'renders', 'entregables', 'aprobaciones', 'cronograma', 'avances', 'fotos', 'hitos', 'documentacion', 'materiales', 'revisiones'
  nombre: string; // ej: "Planos", "Renders", "Etapas", "Avances de obra", "Materiales"
  descripcion?: string;
  pesoPorcentaje?: number; // Peso de la necesidad dentro del área.
  visibleCliente?: boolean; // Publica u oculta la necesidad completa en el portal.
  tipoNecesidad?: 'etapas' | 'tareas' | 'coleccion';
  esColeccion?: boolean; // ej: Avances de obra o Materiales que contienen múltiples ítems
  tareas: ExecutionTask[];
  progresoCalculado?: number; // 0 - 100
}

export interface OperationalDiscipline {
  publishedProgress?: number; // Server-computed progress including hidden tasks in a public snapshot.
  id: DisciplinaType; // 'Arquitectura' | 'Construcción' | 'Diseño' | 'Ingeniería'
  pesoPorcentaje?: number; // Peso del área dentro del proyecto.
  necesidades: OperationalNeed[];
  progresoCalculado?: number; // 0 - 100
}

export function calculateTaskProgress(task: ExecutionTask): number {
  const stages = task.subetapas || [];
  if (stages.length > 0) {
    const totalWeight = stages.reduce((sum, stage) => sum + (stage.pesoPorcentaje || 0), 0);
    if (totalWeight > 0) {
      const completedWeight = stages.reduce((sum, stage) => sum + (stage.completada || stage.estado === 'Completado' ? (stage.pesoPorcentaje || 0) : 0), 0);
      return Math.round((completedWeight / totalWeight) * 100);
    }
  }
  return task.estado === 'Completado' ? 100 : 0;
}

export function calculateNeedProgress(need: OperationalNeed): number {
  if (need.publishedProgress !== undefined) return need.publishedProgress;
  const activeTasks = (need.tareas || []).filter(t => t.estado !== 'Fuera de alcance');
  if (activeTasks.length === 0) return 0;
  const totalWeight = activeTasks.reduce((sum, task) => sum + (task.pesoPorcentaje || 0), 0);
  if (totalWeight <= 0) return Math.round(activeTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0) / activeTasks.length);
  return Math.round(activeTasks.reduce((sum, task) => sum + calculateTaskProgress(task) * (task.pesoPorcentaje || 0), 0) / totalWeight);
}

export function calculateDisciplineProgress(discipline: OperationalDiscipline): number {
  if (discipline.publishedProgress !== undefined) return discipline.publishedProgress;
  const needs = discipline.necesidades || [];
  const activeNeeds = needs.filter(need => (need.tareas || []).some(task => task.estado !== 'Fuera de alcance'));
  if (activeNeeds.length === 0) return 0;
  const totalWeight = activeNeeds.reduce((sum, need) => sum + (need.pesoPorcentaje || 0), 0);
  if (totalWeight <= 0) return Math.round(activeNeeds.reduce((sum, need) => sum + calculateNeedProgress(need), 0) / activeNeeds.length);
  return Math.round(activeNeeds.reduce((sum, need) => sum + calculateNeedProgress(need) * (need.pesoPorcentaje || 0), 0) / totalWeight);
}

export function calculateProjectProgressFromDisciplines(disciplines: OperationalDiscipline[]): number {
  const activeDisciplines = (disciplines || []).filter(d => (d.necesidades || []).some(need => need.tareas.some(task => task.estado !== 'Fuera de alcance')));
  if (activeDisciplines.length === 0) return 0;
  const totalWeight = activeDisciplines.reduce((sum, discipline) => sum + (discipline.pesoPorcentaje || 0), 0);
  if (totalWeight <= 0) return Math.round(activeDisciplines.reduce((sum, discipline) => sum + calculateDisciplineProgress(discipline), 0) / activeDisciplines.length);
  return Math.round(activeDisciplines.reduce((sum, discipline) => sum + calculateDisciplineProgress(discipline) * (discipline.pesoPorcentaje || 0), 0) / totalWeight);
}

// Project DNA & Workflow Architecture
export interface DNAWorkflowStep {
  id: string; // 'info' | 'etapas' | 'cronograma' | 'documentos' | 'visualizaciones' | 'avances' | 'decisiones' | 'materiales' | 'accesos' | 'publicar'
  titulo: string;
  subtitulo?: string;
  descripcion: string;
  completado: boolean;
  orden: number;
}

export interface ProjectDNA {
  necesidades: string[]; // e.g. ['etapas', 'cronograma', 'avances', 'fotos', 'planos', 'renders', 'entregables', 'aprobaciones', 'materiales']
  pasosWorkflow: DNAWorkflowStep[];
  siguienteAccion?: {
    titulo: string;
    descripcion: string;
    ctaTexto: string;
    targetStepId?: string;
    targetPasoId?: string;
    targetTaskId?: string;
  };
}

// Project Brief & General Info (Configuration, NOT a module)
export interface ProjectGeneralInfo {
  nombre: string; // ej: "Los Alisos"
  tipoProyecto?: string;
  portadaUrl?: string;
  subtitulo: string; // ej: "Remodelación integral de áreas comunes"
  codigo?: string; // ej: "BA-024"
  descripcion: string;
  ubicacion: string;
  superficie: string;
  estadoGeneral: EstadoGeneralProyecto;
  etapaActual: string; // ej: "Documentación ejecutiva"
  proximoHito: string; // ej: "Inicio de obra · 18 octubre"
  ultimaActualizacion: string; // ej: "2 octubre 2026"
  fechaInicio: string;
  fechaFin: string;
  publicado: boolean;
  portalPublicado?: boolean;
  cambiosSinPublicar?: number;
  ultimaPublicacion?: string;
}

// The Complete Project Data Model
export interface ProjectData {
  id: string;
  storage?: ProjectStorage;

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────
  // Controls the stage of the project in the studio's workflow.
  // Progress only starts accumulating once the project is ACTIVE.
  lifecycleStatus: ProjectLifecycleStatus;

  // ─── CONTRACTUAL BASE ──────────────────────────────────────────────────────
  // Static info established at creation. Does NOT contribute to progress (%).
  baseContractual?: ContractualBase;

  // ─── GENERAL INFO ──────────────────────────────────────────────────────────
  info: ProjectGeneralInfo;
  disciplinas: DisciplinaType[]; // Metadata del proyecto
  equipo: TeamMember[]; // Configuración de equipo
  cliente: ClientConfig; // Configuración de cliente y accesos
  modulos: PortalModuleConfig[]; // Lista de módulos activos y su orden
  
  // Data for each of the 7 modules
  progreso: ProgressItem[]; // Módulo 2
  avances: AvancePost[]; // Módulo 3
  documentos: DocumentoEntregable[]; // Módulo 4
  visualizaciones: {
    galeria: GalleryRenderItem[];
    tours: PlanTour[];
  }; // Módulo 5
  decisiones: DecisionItem[]; // Módulo 6
  materiales: MaterialItem[]; // Módulo 7

  // Project DNA (Workflow & Narrative Generation)
  dna?: ProjectDNA;
  siguienteAccionRecomendada?: {
    titulo: string;
    accionCta: string;
    targetStepId: string;
  };

  // Operational Execution Engine (Disciplina -> Necesidad -> Tareas -> %)
  // progresoTotalCalculado is ALWAYS 0 until lifecycleStatus === 'ACTIVO' | 'COMPLETADO'
  disciplinasOperativas?: OperationalDiscipline[];
  progresoTotalCalculado?: number;

  hitosInternos?: InternalMilestone[];
  actividadReciente?: ProjectActivityLog[];

  // Publication state for the client portal
  portalInvitacionEnviada?: boolean;  // True once the invite email was sent
  fechaInvitacion?: string;           // ISO date when the invite was sent
  historialInvitaciones?: ProjectInvitationLog[]; // Invitation log entries
  
  ultimaModificacion: string;
  
  // Compatibility helpers for existing navigation
  brief?: any;
  plazo?: any;
  tipoProyecto?: string;
  servicios?: any[];
  bitacora?: any[];
}

export interface ClientEntity {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  proyectosIds: string[];
  contactoPrincipal?: string;
  notas?: string;
}

// Backward compatibility types
export interface Task {
  id: string;
  rubro: string;
  avancePrevisto: number;
  avanceReal: number;
  inicioMes: number;
  finMes: number;
  estado: 'En Fecha' | 'En Riesgo' | 'Demorado' | 'Completado';
  responsable: string;
}

export interface Alert {
  id: string;
  titulo: string;
  descripcion: string;
  gravedad: 'Alta' | 'Media' | 'Baja';
  estado: 'Activa' | 'Mitigada';
  accionMitigadora: string;
  fechaEmision: string;
  moduloAfectado: string;
}

export interface DailyLog {
  id: string;
  fecha: string;
  clima: 'Despejado' | 'Lluvia' | 'Nublado' | 'Viento Fuerte';
  temperatura: string;
  personalActivo: number;
  contratistas: any[];
  tareasDelDia: string[];
  novedades: string;
  firmaDO: boolean;
  evidenciaFoto?: string;
}

export interface Document {
  id: string;
  tipo: 'O.S.' | 'N.P.';
  correlativo: string;
  asunto: string;
  descripcion: string;
  emisor: string;
  receptor: string;
  fechaEmision: string;
  estado: 'Borrador' | 'Emitida' | 'Respondida' | 'Cerrada';
  respuesta?: string;
  firmaVisual?: string;
  fechaFirma?: string;
  fechaLimiteRespuesta?: string;
}

export interface Contractor {
  nombre: string;
  gremio: string;
  personal: number;
}

export type PortalModule = PortalModuleConfig & {
  tipoWidget?: string;
  esPersonalizado?: boolean;
  orden?: number;
};

export type WidgetType = string;
export type ProjectTypeConfig = any;
export type ServiceItem = any;
export type TaskItem = any;
export type GalleryItem = any;
export type DocumentItem = any;
export type CertificationItem = any;
export type QualityTestItem = any;
export type ClientInquiry = any;

export function calculateServiceProgress(service: any): number {
  if (!service) return 0;
  if (typeof service.avanceReal === 'number') return service.avanceReal;
  if (!service.tareas || service.tareas.length === 0) return 100;
  const total = service.tareas.reduce((acc: number, t: any) => acc + (t.avance || 0), 0);
  return Math.round(total / service.tareas.length);
}

export function calculateProjectProgress(services: any[]): number {
  if (!services || services.length === 0) return 0;
  const total = services.reduce((acc: number, s: any) => acc + calculateServiceProgress(s), 0);
  return Math.round(total / services.length);
}

export interface QualityCheck {
  id: string;
  item: string;
  sector: string;
  verificadoPor: string;
  fechaVerificacion: string;
  resultado: 'Aprobado' | 'Observado' | 'Pendiente';
  observaciones?: string;
}

export interface ConcreteTest {
  id: string;
  fechaMoldeo: string;
  sectorColocacion: string;
  asentamientoCm: number;
  resistencia7dMPa: number;
  resistencia28dMPa: number;
  estado: 'En Cursado' | 'Conforme' | 'Fuera de Pliego';
}

export interface LibraryItem {
  id: string;
  categoria: string;
  titulo: string;
  codigo: string;
  revision: string;
  fecha: string;
  tamano: string;
}
