import { 
  ProjectData, 
  PortalModuleConfig, 
  DisciplinaType, 
  ProgressItem, 
  AvancePost, 
  DocumentoEntregable, 
  PlanTour, 
  DecisionItem, 
  MaterialItem,
  ClientEntity,
  ProjectDNA,
  DNAWorkflowStep,
  OperationalDiscipline,
  OperationalNeed,
  ExecutionTask,
  SubEtapaItem,
  EstadoEtapa,
  ContractualBase,
  ProjectLifecycleStatus,
  ProjectInvitationLog,
  calculateTaskProgress,
  calculateNeedProgress,
  calculateDisciplineProgress,
  calculateProjectProgressFromDisciplines
} from '../types';
import { getPendingTaskDependencies } from './projectStructure';

export {
  calculateTaskProgress,
  calculateNeedProgress,
  calculateDisciplineProgress,
  calculateProjectProgressFromDisciplines
};

export const ADMIN_CREDENTIALS = {
  usuario: 'admin',
  password: 'bojana2026'
};

/**
 * Returns the effective progress % of a project respecting lifecycle rules.
 * A project in BORRADOR or LISTO_PARA_COMPARTIR always shows 0% —
 * execution progress only counts once the project is ACTIVO or COMPLETADO.
 */
export function getEffectiveProgress(project: ProjectData): number {
  const status = project.lifecycleStatus ?? 'ACTIVO';
  if (status === 'BORRADOR' || status === 'LISTO_PARA_COMPARTIR') return 0;
  return project.progresoTotalCalculado ?? 0;
}

/**
 * Returns a human-readable label and color class for a lifecycle status.
 */
export function getLifecycleLabel(status: ProjectLifecycleStatus): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case 'BORRADOR':
      return { label: 'Borrador', color: "text-bojana-muted", description: 'Proyecto creado, portal sin publicar' };
    case 'LISTO_PARA_COMPARTIR':
      return { label: 'Listo para compartir', color: "text-bojana-ink", description: 'Portal configurado, invitación no enviada' };
    case 'ACTIVO':
      return { label: 'Activo', color: "text-bojana-success", description: 'Portal activo y en ejecución' };
    case 'COMPLETADO':
      return { label: 'Completado', color: "text-bojana-discipline", description: 'Proyecto finalizado y archivado' };
  }
}

// 1. DISCIPLINE SUGGESTED NEEDS MAP
export const DISCIPLINE_NEEDS_MAP: Record<DisciplinaType, { id: string; label: string; descripcion: string }[]> = {
  Arquitectura: [
    { id: 'etapas', label: 'Etapas del proyecto', descripcion: 'Agrupaciones opcionales definidas por las necesidades y tareas elegidas' },
    { id: 'planos', label: 'Planos arquitectónicos', descripcion: 'Plantas, cortes, vistas y detalles constructivos' },
    { id: 'renders', label: 'Renders & Visualizaciones', descripcion: 'Perspectivas 3D y tour sobre plano interactivo' },
    { id: 'entregables', label: 'Entregables & Memorias', descripcion: 'Memorias descriptivas y paquetes aprobados' },
    { id: 'aprobaciones', label: 'Aprobaciones de diseño', descripcion: 'Convalidación del comitente de esquemas y propuestas' }
  ],
  Construcción: [
    { id: 'cronograma', label: 'Cronograma mensual', descripcion: 'Planificación temporal de tareas e hitos de obra' },
    { id: 'avances', label: 'Avances periódicos', descripcion: 'Publicaciones y bitácora de novedades en obra' },
    { id: 'fotos', label: 'Registro fotográfico', descripcion: 'Galería de fotos de seguimiento y evolución' },
    { id: 'hitos', label: 'Hitos clave', descripcion: 'Fechas de entrega, inicio de obra y certificaciones' },
    { id: 'documentacion', label: 'Documentación de obra', descripcion: 'Pliegos, especificaciones técnicas y replanteo' }
  ],
  Diseño: [
    { id: 'concepto', label: 'Concepto & Moodboard', descripcion: 'Idea rectora, paleta de colores y referencias visuales' },
    { id: 'propuestas', label: 'Propuestas espaciales', descripcion: 'Distribución interior y alternativas estéticas' },
    { id: 'renders', label: 'Renders interiores', descripcion: 'Visualizaciones 3D fotorrealistas de ambientación' },
    { id: 'materiales', label: 'Materiales & Muestras', descripcion: 'Catálogo de acabados, proveedores y especificaciones' },
    { id: 'alternativas', label: 'Alternativas de acabados', descripcion: 'Comparativas de materiales A / B para elección' },
    { id: 'aprobaciones', label: 'Aprobación de materiales', descripcion: 'Decisiones formales del comitente registradas' }
  ],
  Ingeniería: [
    { id: 'etapas', label: 'Etapas de ingeniería', descripcion: 'Fases de cálculo, revisión y documentación ejecutiva' },
    { id: 'planos', label: 'Planos de instalaciones y estructuras', descripcion: 'Ingeniería sanitaria, eléctrica, climatización y estructura' },
    { id: 'documentacion_tecnica', label: 'Documentación técnica', descripcion: 'Memorias de cálculo y especificaciones técnicas de ingeniería' },
    { id: 'revisiones', label: 'Revisiones con control de versión', descripcion: 'Registro estricto de Rev.01, Rev.02, Rev.03' },
    { id: 'entregables', label: 'Entregables formales', descripcion: 'Planos aprobados para cotización y construcción' }
  ]
};

// 2. GENERATE WORKFLOW FROM DNA
export function generateWorkflowFromDNA(disciplinas: DisciplinaType[], selectedNeeds: string[]): DNAWorkflowStep[] {
  const steps: DNAWorkflowStep[] = [
    {
      id: 'info',
      titulo: 'Información general',
      subtitulo: 'Datos básicos, equipo y ubicación',
      descripcion: 'Identidad del proyecto, metros cuadrados, ubicación y profesionales a cargo.',
      completado: true,
      orden: 1
    }
  ];

  let order = 2;

  // Etapas
  if (selectedNeeds.includes('etapas')) {
    steps.push({
      id: 'etapas',
      titulo: 'Definir etapas',
      subtitulo: 'Secuencia de las necesidades y tareas seleccionadas',
      descripcion: 'Configurá las fases secuenciales de avance del proyecto.',
      completado: true,
      orden: order++
    });
  }

  // Cronograma
  if (selectedNeeds.includes('cronograma') || selectedNeeds.includes('hitos')) {
    steps.push({
      id: 'cronograma',
      titulo: 'Cargar cronograma',
      subtitulo: 'Fechas principales e hitos de obra',
      descripcion: 'Agregá los plazos y fechas clave para que el comitente siga el avance.',
      completado: false,
      orden: order++
    });
  }

  // Documentos
  if (selectedNeeds.includes('planos') || selectedNeeds.includes('documentacion') || selectedNeeds.includes('documentacion_tecnica') || selectedNeeds.includes('entregables')) {
    steps.push({
      id: 'documentos',
      titulo: 'Cargar documentación inicial',
      subtitulo: 'Planos, memorias y entregables con versión',
      descripcion: 'Subí los PDFs iniciales con su correspondiente número de revisión.',
      completado: false,
      orden: order++
    });
  }

  // Visualizaciones / Renders / Tour
  if (selectedNeeds.includes('renders') || selectedNeeds.includes('propuestas')) {
    steps.push({
      id: 'visualizaciones',
      titulo: 'Configurar visualizaciones',
      subtitulo: 'Galería de renders y Tour sobre plano',
      descripcion: 'Asociá las perspectivas fotorrealistas y puntos de vista sobre el plano.',
      completado: false,
      orden: order++
    });
  }

  // Avances
  if (selectedNeeds.includes('avances') || selectedNeeds.includes('fotos')) {
    steps.push({
      id: 'avances',
      titulo: 'Preparar primer avance',
      subtitulo: 'Novedad de obra con fotos',
      descripcion: 'Publicá el primer registro fotográfico o reporte de avance para el cliente.',
      completado: false,
      orden: order++
    });
  }

  // Materiales & Decisiones
  if (selectedNeeds.includes('materiales') || selectedNeeds.includes('alternativas') || selectedNeeds.includes('aprobaciones') || selectedNeeds.includes('revisiones')) {
    steps.push({
      id: 'decisiones',
      titulo: 'Configurar propuestas & decisiones',
      subtitulo: 'Materiales con solicitud de aprobación',
      descripcion: 'Cargá las opciones de terminaciones o planos pendientes de convalidación.',
      completado: false,
      orden: order++
    });
  }

  // Accesos del cliente
  steps.push({
    id: 'accesos',
    titulo: 'Configurar accesos de comitente',
    subtitulo: 'Contactos autorizados y link directo',
    descripcion: 'Definí quiénes pueden visualizar la historia del proyecto y enviá invitaciones.',
    completado: true,
    orden: order++
  });

  // Publicar experiencia
  steps.push({
    id: 'publicar',
    titulo: 'Revisar experiencia & Publicar',
    subtitulo: 'Activación del portal para el comitente',
    descripcion: 'Comprobá la narrativa y publicá los cambios para el comitente.',
    completado: true,
    orden: order++
  });

  return steps;
}

// 3. COMPUTE NEXT RECOMMENDED ACTION (Siguiente acción)
export function getProjectNextAction(project: ProjectData): {
  titulo: string;
  descripcion: string;
  ctaTexto: string;
  targetStepId: string;
} {
  // If explicitly defined on project, return it
  if (project.dna?.siguienteAccion) {
    return {
      titulo: project.dna.siguienteAccion.titulo,
      descripcion: project.dna.siguienteAccion.descripcion,
      ctaTexto: project.dna.siguienteAccion.ctaTexto,
      targetStepId: project.dna.siguienteAccion.targetStepId || project.dna.siguienteAccion.targetPasoId || 'cronograma'
    };
  }

  // Specific Studio Showcase defaults:
  if (project.id === 'proj-los-alisos') {
    return {
      titulo: 'Publicar avance de obra',
      descripcion: 'Se completó la colocación de revestimientos en el SUM. Publicá el nuevo registro fotográfico.',
      ctaTexto: 'Publicar avance de obra',
      targetStepId: 'avances'
    };
  }

  if (project.id === 'proj-casa-nordelta') {
    return {
      titulo: 'Configurar propuesta de materiales',
      descripcion: 'Hay 2 alternativas de madera para la isla de cocina pendientes de aprobación.',
      ctaTexto: 'Configurar propuesta de materiales',
      targetStepId: 'decisiones'
    };
  }

  if (project.id === 'proj-oficinas-ar') {
    return {
      titulo: 'Subir Rev.03 del plano eléctrico',
      descripcion: 'Ingeniería completó el cálculo de acometida. Actualizá el archivo a Revisión 03.',
      ctaTexto: 'Subir Rev.03 del plano eléctrico',
      targetStepId: 'documentos'
    };
  }

  // Incomplete workflow step:
  const steps = project.dna?.pasosWorkflow || [];
  const nextIncomplete = steps.find(s => !s.completado && s.id !== 'publicar');
  if (nextIncomplete) {
    return {
      titulo: nextIncomplete.titulo,
      descripcion: nextIncomplete.descripcion,
      ctaTexto: nextIncomplete.titulo,
      targetStepId: nextIncomplete.id
    };
  }

  // Pending client decisions:
  const pendingDecisions = (project.decisiones || []).filter(d => d.estado === 'Pendiente').length;
  if (pendingDecisions > 0) {
    return {
      titulo: `${pendingDecisions} decisiones pendientes del cliente`,
      descripcion: 'El comitente debe convalidar las opciones presentadas.',
      ctaTexto: 'Revisar decisiones',
      targetStepId: 'decisiones'
    };
  }

  return {
    titulo: 'Actualizar cronograma o hitos',
    descripcion: 'Mantené al día las fechas proyectadas del proyecto.',
    ctaTexto: 'Ver cronograma',
    targetStepId: 'cronograma'
  };
}

// 4. OPERATIONAL EXECUTION ENGINE PRESETS (DISCIPLINA -> NECESIDAD -> ETAPAS/TAREAS -> %)
export const DEFAULT_OPERATIONAL_DISCIPLINES: Record<DisciplinaType, OperationalDiscipline> = {
  Arquitectura: {
    id: 'Arquitectura',
    necesidades: [
      {
        id: 'etapas',
        nombre: 'Etapas del proyecto',
        descripcion: 'Fases secuenciales de anteproyecto y desarrollo ejecutivo.',
        pesoPorcentaje: 20,
        tipoNecesidad: 'etapas',
        tareas: [
          { id: 'arq-et-1', titulo: 'Definición de alcance', pesoPorcentaje: 15, estado: 'Completado', visibleCliente: true, notaCliente: 'Alcance validado con el comitente.' },
          { id: 'arq-et-2', titulo: 'Anteproyecto', pesoPorcentaje: 25, estado: 'Completado', visibleCliente: true, notaCliente: 'Esquema aprobado por la comisión.' },
          { id: 'arq-et-3', titulo: 'Desarrollo de proyecto', pesoPorcentaje: 30, estado: 'Completado', visibleCliente: true, notaCliente: 'Definición técnica y espacial consolidada.' },
          { id: 'arq-et-4', titulo: 'Documentación final', pesoPorcentaje: 30, estado: 'Completado', visibleCliente: true, notaCliente: 'Legajo ejecutivo completo para cotización.' }
        ]
      },
      {
        id: 'planos',
        nombre: 'Planos',
        descripcion: 'Legajo técnico arquitectónico, plantas, cortes y detalles.',
        pesoPorcentaje: 25,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'arq-pl-1', titulo: 'Planta general', pesoPorcentaje: 35, estado: 'Completado', visibleCliente: true, notaCliente: 'Rev. 03 · Publicado al cliente' },
          { id: 'arq-pl-2', titulo: 'Planta de demolición', pesoPorcentaje: 30, estado: 'Completado', visibleCliente: true, notaCliente: 'Rev. 02 · Publicado al cliente' },
          { 
            id: 'arq-pl-3', 
            titulo: 'Detalles constructivos', 
            pesoPorcentaje: 25, 
            estado: 'En curso', 
            visibleCliente: true, 
            notaCliente: 'Ajustar encuentro de carpintería.',
            archivos: [
              { nombre: 'detalle-sum-r02.pdf', url: '#', tipo: 'pdf' }
            ],
            subetapas: [
              { id: 'sub-det-1', label: 'Criterio y especificación inicial', completada: true, pesoPorcentaje: 80 },
              { id: 'sub-det-2', label: 'Revisión técnica de encuentros', completada: false, pesoPorcentaje: 20 }
            ]
          },
          { id: 'arq-pl-4', titulo: 'Plano final', pesoPorcentaje: 10, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'renders',
        nombre: 'Renders',
        descripcion: 'Perspectivas fotorrealistas y visualizaciones de áreas comunes.',
        pesoPorcentaje: 25,
        tipoNecesidad: 'tareas',
        tareas: [
          {
            id: 'arq-ren-1',
            titulo: 'SUM — Vista hacia el lago',
            pesoPorcentaje: 30,
            estado: 'Completado',
            visibleCliente: true,
            notaCliente: 'Vistas del sector SUM con luz de atardecer finalizadas.'
          },
          {
            id: 'arq-ren-2',
            titulo: 'Fachada principal & Accesos',
            pesoPorcentaje: 25,
            estado: 'Completado',
            visibleCliente: true,
            notaCliente: 'Renders finales de entrada y marquesina completados.'
          },
          {
            id: 'arq-ren-3',
            titulo: 'Sector fuegos & Galería exterior',
            pesoPorcentaje: 25,
            estado: 'Completado',
            visibleCliente: true,
            notaCliente: 'Visualización fotorrealista del quincho integrada.'
          },
          {
            id: 'arq-ren-4',
            titulo: 'Aprobación de propuesta de cocina',
            pesoPorcentaje: 20,
            estado: 'Esperando al cliente',
            visibleCliente: true,
            notaCliente: 'Esperando convalidación del comitente para avanzar con la documentación ejecutiva.',
            archivos: [
              { nombre: 'Propuesta cocina Club House.pdf', url: '#', tipo: 'pdf' },
              { nombre: 'Render 01 — Isla y mesada.jpg', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', tipo: 'imagen' }
            ],
            subetapas: [
              { id: 'sub-gim-1', label: 'Definir vistas', completada: true, pesoPorcentaje: 20 },
              { id: 'sub-gim-2', label: 'Modelado 3D', completada: true, pesoPorcentaje: 25 },
              { id: 'sub-gim-3', label: 'Render preliminar', completada: true, pesoPorcentaje: 25 },
              { id: 'sub-gim-4', label: 'Aprobación de propuesta', completada: false, pesoPorcentaje: 15 },
              { id: 'sub-gim-5', label: 'Render final', completada: false, pesoPorcentaje: 15 }
            ],
            accionCliente: {
              id: 'ca-cocina',
              activa: true,
              tipo: 'elegir_alternativa',
              titulo: 'Aprobación de propuesta de cocina',
              mensaje: 'Necesitamos tu aprobación para continuar con el desarrollo final y la compra de materiales.',
              accionRequeridaTexto: 'Aprobar propuesta',
              fechaLimite: '12 OCT',
              bloquearSiguientesEtapas: true,
              pesoPorcentaje: 15,
              alternativas: [
                {
                  id: 'alt-roble',
                  letra: 'Opción A',
                  titulo: 'Roble natural con cantos ABS',
                  descripcion: 'Tono cálido, textura de veta suave y acabado mate hidrorrepelente.',
                  imagenUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
                  costoEstimado: 'Incluido en presupuesto base'
                },
                {
                  id: 'alt-oscuro',
                  letra: 'Opción B',
                  titulo: 'Roble oscuro tintado al aceite',
                  descripcion: 'Contraste contemporáneo con herrajes negro mate.',
                  imagenUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80',
                  costoEstimado: '+5% sobre presupuesto base'
                }
              ],
              adjuntos: [
                { id: 'att-1', nombre: 'Propuesta cocina Club House.pdf', tipo: 'pdf' },
                { id: 'att-2', nombre: 'Render 01 — Isla y mesada.jpg', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', tipo: 'imagen' },
                { id: 'att-3', nombre: 'Render 02 — Vistas alacenas.jpg', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80', tipo: 'imagen' }
              ],
              estado: 'pendiente',
              fechaSolicitud: '08 OCT · 10:42 hs',
              solicitudEnviadaEmail: true,
              emailDestinatario: 'maria.lopez@losalisos.com',
              emailEntregado: true,
              emailAbierto: true
            }
          }
        ]
      },
      {
        id: 'entregables',
        nombre: 'Entregables',
        descripcion: 'Memorias descriptivas y carpetas formales.',
        pesoPorcentaje: 15,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'arq-ent-1', titulo: 'Memoria descriptiva y planos aprobados', pesoPorcentaje: 50, estado: 'Completado', visibleCliente: true, notaCliente: 'Paquete de anteproyecto consolidado.' },
          { id: 'arq-ent-2', titulo: 'Pliego de especificaciones técnicas', pesoPorcentaje: 50, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'aprobaciones',
        nombre: 'Aprobaciones',
        descripcion: 'Convalidaciones de comitente y visados de propuesta.',
        pesoPorcentaje: 15,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'arq-ap-1', titulo: 'Convalidación de esquema funcional preliminar', pesoPorcentaje: 35, estado: 'Completado', visibleCliente: true, notaCliente: 'Aprobado formalmente por cliente el 02 OCT.' },
          { id: 'arq-ap-2', titulo: 'Definición de volumetría y aberturas', pesoPorcentaje: 65, estado: 'Pendiente', visibleCliente: true }
        ]
      }
    ]
  },
  Construcción: {
    id: 'Construcción',
    necesidades: [
      {
        id: 'cronograma',
        nombre: 'Cronograma',
        descripcion: 'Planificación temporal de tareas e hitos de obra.',
        pesoPorcentaje: 25,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'con-cro-1', titulo: 'Demolición y desmontes de tabiques', pesoPorcentaje: 20, estado: 'Completado', visibleCliente: true },
          { id: 'con-cro-2', titulo: 'Pases de instalaciones y tendido de cañerías', pesoPorcentaje: 20, estado: 'Completado', visibleCliente: true },
          { id: 'con-cro-3', titulo: 'Colocación de revestimientos SUM', pesoPorcentaje: 20, estado: 'Completado', visibleCliente: true, notaCliente: 'Avanzando en piso de 60x120 cm.' },
          { id: 'con-cro-4', titulo: 'Preparación de contrapiso gimnasio', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'con-cro-5', titulo: 'Terminaciones y pintura general', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'avances',
        nombre: 'Avances de obra',
        descripcion: 'Colección de frentes constructivos en ejecución real.',
        pesoPorcentaje: 25,
        esColeccion: true,
        tipoNecesidad: 'coleccion',
        tareas: [
          {
            id: 'con-av-sum',
            titulo: 'Revestimiento SUM',
            pesoPorcentaje: 25,
            estado: 'Completado',
            visibleCliente: true,
            notaCliente: 'Revestimiento completado al 100%.',
            subetapas: [
              { id: 'sum-sub-1', label: 'Trabajo iniciado', completada: true, pesoPorcentaje: 10 },
              { id: 'sum-sub-2', label: 'Ejecución', completada: true, pesoPorcentaje: 60 },
              { id: 'sum-sub-3', label: 'Revisión', completada: true, pesoPorcentaje: 20 },
              { id: 'sum-sub-4', label: 'Finalizado', completada: true, pesoPorcentaje: 10 }
            ]
          },
          {
            id: 'con-av-elec',
            titulo: 'Instalación eléctrica',
            pesoPorcentaje: 25,
            estado: 'En curso',
            visibleCliente: true,
            notaCliente: 'Pases de bandejas y cañerías listos para cableado.',
            subetapas: [
              { id: 'elec-sub-1', label: 'Trabajo iniciado', completada: true, pesoPorcentaje: 10 },
              { id: 'elec-sub-2', label: 'Ejecución', completada: true, pesoPorcentaje: 60 },
              { id: 'elec-sub-3', label: 'Revisión', completada: false, pesoPorcentaje: 20 },
              { id: 'elec-sub-4', label: 'Finalizado', completada: false, pesoPorcentaje: 10 }
            ]
          },
          {
            id: 'con-av-carp',
            titulo: 'Carpinterías',
            pesoPorcentaje: 25,
            estado: 'En curso',
            visibleCliente: true,
            subetapas: [
              { id: 'carp-sub-1', label: 'Trabajo iniciado', completada: true, pesoPorcentaje: 10 },
              { id: 'carp-sub-2', label: 'Ejecución', completada: false, pesoPorcentaje: 60 },
              { id: 'carp-sub-3', label: 'Revisión', completada: false, pesoPorcentaje: 20 },
              { id: 'carp-sub-4', label: 'Finalizado', completada: false, pesoPorcentaje: 10 }
            ]
          },
          {
            id: 'con-av-pint',
            titulo: 'Pintura',
            pesoPorcentaje: 25,
            estado: 'Pendiente',
            visibleCliente: false,
            subetapas: [
              { id: 'pint-sub-1', label: 'Trabajo iniciado', completada: false, pesoPorcentaje: 10 },
              { id: 'pint-sub-2', label: 'Ejecución', completada: false, pesoPorcentaje: 60 },
              { id: 'pint-sub-3', label: 'Revisión', completada: false, pesoPorcentaje: 20 },
              { id: 'pint-sub-4', label: 'Finalizado', completada: false, pesoPorcentaje: 10 }
            ]
          }
        ]
      },
      {
        id: 'fotos',
        nombre: 'Fotos',
        descripcion: 'Registro visual y seguimiento fotográfico periódico.',
        pesoPorcentaje: 15,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'con-fot-1', titulo: 'Registro inicial de demolición', pesoPorcentaje: 20, estado: 'Completado', visibleCliente: true },
          { id: 'con-fot-2', titulo: 'Registro durante ejecución de revestimientos', pesoPorcentaje: 40, estado: 'Completado', visibleCliente: true },
          { id: 'con-fot-3', titulo: 'Selección y organización de bitácora', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'con-fot-4', titulo: 'Publicación en el portal del comitente', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'hitos',
        nombre: 'Hitos',
        descripcion: 'Eventos contractuales y fechas clave de certificación.',
        pesoPorcentaje: 20,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'con-hi-1', titulo: 'Definición de plan de trabajo', pesoPorcentaje: 10, estado: 'Completado', visibleCliente: true },
          { id: 'con-hi-2', titulo: 'Preparación de obrador y acopio', pesoPorcentaje: 20, estado: 'Completado', visibleCliente: true },
          { id: 'con-hi-3', titulo: 'En ejecución: Albañilería e instalaciones', pesoPorcentaje: 40, estado: 'En curso', visibleCliente: true },
          { id: 'con-hi-4', titulo: 'Verificación técnica de avance', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'con-hi-5', titulo: 'Completado y certificación mensual', pesoPorcentaje: 10, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'documentacion',
        nombre: 'Documentación',
        descripcion: 'Pliegos, protocolos y actas de obra firmadas.',
        pesoPorcentaje: 15,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'con-doc-1', titulo: 'Recopilar antecedentes y planos aprobados', pesoPorcentaje: 15, estado: 'Completado', visibleCliente: true },
          { id: 'con-doc-2', titulo: 'Preparar pliego de condiciones técnicas', pesoPorcentaje: 30, estado: 'Completado', visibleCliente: true },
          { id: 'con-doc-3', titulo: 'Revisar con contratistas', pesoPorcentaje: 25, estado: 'Pendiente', visibleCliente: false },
          { id: 'con-doc-4', titulo: 'Ajustar observaciones', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'con-doc-5', titulo: 'Publicar / archivar legajo final', pesoPorcentaje: 10, estado: 'Pendiente', visibleCliente: false }
        ]
      }
    ]
  },
  Diseño: {
    id: 'Diseño',
    necesidades: [
      {
        id: 'propuestas',
        nombre: 'Propuestas',
        descripcion: 'Conceptos espaciales y planteos de interiorismo.',
        pesoPorcentaje: 25,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'dis-pro-1', titulo: 'Concepto general e idea rectora', pesoPorcentaje: 15, estado: 'Completado', visibleCliente: true },
          { id: 'dis-pro-2', titulo: 'Desarrollo de propuestas espaciales', pesoPorcentaje: 35, estado: 'Completado', visibleCliente: true },
          { id: 'dis-pro-3', titulo: 'Presentación al comitente', pesoPorcentaje: 20, estado: 'En curso', visibleCliente: true },
          { id: 'dis-pro-4', titulo: 'Feedback y ajustes', pesoPorcentaje: 15, estado: 'Pendiente', visibleCliente: false },
          { id: 'dis-pro-5', titulo: 'Propuesta final consolidada', pesoPorcentaje: 15, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'renders',
        nombre: 'Renders interiores',
        descripcion: 'Visualizaciones fotorrealistas de iluminación y mobiliario.',
        pesoPorcentaje: 20,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'dis-ren-1', titulo: 'Definir vistas de interiorismo', pesoPorcentaje: 10, estado: 'Completado', visibleCliente: true },
          { id: 'dis-ren-2', titulo: 'Modelado 3D de piezas y mobiliario', pesoPorcentaje: 25, estado: 'Completado', visibleCliente: true },
          { id: 'dis-ren-3', titulo: 'Materialidad y texturas', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'dis-ren-4', titulo: 'Render preliminar', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'dis-ren-5', titulo: 'Revisión con comitente', pesoPorcentaje: 10, estado: 'Pendiente', visibleCliente: false },
          { id: 'dis-ren-6', titulo: 'Render final', pesoPorcentaje: 15, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'materiales',
        nombre: 'Materiales',
        descripcion: 'Colección de especificaciones y muestras aprobadas.',
        pesoPorcentaje: 25,
        esColeccion: true,
        tipoNecesidad: 'coleccion',
        tareas: [
          {
            id: 'dis-mat-piso',
            titulo: 'Piso SUM: Porcelanato Ilva Tribeca Grey 60x120',
            pesoPorcentaje: 20,
            estado: 'Completado',
            visibleCliente: true,
            notaCliente: 'Piso SUM definido y aprobado.',
            subetapas: [
              { id: 'mat-p-1', label: 'Identificación', completada: true, pesoPorcentaje: 15 },
              { id: 'mat-p-2', label: 'Investigación / selección', completada: true, pesoPorcentaje: 25 },
              { id: 'mat-p-3', label: 'Presentación', completada: true, pesoPorcentaje: 20 },
              { id: 'mat-p-4', label: 'Revisión con cliente', completada: true, pesoPorcentaje: 20 },
              { id: 'mat-p-5', label: 'Definición final', completada: true, pesoPorcentaje: 20 }
            ]
          },
          {
            id: 'dis-mat-rev',
            titulo: 'Revestimiento barra quincho y mesadas',
            pesoPorcentaje: 20,
            estado: 'Completado',
            visibleCliente: true,
            subetapas: [
              { id: 'mat-r-1', label: 'Identificación', completada: true, pesoPorcentaje: 15 },
              { id: 'mat-r-2', label: 'Investigación / selección', completada: true, pesoPorcentaje: 25 },
              { id: 'mat-r-3', label: 'Presentación', completada: true, pesoPorcentaje: 20 },
              { id: 'mat-r-4', label: 'Revisión con cliente', completada: true, pesoPorcentaje: 20 },
              { id: 'mat-r-5', label: 'Definición final', completada: true, pesoPorcentaje: 20 }
            ]
          },
          {
            id: 'dis-mat-ilu',
            titulo: 'Iluminación y artefactos suspendidos',
            pesoPorcentaje: 20,
            estado: 'En curso',
            visibleCliente: true,
            subetapas: [
              { id: 'mat-i-1', label: 'Identificación', completada: true, pesoPorcentaje: 15 },
              { id: 'mat-i-2', label: 'Investigación / selección', completada: true, pesoPorcentaje: 25 },
              { id: 'mat-i-3', label: 'Presentación', completada: true, pesoPorcentaje: 20 },
              { id: 'mat-i-4', label: 'Revisión con cliente', completada: false, pesoPorcentaje: 20 },
              { id: 'mat-i-5', label: 'Definición final', completada: false, pesoPorcentaje: 20 }
            ]
          },
          {
            id: 'dis-mat-mob',
            titulo: 'Mobiliario modular y sillería',
            pesoPorcentaje: 20,
            estado: 'Pendiente',
            visibleCliente: false,
            subetapas: [
              { id: 'mat-m-1', label: 'Identificación', completada: true, pesoPorcentaje: 15 },
              { id: 'mat-m-2', label: 'Investigación / selección', completada: false, pesoPorcentaje: 25 },
              { id: 'mat-m-3', label: 'Presentación', completada: false, pesoPorcentaje: 20 },
              { id: 'mat-m-4', label: 'Revisión con cliente', completada: false, pesoPorcentaje: 20 },
              { id: 'mat-m-5', label: 'Definición final', completada: false, pesoPorcentaje: 20 }
            ]
          },
          {
            id: 'dis-mat-gri',
            titulo: 'Griferías y bachas sanitarias',
            pesoPorcentaje: 20,
            estado: 'Pendiente',
            visibleCliente: false,
            subetapas: [
              { id: 'mat-g-1', label: 'Identificación', completada: false, pesoPorcentaje: 15 },
              { id: 'mat-g-2', label: 'Investigación / selección', completada: false, pesoPorcentaje: 25 },
              { id: 'mat-g-3', label: 'Presentación', completada: false, pesoPorcentaje: 20 },
              { id: 'mat-g-4', label: 'Revisión con cliente', completada: false, pesoPorcentaje: 20 },
              { id: 'mat-g-5', label: 'Definición final', completada: false, pesoPorcentaje: 20 }
            ]
          }
        ]
      },
      {
        id: 'alternativas',
        nombre: 'Alternativas',
        descripcion: 'Comparativas A / B para elección formal del cliente.',
        pesoPorcentaje: 15,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'dis-alt-1', titulo: 'Crear opciones A / B', pesoPorcentaje: 30, estado: 'Completado', visibleCliente: true },
          { id: 'dis-alt-2', titulo: 'Presentar alternativas con renders', pesoPorcentaje: 15, estado: 'Completado', visibleCliente: true },
          { id: 'dis-alt-3', titulo: 'Comparar y evaluar feedback', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'dis-alt-4', titulo: 'Selección final del comitente', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'dis-alt-5', titulo: 'Cierre de especificación', pesoPorcentaje: 15, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'aprobaciones',
        nombre: 'Aprobaciones',
        descripcion: 'Decisiones registradas de materiales y acabados.',
        pesoPorcentaje: 15,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'dis-ap-1', titulo: 'Preparar propuesta formal', pesoPorcentaje: 20, estado: 'Completado', visibleCliente: true },
          { id: 'dis-ap-2', titulo: 'Enviar al cliente', pesoPorcentaje: 10, estado: 'Completado', visibleCliente: true },
          { id: 'dis-ap-3', titulo: 'En revisión por comitente', pesoPorcentaje: 30, estado: 'Pendiente', visibleCliente: true },
          { id: 'dis-ap-4', titulo: 'Ajustes finales si corresponden', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'dis-ap-5', titulo: 'Aprobado formalmente', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false }
        ]
      }
    ]
  },
  Ingeniería: {
    id: 'Ingeniería',
    necesidades: [
      {
        id: 'documentacion_tecnica',
        nombre: 'Documentación técnica',
        descripcion: 'Memorias de cálculo y especificaciones de instalaciones.',
        pesoPorcentaje: 25,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'ing-doc-1', titulo: 'Recolección de información de base', pesoPorcentaje: 15, estado: 'Completado', visibleCliente: true },
          { id: 'ing-doc-2', titulo: 'Desarrollo técnico y dimensionamiento', pesoPorcentaje: 35, estado: 'Completado', visibleCliente: true },
          { id: 'ing-doc-3', titulo: 'Coordinación con arquitectura y estructura', pesoPorcentaje: 20, estado: 'Completado', visibleCliente: true },
          { id: 'ing-doc-4', titulo: 'Revisión interna y control de interferencias', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'ing-doc-5', titulo: 'Emisión final de memoria técnica', pesoPorcentaje: 10, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'planos',
        nombre: 'Planos',
        descripcion: 'Instalaciones sanitarias, eléctricas, climatización y estructura.',
        pesoPorcentaje: 30,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'ing-pl-1', titulo: 'Base y criterios de trazado', pesoPorcentaje: 10, estado: 'Completado', visibleCliente: true },
          { id: 'ing-pl-2', titulo: 'Desarrollo de legajo técnico', pesoPorcentaje: 40, estado: 'Completado', visibleCliente: true },
          { id: 'ing-pl-3', titulo: 'Coordinación con otras disciplinas', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'ing-pl-4', titulo: 'Revisión técnica', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'ing-pl-5', titulo: 'Emisión de planos para obra', pesoPorcentaje: 10, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'entregables',
        nombre: 'Entregables',
        descripcion: 'Planos y pliegos aprobados para cotización y obra.',
        pesoPorcentaje: 20,
        tipoNecesidad: 'tareas',
        tareas: [
          { id: 'ing-ent-1', titulo: 'Preparación de dossier de ingeniería', pesoPorcentaje: 30, estado: 'Completado', visibleCliente: true },
          { id: 'ing-ent-2', titulo: 'Control técnico de calidad', pesoPorcentaje: 30, estado: 'Completado', visibleCliente: true },
          { id: 'ing-ent-3', titulo: 'Correcciones y ajustes', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false },
          { id: 'ing-ent-4', titulo: 'Emisión / entrega final visada', pesoPorcentaje: 20, estado: 'Pendiente', visibleCliente: false }
        ]
      },
      {
        id: 'revisiones',
        nombre: 'Revisiones',
        descripcion: 'Historial estricto de revisiones sucesivas de planos técnicos.',
        pesoPorcentaje: 25,
        esColeccion: true,
        tipoNecesidad: 'coleccion',
        tareas: [
          {
            id: 'ing-rev-1',
            titulo: 'Plano estructural — Rev. 01 preliminar',
            pesoPorcentaje: 33,
            estado: 'Completado',
            visibleCliente: true,
            subetapas: [
              { id: 'rev1-1', label: 'Documento recibido', completada: true, pesoPorcentaje: 10 },
              { id: 'rev1-2', label: 'Revisión técnica', completada: true, pesoPorcentaje: 40 },
              { id: 'rev1-3', label: 'Observaciones', completada: true, pesoPorcentaje: 20 },
              { id: 'rev1-4', label: 'Correcciones', completada: true, pesoPorcentaje: 20 },
              { id: 'rev1-5', label: 'Cerrado', completada: true, pesoPorcentaje: 10 }
            ]
          },
          {
            id: 'ing-rev-2',
            titulo: 'Plano estructural — Rev. 02 visado técnico',
            pesoPorcentaje: 33,
            estado: 'Completado',
            visibleCliente: true,
            subetapas: [
              { id: 'rev2-1', label: 'Documento recibido', completada: true, pesoPorcentaje: 10 },
              { id: 'rev2-2', label: 'Revisión técnica', completada: true, pesoPorcentaje: 40 },
              { id: 'rev2-3', label: 'Observaciones', completada: true, pesoPorcentaje: 20 },
              { id: 'rev2-4', label: 'Correcciones', completada: true, pesoPorcentaje: 20 },
              { id: 'rev2-5', label: 'Cerrado', completada: true, pesoPorcentaje: 10 }
            ]
          },
          {
            id: 'ing-rev-3',
            titulo: 'Plano estructural — Rev. 03 ejecutiva final',
            pesoPorcentaje: 34,
            estado: 'En curso',
            visibleCliente: false,
            comentarioInterno: 'Pendiente confirmación de potencia por empresa distribuidora.',
            subetapas: [
              { id: 'rev3-1', label: 'Documento recibido', completada: true, pesoPorcentaje: 10 },
              { id: 'rev3-2', label: 'Revisión técnica', completada: true, pesoPorcentaje: 40 },
              { id: 'rev3-3', label: 'Observaciones', completada: false, pesoPorcentaje: 20 },
              { id: 'rev3-4', label: 'Correcciones', completada: false, pesoPorcentaje: 20 },
              { id: 'rev3-5', label: 'Cerrado', completada: false, pesoPorcentaje: 10 }
            ]
          }
        ]
      }
    ]
  }
};

export function generateOperationalDisciplines(disciplinas: DisciplinaType[]): OperationalDiscipline[] {
  return disciplinas.map(disc => {
    const base = DEFAULT_OPERATIONAL_DISCIPLINES[disc];
    if (base) {
      return {
        ...base,
        necesidades: base.necesidades.map(n => ({
          ...n,
          progresoCalculado: calculateNeedProgress(n)
        })),
        progresoCalculado: calculateDisciplineProgress(base)
      };
    }
    return {
      id: disc,
      necesidades: [],
      progresoCalculado: 0
    };
  });
}

/**
 * Creates operational disciplines where ALL tasks start at 0% (estado: 'Pendiente', subetapas: completada: false).
 * Ensures that newly created projects have NOTHING in progress by default.
 */
export function generateEmptyOperationalDisciplines(
  disciplinas: DisciplinaType[],
  selectedNeedsConfig?: {
    needId: string;
    discipline: DisciplinaType;
    label?: string;
    pesoPorcentaje?: number;
    visibleCliente?: boolean;
    tasks?: (Pick<ExecutionTask, 'id' | 'titulo'> & Partial<ExecutionTask>)[];
  }[]
): OperationalDiscipline[] {
  return disciplinas.map(disc => ({
    id: disc,
    pesoPorcentaje: 100,
    necesidades: (selectedNeedsConfig || []).filter(c => c.discipline === disc).map(cfg => ({
      id: cfg.needId,
      nombre: cfg.label || cfg.needId,
      tipoNecesidad: 'tareas' as const,
      pesoPorcentaje: cfg.pesoPorcentaje ?? 100,
      visibleCliente: cfg.visibleCliente !== false,
      tareas: (cfg.tasks || []).map((task, index) => ({
        ...task,
        id: task.id || `${disc}-${cfg.needId}-task-${index + 1}`,
        titulo: task.titulo.trim(),
        pesoPorcentaje: task.pesoPorcentaje ?? 100,
        estado: task.estado ?? 'Pendiente' as EstadoEtapa,
        visibleCliente: task.visibleCliente ?? true,
      })),
      progresoCalculado: 0,
    })),
    progresoCalculado: 0,
  }));
}

export function updateTaskInDisciplines(
  disciplines: OperationalDiscipline[],
  taskId: string,
  taskUpdates: Partial<ExecutionTask>
): {
  updatedDisciplines: OperationalDiscipline[];
  affectedNeed?: OperationalNeed;
  affectedDiscipline?: OperationalDiscipline;
  newProjectProgress: number;
} {
  const allTasks = disciplines.flatMap(d => d.necesidades.flatMap(n => n.tareas));
  const currentTask = allTasks.find(task => task.id === taskId);
  const executing = taskUpdates.estado && ['En curso', 'En revisión', 'Completado'].includes(taskUpdates.estado);
  if (currentTask && executing && (getPendingTaskDependencies(allTasks, currentTask).length ||
      (currentTask.accionCliente?.activa && currentTask.accionCliente.estado === 'pendiente' && taskUpdates.estado === 'Completado'))) {
    return { updatedDisciplines: disciplines, newProjectProgress: calculateProjectProgressFromDisciplines(disciplines) };
  }
  let affectedNeed: OperationalNeed | undefined;
  let affectedDiscipline: OperationalDiscipline | undefined;

  const updatedDisciplines = disciplines.map(disc => {
    let discHasTask = false;

    const updatedNeeds = disc.necesidades.map(need => {
      const taskIndex = need.tareas.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        discHasTask = true;
        const oldTask = need.tareas[taskIndex];
        const updatedTask: ExecutionTask = { ...oldTask, ...taskUpdates };

        // If subtasks changed, recalculate status if all completed
        if (updatedTask.subetapas && updatedTask.subetapas.length > 0) {
          const allSubsDone = updatedTask.subetapas.every(s => s.completada);
          if (allSubsDone && updatedTask.estado !== 'Completado') {
            updatedTask.estado = 'Completado';
          }
        }

        const newTareas = [...need.tareas];
        newTareas[taskIndex] = updatedTask;

        const updatedNeed: OperationalNeed = {
          ...need,
          tareas: newTareas,
          progresoCalculado: calculateNeedProgress({ ...need, tareas: newTareas })
        };

        affectedNeed = updatedNeed;
        return updatedNeed;
      }
      return {
        ...need,
        progresoCalculado: calculateNeedProgress(need)
      };
    });

    const updatedDisc: OperationalDiscipline = {
      ...disc,
      necesidades: updatedNeeds,
      progresoCalculado: calculateDisciplineProgress({ ...disc, necesidades: updatedNeeds })
    };

    if (discHasTask) {
      affectedDiscipline = updatedDisc;
    }

    return updatedDisc;
  });

  const newProjectProgress = calculateProjectProgressFromDisciplines(updatedDisciplines);

  return {
    updatedDisciplines,
    affectedNeed,
    affectedDiscipline,
    newProjectProgress
  };
}

export const SYSTEM_MODULES: PortalModuleConfig[] = [
  {
    id: 'resumen',
    titulo: 'Resumen',
    descripcion: 'Dashboard ejecutivo del cliente con estado, etapa, próximo hito y accesos directos.',
    icono: 'LayoutDashboard',
    habilitado: true,
    esObligatorio: true,
    disciplinasRecomendadas: ['Arquitectura', 'Ingeniería', 'Construcción', 'Diseño']
  },
  {
    id: 'progreso',
    titulo: 'Progreso',
    descripcion: 'Etapas de proyecto, cronograma secuencial e hitos de entrega.',
    icono: 'Clock',
    habilitado: true,
    disciplinasRecomendadas: ['Arquitectura', 'Construcción']
  },
  {
    id: 'avances',
    titulo: 'Avances',
    descripcion: 'Novedades periódicas de obra con registro fotográfico en formato feed.',
    icono: 'Camera',
    habilitado: true,
    disciplinasRecomendadas: ['Construcción']
  },
  {
    id: 'documentos',
    titulo: 'Documentos & Entregables',
    descripcion: 'Planos, memorias técnicas y entregables organizados con control de versiones visible.',
    icono: 'FileText',
    habilitado: true,
    disciplinasRecomendadas: ['Arquitectura', 'Ingeniería', 'Construcción']
  },
  {
    id: 'visualizaciones',
    titulo: 'Visualizaciones',
    descripcion: 'Galería de renders 3D y Tour interactivo sobre plano con hotspots.',
    icono: 'Layers',
    habilitado: true,
    disciplinasRecomendadas: ['Arquitectura', 'Diseño']
  },
  {
    id: 'decisiones',
    titulo: 'Decisiones & Revisiones',
    descripcion: 'Aprobaciones de diseño entre alternativas y revisiones técnicas de ingeniería.',
    icono: 'CheckSquare',
    habilitado: true,
    disciplinasRecomendadas: ['Arquitectura', 'Ingeniería', 'Diseño']
  },
  {
    id: 'materiales',
    titulo: 'Materiales & Propuestas',
    descripcion: 'Fichas técnicas de materiales y acabados con solicitud directa de aprobación.',
    icono: 'Palette',
    habilitado: true,
    disciplinasRecomendadas: ['Diseño']
  }
];

export function getRecommendedModulesForDisciplines(disciplinas: DisciplinaType[]): PortalModuleConfig[] {
  return SYSTEM_MODULES.map(mod => {
    if (mod.esObligatorio) return { ...mod, habilitado: true };
    const isRecommended = mod.disciplinasRecomendadas.some(d => disciplinas.includes(d));
    return {
      ...mod,
      habilitado: isRecommended
    };
  });
}

// Initial template project based on user's exact specification
export const INITIAL_PROJECT_LOS_ALISOS: ProjectData = {
  id: 'proj-los-alisos',
  lifecycleStatus: 'ACTIVO',
  baseContractual: {
    alcance: 'Remodelación integral de áreas comunes del Club House: SUM, gimnasio, accesos y galería exterior. Incluye arquitectura, dirección de obra y diseño de interiores.',
    presupuestoAprobado: true,
    fechaPresupuestoAprobado: '2026-08-01',
    plazoInicio: '15 OCT 2026',
    plazoFin: '20 DIC 2026',
    documentosBase: [
      { id: 'db-1', nombre: 'Presupuesto aprobado BA-024', tipo: 'presupuesto', fecha: '2026-08-01' },
      { id: 'db-2', nombre: 'Planos existentes del Club House', tipo: 'planos_existentes', fecha: '2026-07-15' }
    ],
    notasInternas: 'El consorcio aprobó el presupuesto en asamblea extraordinaria del 01 AGO. Contacto principal: María López (Presidente).'
  },
  portalInvitacionEnviada: true,
  fechaInvitacion: '2026-08-15',
  historialInvitaciones: [
    {
      id: 'inv-alisos-1',
      fecha: '15 AGO 2026 · 10:42 hs',
      destinatario: 'María López',
      email: 'maria.lopez@losalisos.com',
      enviadoPor: 'Bojana Estudio <proyectos@bojana.com.ar>',
      asunto: 'Tu proyecto Los Alisos ya está disponible',
      metodo: 'lark_smtp',
      estado: 'abierto',
      fechaAcceso: '15 AGO 2026 · 11:05 hs'
    }
  ],
  info: {
    nombre: 'Los Alisos',
    subtitulo: 'Remodelación integral de áreas comunes',
    codigo: 'BA-024',
    descripcion: 'Intervención integral de Club House, SUM y accesos principales. Reorganización espacial y renovación de terminaciones.',
    ubicacion: 'Nordelta, Tigre',
    superficie: '540 m²',
    estadoGeneral: 'En Ejecución',
    etapaActual: 'Documentación ejecutiva',
    proximoHito: 'Inicio de obra · 18 octubre',
    ultimaActualizacion: '02 OCT 2026',
    fechaInicio: '15/08/2026',
    fechaFin: '20/12/2026',
    publicado: true,
    portalPublicado: true,
    cambiosSinPublicar: 0,
    ultimaPublicacion: '02 OCT 2026, 14:30 hs'
  },
  disciplinas: ['Arquitectura', 'Construcción'],
  equipo: [
    {
      id: 'eq-1',
      nombre: 'Bojana Estudio',
      rol: 'Dirección General de Proyecto',
      email: 'contacto@bojanaestudio.com',
      telefono: '+54 9 11 4589-2230'
    },
    {
      id: 'eq-2',
      nombre: 'Arq. Valentín Bojana',
      rol: 'Líder de Proyecto & Dirección de Obra',
      email: 'valentin@bojanaestudio.com'
    },
    {
      id: 'eq-3',
      nombre: 'D.I. Martina Rossi',
      rol: 'Coordinación de Interiores & Materiales',
      email: 'martina@bojanaestudio.com'
    }
  ],
  cliente: {
    nombre: 'Consorcio Los Alisos',
    empresa: 'Barrio Los Alisos S.A.',
    email: 'consorcio@losalisos.com',
    telefono: '+54 9 11 3840-9912',
    usuario: 'losalisos',
    password: 'alisos2026',
    linkSinProteccion: true,
    dedicatedToken: 'alisos-vip-2026',
    personas: [
      {
        id: 'cp-1',
        nombre: 'María López',
        email: 'maria.lopez@losalisos.com',
        cargo: 'Presidente de Comisión',
        accesoPortal: true,
        ultimoAcceso: 'Hoy, 09:15 hs'
      },
      {
        id: 'cp-2',
        nombre: 'Juan Pérez',
        email: 'juan.perez@losalisos.com',
        cargo: 'Tesorero Consorcio',
        accesoPortal: true,
        ultimoAcceso: 'Ayer, 18:40 hs'
      }
    ]
  },
  hitosInternos: [
    { id: 'hi-1', fecha: '15 OCT', nombre: 'Entrega documentación ejecutiva', estado: 'Próximo' },
    { id: 'hi-2', fecha: '22 OCT', nombre: 'Inicio etapa 2 de obra', estado: 'Próximo' }
  ],
  actividadReciente: [
    { id: 'act-1', fecha: 'Hoy, 10:20', descripcion: 'Se publicó un nuevo avance: Colocación de revestimientos', autor: 'Bojana Estudio' },
    { id: 'act-2', fecha: '02 OCT', descripcion: 'Plano general de arquitectura actualizado a Rev. 03 · Actual', autor: 'Arq. Valentín Bojana' },
    { id: 'act-3', fecha: '01 OCT', descripcion: 'Comisión Los Alisos aprobó Opción A (Roble natural) para cocina', autor: 'Cliente' }
  ],
  modulos: SYSTEM_MODULES.map(m => ({ ...m, habilitado: true })),
  
  // 2. Progreso: Etapas + Cronograma + Hitos
  progreso: [
    {
      id: 'p-1',
      nombre: 'Anteproyecto',
      tipo: 'etapa',
      fechaInicio: '15/08/2026',
      fechaFin: '05/09/2026',
      estado: 'Completado',
      descripcion: 'Esquemas preliminares, zonificación y aprobación de idea rectora.',
      orden: 1
    },
    {
      id: 'p-2',
      nombre: 'Proyecto',
      tipo: 'etapa',
      fechaInicio: '06/09/2026',
      fechaFin: '25/09/2026',
      estado: 'Completado',
      descripcion: 'Definición arquitectónica, cortes y modelado tridimensional.',
      orden: 2
    },
    {
      id: 'p-3',
      nombre: 'Documentación ejecutiva',
      tipo: 'etapa',
      fechaInicio: '26/09/2026',
      fechaFin: '15/10/2026',
      estado: 'En curso',
      descripcion: 'Planos de detalle, pliegos técnicos y cómputo métrico.',
      orden: 3
    },
    {
      id: 'p-4',
      nombre: 'Obra & Montaje',
      tipo: 'etapa',
      fechaInicio: '18/10/2026',
      fechaFin: '20/12/2026',
      estado: 'Próximo',
      descripcion: 'Fiscalización en campo, control de contratistas y recepción provisoria.',
      orden: 4
    },
    // Cronograma por meses
    {
      id: 'c-1',
      nombre: 'Demolición y limpieza de áreas',
      tipo: 'tarea',
      mes: 'Octubre 2026',
      fechaInicio: '18/10/2026',
      fechaFin: '25/10/2026',
      estado: 'Próximo',
      descripcion: 'Retiro de tabiquerías existentes y carpinterías en desuso.',
      orden: 5
    },
    {
      id: 'c-2',
      nombre: 'Instalaciones sanitarias y eléctricas',
      tipo: 'tarea',
      mes: 'Octubre 2026',
      fechaInicio: '26/10/2026',
      fechaFin: '08/11/2026',
      estado: 'Próximo',
      descripcion: 'Tendido de conductos de iluminación dimerizada y desagües.',
      orden: 6
    },
    {
      id: 'c-3',
      nombre: 'Terminaciones, revestimientos y pintura',
      tipo: 'tarea',
      mes: 'Noviembre 2026',
      fechaInicio: '09/11/2026',
      fechaFin: '30/11/2026',
      estado: 'Próximo',
      descripcion: 'Pisos de porcelanato símil piedra, pintura lavable y carpinterías.',
      orden: 7
    },
    // Hitos
    {
      id: 'h-1',
      nombre: 'Inicio de obra',
      tipo: 'hito',
      fechaInicio: '18/10/2026',
      fechaFin: '18/10/2026',
      estado: 'Próximo',
      descripcion: 'Firma de acta de replanteo e ingreso de personal.',
      orden: 8
    }
  ],

  // 3. Avances (Posts periódicos con fotos)
  avances: [
    {
      id: 'av-1',
      titulo: 'Colocación de revestimientos',
      fecha: '02 OCT 2026',
      texto: 'Se completó el revestimiento del sector SUM y comienza la preparación del gimnasio.',
      categoria: 'Terminaciones',
      autor: 'Bojana Estudio',
      fotos: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80'
      ],
      archivos: [
        { nombre: 'Reporte-Inspeccion-SUM-02Oct.pdf', url: '#', tamano: '1.8 MB' }
      ]
    },
    {
      id: 'av-2',
      titulo: 'Instalaciones eléctricas',
      fecha: '25 SEP 2026',
      texto: 'Finalización de pases y revisión de tableros.',
      categoria: 'Instalaciones',
      autor: 'Bojana Estudio',
      fotos: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80'
      ]
    }
  ],

  // 4. Documentos & Entregables (Con versionado visible)
  documentos: [
    {
      id: 'doc-1',
      titulo: 'Planta General de Arquitectura',
      categoria: 'Planos',
      formato: 'PDF',
      revisiones: [
        {
          id: 'rev-03',
          numeroRevision: 'Revisión 03 · Actual',
          fecha: '02/10/2026',
          url: '#',
          tamano: '4.2 MB',
          esActual: true,
          cambios: 'Ajuste de cotas en vestíbulo y reubicación de tabique en SUM.',
          aprobadoPor: 'Arq. Valentín Bojana'
        },
        {
          id: 'rev-02',
          numeroRevision: 'Revisión 02',
          fecha: '20/09/2026',
          url: '#',
          tamano: '3.9 MB',
          esActual: false,
          cambios: 'Incorporación de acceso secundario de servicio.',
          aprobadoPor: 'Bojana Estudio'
        },
        {
          id: 'rev-01',
          numeroRevision: 'Revisión 01',
          fecha: '01/09/2026',
          url: '#',
          tamano: '3.5 MB',
          esActual: false,
          cambios: 'Emisión inicial para licitación.',
          aprobadoPor: 'Bojana Estudio'
        }
      ]
    },
    {
      id: 'doc-2',
      titulo: 'Instalación Sanitaria y Red de Desagües',
      categoria: 'Documentación técnica',
      formato: 'PDF',
      revisiones: [
        {
          id: 'rev-san-01',
          numeroRevision: 'Revisión 01 · Actual',
          fecha: '28/09/2026',
          url: '#',
          tamano: '2.4 MB',
          esActual: true,
          cambios: 'Plano técnico aprobado para empalme a red troncal.',
          aprobadoPor: 'Ing. M. Castro'
        }
      ]
    },
    {
      id: 'doc-3',
      titulo: 'Anteproyecto y Memoria Descriptiva',
      categoria: 'Entregables',
      formato: 'PDF',
      revisiones: [
        {
          id: 'rev-ant-apr',
          numeroRevision: 'Aprobado · Actual',
          fecha: '05/09/2026',
          url: '#',
          tamano: '6.8 MB',
          esActual: true,
          cambios: 'Dossier de anteproyecto visado por comitente.',
          aprobadoPor: 'Comisión Los Alisos'
        }
      ]
    }
  ],

  // 5. Visualizaciones (Galería + Tour sobre plano)
  visualizaciones: {
    galeria: [
      {
        id: 'ren-1',
        titulo: 'Vista Principal del SUM y Expansión',
        categoria: 'Interior',
        fecha: 'Sep 2026',
        imagenUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
        descripcion: 'Perspectiva interior hacia la galería exterior con cielorraso suspendido de madera e iluminación cálida.'
      },
      {
        id: 'ren-2',
        titulo: 'Área de Cocina y Barra Social',
        categoria: 'Interior',
        fecha: 'Sep 2026',
        imagenUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
        descripcion: 'Mesada en cuarzo claro, muebles a medida en roble natural y equipamiento empotrado.'
      },
      {
        id: 'ren-3',
        titulo: 'Galería y Acceso Peatonal',
        categoria: 'Exterior',
        fecha: 'Ago 2026',
        imagenUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
        descripcion: 'Fachada con revestimiento de piedra y pérgola metálica con solados antideslizantes.'
      }
    ],
    tours: [
      {
        id: 'tour-1',
        titulo: 'Tour Planta Baja — Áreas Comunes',
        planoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
        publicado: true,
        puntos: [
          {
            id: 'pt-1',
            label: 'Salón Principal SUM',
            x: 48,
            y: 52,
            renderUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
            descripcion: 'Espacio multifuncional con capacidad para 45 personas, acústica tratada y carpinterías DVH.',
            angulo: 'Vista 360° Noroeste'
          },
          {
            id: 'pt-2',
            label: 'Cocina & Barra Social',
            x: 26,
            y: 65,
            renderUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
            descripcion: 'Equipamiento industrial gastronómico con barra de apoyo y mobiliario en madera natural.',
            angulo: 'Vista Sur'
          },
          {
            id: 'pt-3',
            label: 'Galería Exterior & Parrilla',
            x: 75,
            y: 35,
            renderUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
            descripcion: 'Espacio semicubierto conectado al jardín central con solárium y sector fuegos.',
            angulo: 'Vista Noreste'
          }
        ]
      }
    ]
  },

  // 6. Decisiones & Revisiones
  decisiones: [
    {
      id: 'dec-1',
      titulo: 'Terminación de cocina y revestimiento de frentes',
      tipo: 'decision_diseno',
      descripcion: 'Bojana Estudio propone dos alternativas de acabados para los frentes bajo mesada y alacenas.',
      fechaCreacion: '28/09/2026',
      fechaDecision: '02 OCT 2026',
      estado: 'Aprobado',
      opcionAprobadaId: 'opt-a',
      opciones: [
        {
          id: 'opt-a',
          letra: 'Opción A',
          titulo: 'Roble natural con cantos ABS',
          descripcion: 'Tono cálido, textura de veta suave y acabado mate hidrorrepelente.',
          imagenUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
          costoEstimado: 'Incluido en pliego base'
        },
        {
          id: 'opt-b',
          letra: 'Opción B',
          titulo: 'Roble oscuro tintado al aceite',
          descripcion: 'Contraste contemporáneo con herrajes negro mate.',
          imagenUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80',
          costoEstimado: '+5% sobre pliego base'
        }
      ],
      comentarios: [
        {
          id: 'com-1',
          autor: 'Bojana Estudio',
          rol: 'admin',
          fecha: '28/09/2026',
          texto: 'Recomendamos la Opción A por su mayor luminosidad en horarios vespertinos.'
        },
        {
          id: 'com-2',
          autor: 'Comisión Los Alisos',
          rol: 'cliente',
          fecha: '02/10/2026',
          texto: 'Aprobamos la Opción A (Roble natural). Queda perfecto con el piso propuesto.'
        }
      ]
    },
    {
      id: 'dec-2',
      titulo: 'Plano eléctrico — Rev. 02 (Ubicación de bocas en SUM)',
      tipo: 'revision_tecnica',
      descripcion: 'Revisión de circuitos para iluminación escénica y tomas de computación en isla central.',
      fechaCreacion: '01/10/2026',
      estado: 'Pendiente',
      comentarios: [
        {
          id: 'com-3',
          autor: 'Bojana Estudio',
          rol: 'admin',
          fecha: '01/10/2026',
          texto: 'Se agregaron 4 tomas embutidas en piso para presentaciones. Aguardamos su confirmación.'
        }
      ]
    }
  ],

  // 7. Materiales & Propuestas
  materiales: [
    {
      id: 'mat-1',
      nombre: 'Piso SUM',
      especificacion: 'Porcelanato símil piedra rectificado',
      proveedor: 'Ilva',
      marca: 'Ilva Porcellanato',
      modelo: 'Tribeca Grey Natural',
      medidas: '60x120 cm',
      imagenUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      notas: 'Antideslizante R9, tránsito intenso para áreas de alto tráfico comunitario.',
      decisionAsociadaId: 'dec-1',
      alternativas: [
        {
          id: 'alt-1',
          numero: '01',
          titulo: 'Ilva Tribeca Grey (60x120)',
          especificacion: 'Color gris medio mate'
        },
        {
          id: 'alt-2',
          numero: '02',
          titulo: 'San Pietro Limestone (80x80)',
          especificacion: 'Color beige neutro'
        },
        {
          id: 'alt-3',
          numero: '03',
          titulo: 'Portobello Pietra Di Savoia (90x90)',
          especificacion: 'Color grafito cálido'
        }
      ]
    },
    {
      id: 'mat-2',
      nombre: 'Cielorraso Suspendido Acústico',
      especificacion: 'Listones de madera finger-joint con fieltro fonoabsorbente',
      proveedor: 'Hunter Douglas / Maderera Central',
      marca: 'Acoustic Wood Panels',
      modelo: 'Slatted Natural Oak',
      medidas: 'Módulos 60x240 cm',
      imagenUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      notas: 'Coeficiente NRC 0.85 para control de reverberación en eventos.',
      alternativas: [
        {
          id: 'alt-4',
          numero: '01',
          titulo: 'Roble claro sobre fieltro negro',
          especificacion: 'Listones 27x12 mm'
        },
        {
          id: 'alt-5',
          numero: '02',
          titulo: 'Petiribí natural macizo',
          especificacion: 'Listones 35x15 mm'
        }
      ]
    }
  ],

  dna: {
    necesidades: ['etapas', 'cronograma', 'documentacion', 'planos', 'renders', 'avances', 'fotos', 'hitos'],
    pasosWorkflow: [
      { id: 'info', titulo: 'Información general', subtitulo: 'Datos y equipo', descripcion: 'Datos básicos, equipo y ubicación del proyecto.', completado: true, orden: 1 },
      { id: 'etapas', titulo: 'Etapas del proyecto', subtitulo: 'Anteproyecto → Obra', descripcion: 'Definición de etapas secuenciales.', completado: true, orden: 2 },
      { id: 'cronograma', titulo: 'Cronograma', subtitulo: 'Hitos y plazos', descripcion: 'Fechas principales e hitos de obra.', completado: true, orden: 3 },
      { id: 'documentos', titulo: 'Documentos', subtitulo: 'Planos y entregables', descripcion: 'Planos y memoria técnica con versionado.', completado: true, orden: 4 },
      { id: 'visualizaciones', titulo: 'Renders & Visualizaciones', subtitulo: 'Galería y Tour sobre plano', descripcion: 'Tour interactivo sobre plano y perspectivas 3D.', completado: true, orden: 5 },
      { id: 'avances', titulo: 'Primer avance', subtitulo: 'Fotos de obra', descripcion: 'Novedades y registro fotográfico.', completado: true, orden: 6 },
      { id: 'accesos', titulo: 'Acceso cliente', subtitulo: 'Tokens e invitación', descripcion: 'Configuración de acceso del comitente.', completado: true, orden: 7 },
      { id: 'publicar', titulo: 'Publicar', subtitulo: 'Portal activo', descripcion: 'Portal publicado para el comitente.', completado: true, orden: 8 }
    ],
    siguienteAccion: {
      titulo: 'Revisar render final del gimnasio',
      descripcion: 'Revisión técnica de perspectivas y materialidad en renderizado preliminar antes de la entrega al comitente.',
      ctaTexto: 'Completar revisión',
      targetPasoId: 'renders'
    }
  },

  // Operational Execution Hierarchy
  disciplinasOperativas: [
    DEFAULT_OPERATIONAL_DISCIPLINES['Arquitectura'],
    DEFAULT_OPERATIONAL_DISCIPLINES['Construcción']
  ],
  progresoTotalCalculado: 63,

  ultimaModificacion: new Date().toISOString(),
  
  // Backward compatibility fields
  brief: {
    nombre: 'Los Alisos',
    subtitulo: 'Remodelación integral de áreas comunes',
    descripcion: 'Intervención integral de Club House, SUM y accesos principales. Reorganización espacial y renovación de terminaciones.',
    ubicacion: 'Nordelta, Tigre',
    superficie: '540 m²',
    estadoGeneral: 'En Ejecución'
  },
  plazo: {
    fechaInicio: '15/08/2026',
    fechaFin: '20/12/2026',
    duracionMeses: 4,
    mesActual: 2,
    avanceFisicoPonderado: 63,
    proximaEntregaOHito: 'Aprobación de render gimnasio · 12 octubre'
  },
  tipoProyecto: 'Arquitectura & Obras',
  servicios: [],
  bitacora: []
};

export const INITIAL_CLIENTS: ClientEntity[] = [
  {
    id: 'cli-alisos',
    nombre: 'Consorcio Los Alisos',
    empresa: 'Barrio Los Alisos S.A.',
    email: 'consorcio@losalisos.com',
    telefono: '+54 9 11 3840-9912',
    proyectosIds: ['proj-los-alisos'],
    contactoPrincipal: 'María López (Presidente)'
  }
];

// Storage Key — bumped to V8 to force fresh default data (contextual approval flow)
const STORAGE_KEY = 'BOJANA_CLIENT_PORTAL_PROJECTS_V8';
const CLIENTS_STORAGE_KEY = 'BOJANA_CLIENTS_LIST_V3';

export function getAllProjects(): ProjectData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    // ─ Migrate old projects without lifecycleStatus ─
    const migrated = parsed.map((p: ProjectData) => ({
      ...p,
      lifecycleStatus: p.lifecycleStatus ?? 'ACTIVO'
    }));
    return migrated;
  } catch (e) {
    console.error('Error reading projects from storage:', e);
    return [];
  }
}

export function getAllClients(): ClientEntity[] {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return parsed;
  } catch (e) {
    console.error('Error reading clients from storage:', e);
    return [];
  }
}

export function saveAllClients(clients: ClientEntity[]): void {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving clients:', e);
  }
}

export function saveAllProjects(projects: ProjectData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects to storage:', e);
  }
}

export function getProjectData(id?: string): ProjectData | null {
  const projects = getAllProjects();
  if (id) {
    return projects.find(p => p.id === id) || null;
  }
  return projects[0] || null;
}

export function saveProjectData(data: ProjectData): void {
  const projects = getAllProjects();
  const index = projects.findIndex(p => p.id === data.id);
  const updatedData: ProjectData = {
    ...data,
    ultimaModificacion: new Date().toISOString()
  };

  if (index >= 0) {
    projects[index] = updatedData;
  } else {
    projects.push(updatedData);
  }
  saveAllProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = getAllProjects().filter(p => p.id !== id);
  saveAllProjects(projects);
}

/**
 * Creates a brand-new project, always starting at BORRADOR + 0% progress.
 * Call saveProjectData() after calling this to persist it.
 */
export function createProject(partial: Omit<ProjectData, 'lifecycleStatus' | 'progresoTotalCalculado' | 'ultimaModificacion'>): ProjectData {
  return {
    ...partial,
    lifecycleStatus: 'BORRADOR',
    progresoTotalCalculado: 0,
    ultimaModificacion: new Date().toISOString()
  };
}

export function createInvitationLog(
  project: ProjectData,
  recipientName: string,
  recipientEmail: string,
  metodo: 'lark_smtp' | 'resend_api' | 'manual_link' = 'lark_smtp'
): ProjectInvitationLog {
  const now = new Date();
  const dateFormatted = `${now.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
  return {
    id: `inv-${Date.now()}`,
    fecha: dateFormatted,
    destinatario: recipientName || project.cliente?.nombre || 'Comitente',
    email: recipientEmail || project.cliente?.email || '',
    enviadoPor: 'Bojana Estudio <proyectos@bojana.com.ar>',
    asunto: `Tu proyecto ${project.info?.nombre || ''} ya está disponible`,
    metodo,
    estado: 'entregado',
    fechaAcceso: undefined
  };
}

/**
 * Transitions project to ACTIVO and sets portal as published.
 * Communication is intentionally separate: sending email or copying a link happens after publishing.
 */
export function publishAndActivateProject(project: ProjectData): ProjectData {
  return {
    ...project,
    lifecycleStatus: 'ACTIVO',
    info: {
      ...project.info,
      publicado: true,
      portalPublicado: true,
      cambiosSinPublicar: 0,
      ultimaPublicacion: 'Recién publicado'
    },
    ultimaModificacion: new Date().toISOString()
  };
}

export function resetProjectDataToDefault(): ProjectData[] {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CLIENTS_STORAGE_KEY);
  return getAllProjects();
}
