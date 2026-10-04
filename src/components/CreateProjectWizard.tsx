import React, { useState } from 'react';
import {
  ProjectData,
  DisciplinaType,
  TeamMember,
  PortalModuleId,
  PortalModuleConfig,
  EstadoGeneralProyecto
} from '../types';
import { SYSTEM_MODULES, getRecommendedModulesForDisciplines } from '../services/storageService';
import {
  Building2,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
  Layers,
  Sparkles,
  Users,
  KeyRound,
  FileText,
  Palette,
  Camera,
  Clock,
  CheckSquare
} from 'lucide-react';

interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (newProject: ProjectData) => void;
}

export default function CreateProjectWizard({
  isOpen,
  onClose,
  onFinish
}: CreateProjectWizardProps) {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // STEP 1: INFORMACIÓN GENERAL
  const [nombre, setNombre] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('Nordelta, Tigre');
  const [superficie, setSuperficie] = useState('450 m²');
  const [estadoGeneral, setEstadoGeneral] = useState<EstadoGeneralProyecto>('En Planificación');
  const [etapaActual, setEtapaActual] = useState('Anteproyecto');
  const [proximoHito, setProximoHito] = useState('Firma de replanteo');

  // STEP 2: DISCIPLINAS
  const [disciplinas, setDisciplinas] = useState<DisciplinaType[]>(['Arquitectura', 'Construcción']);

  // STEP 3: EQUIPO BOJANA ESTUDIO
  const [equipo, setEquipo] = useState<TeamMember[]>([
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
      rol: 'Líder de Proyecto & Dirección Técnica',
      email: 'valentin@bojanaestudio.com'
    }
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRol, setNewMemberRol] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // STEP 4: CLIENTE Y ACCESOS
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteUsuario, setClienteUsuario] = useState('');
  const [clientePassword, setClientePassword] = useState('bojana2026');
  const [linkSinProteccion, setLinkSinProteccion] = useState(true);

  // STEP 5: MÓDULOS DEL PORTAL (Initialized with recommendations from disciplines)
  const [modulos, setModulos] = useState<PortalModuleConfig[]>(() =>
    getRecommendedModulesForDisciplines(['Arquitectura', 'Construcción'])
  );

  // Auto-generate username from client name
  const handleClientNameChange = (val: string) => {
    setClienteNombre(val);
    if (!clienteUsuario) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setClienteUsuario(slug);
    }
  };

  const toggleDiscipline = (disc: DisciplinaType) => {
    const exists = disciplinas.includes(disc);
    const updated = exists ? disciplinas.filter(d => d !== disc) : [...disciplinas, disc];
    setDisciplinas(updated);

    // Update modules based on recommendation
    const recommended = getRecommendedModulesForDisciplines(updated);
    setModulos(recommended);
  };

  const toggleModule = (id: PortalModuleId) => {
    if (id === 'resumen') return;
    setModulos(prev => prev.map(m => m.id === id ? { ...m, habilitado: !m.habilitado } : m));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setEquipo(prev => [
      ...prev,
      {
        id: `eq-${Date.now()}`,
        nombre: newMemberName.trim(),
        rol: newMemberRol.trim() || 'Coordinación Técnica',
        email: newMemberEmail.trim()
      }
    ]);

    setNewMemberName('');
    setNewMemberRol('');
    setNewMemberEmail('');
  };

  const handleFinish = () => {
    const projectId = `proj-${Date.now()}`;
    const token = `${nombre.toLowerCase().replace(/[^a-z0-9]/g, '') || 'portal'}-direct-${Math.random().toString(36).substring(2, 6)}`;

    const newProject: ProjectData = {
      id: projectId,
      lifecycleStatus: 'BORRADOR',
      info: {
        nombre: nombre.trim() || 'Nuevo Proyecto',
        subtitulo: subtitulo.trim() || 'Desarrollo de Obra & Arquitectura',
        descripcion: descripcion.trim() || 'Proyecto administrado por Bojana Estudio.',
        ubicacion: ubicacion.trim() || 'Buenos Aires',
        superficie: superficie.trim() || '350 m²',
        estadoGeneral,
        etapaActual: etapaActual.trim() || 'Documentación ejecutiva',
        proximoHito: proximoHito.trim() || 'Inicio de obra',
        ultimaActualizacion: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
        fechaInicio: new Date().toLocaleDateString('es-AR'),
        fechaFin: '20/12/2026',
        publicado: true
      },
      disciplinas,
      equipo,
      cliente: {
        nombre: clienteNombre.trim() || 'Comitente',
        empresa: clienteEmpresa.trim() || clienteNombre.trim() || 'Comitente',
        email: clienteEmail.trim(),
        telefono: clienteTelefono.trim(),
        usuario: clienteUsuario.trim() || 'cliente',
        password: clientePassword.trim() || 'bojana2026',
        linkSinProteccion,
        dedicatedToken: token
      },
      modulos,
      progreso: [
        {
          id: `p-1-${Date.now()}`,
          nombre: 'Anteproyecto & Definición',
          tipo: 'etapa',
          fechaInicio: new Date().toLocaleDateString('es-AR'),
          fechaFin: '30/10/2026',
          estado: 'En curso',
          descripcion: 'Esquemas preliminares, zonificación y convalidación inicial.',
          orden: 1
        },
        {
          id: `p-2-${Date.now()}`,
          nombre: 'Proyecto Ejecutivo',
          tipo: 'etapa',
          fechaInicio: '01/11/2026',
          fechaFin: '30/11/2026',
          estado: 'Próximo',
          descripcion: 'Planos de detalle, pliegos técnicos y especificación de rubros.',
          orden: 2
        }
      ],
      avances: [
        {
          id: `av-init-${Date.now()}`,
          titulo: 'Inicio de seguimiento del proyecto',
          fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
          texto: 'Se ha dado de alta el portal oficial de seguimiento de Bojana Estudio.',
          categoria: 'Inicio',
          autor: 'Bojana Estudio',
          fotos: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
          ]
        }
      ],
      documentos: [
        {
          id: `doc-1-${Date.now()}`,
          titulo: 'Planta General de Proyecto',
          categoria: 'Planos',
          formato: 'PDF',
          revisiones: [
            {
              id: `rev-1-${Date.now()}`,
              numeroRevision: 'Revisión 01 · Actual',
              fecha: new Date().toLocaleDateString('es-AR'),
              url: '#',
              tamano: '3.6 MB',
              esActual: true,
              cambios: 'Emisión inicial para revisión técnica del comitente.',
              aprobadoPor: 'Bojana Estudio'
            }
          ]
        }
      ],
      visualizaciones: {
        galeria: [
          {
            id: `ren-1-${Date.now()}`,
            titulo: 'Perspectiva General del Proyecto',
            categoria: 'Exterior',
            fecha: 'Oct 2026',
            imagenUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
            descripcion: 'Perspectiva fotorrealista 3D de Bojana Estudio.'
          }
        ],
        tours: [
          {
            id: `tour-1-${Date.now()}`,
            titulo: 'Tour Planta Principal',
            planoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
            publicado: true,
            puntos: [
              {
                id: `pt-1-${Date.now()}`,
                label: 'Área Social Principal',
                x: 50,
                y: 50,
                renderUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
                descripcion: 'Espacio principal con iluminación natural y carpinterías de alta prestación.',
                angulo: 'Vista 360°'
              }
            ]
          }
        ]
      },
      decisiones: [
        {
          id: `dec-1-${Date.now()}`,
          titulo: 'Validación de propuesta inicial',
          tipo: 'decision_diseno',
          descripcion: 'Bojana Estudio somete a convalidación el esquema preliminar.',
          fechaCreacion: new Date().toLocaleDateString('es-AR'),
          estado: 'Pendiente',
          opciones: [
            {
              id: `opt-a-${Date.now()}`,
              letra: 'Opción A',
              titulo: 'Esquema Base Propuesto',
              descripcion: 'Líneas limpias y materiales nobles en sintonía con el entorno.',
              imagenUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
            }
          ],
          comentarios: [
            {
              id: `c-1-${Date.now()}`,
              autor: 'Bojana Estudio',
              rol: 'admin',
              fecha: new Date().toLocaleDateString('es-AR'),
              texto: 'Aguardamos su revisión y comentarios.'
            }
          ]
        }
      ],
      materiales: [
        {
          id: `mat-1-${Date.now()}`,
          nombre: 'Solado Principal',
          especificacion: 'Porcelanato técnico rectificado',
          proveedor: 'Ilva',
          marca: 'Ilva Porcellanato',
          modelo: 'Tribeca Grey',
          medidas: '60x120 cm',
          imagenUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
          notas: 'Transito intenso, antideslizante para áreas comunes.',
          alternativas: [
            {
              id: `alt-1-${Date.now()}`,
              numero: '01',
              titulo: 'Tribeca Grey (60x120)',
              especificacion: 'Gris mate rectificado'
            }
          ]
        }
      ],
      ultimaModificacion: new Date().toISOString(),

      // Backward compatibility fields
      brief: {
        nombre: nombre.trim() || 'Nuevo Proyecto',
        subtitulo: subtitulo.trim() || 'Desarrollo de Obra',
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim(),
        superficie: superficie.trim(),
        estadoGeneral
      },
      plazo: {
        fechaInicio: new Date().toLocaleDateString('es-AR'),
        fechaFin: '20/12/2026',
        duracionMeses: 6,
        mesActual: 1,
        avanceFisicoPonderado: 15,
        proximaEntregaOHito: proximoHito.trim() || 'Firma de replanteo'
      },
      tipoProyecto: disciplinas.join(' & ') || 'Arquitectura & Obras'
    };

    onFinish(newProject);
  };

  const getModuleIcon = (id: PortalModuleId) => {
    switch (id) {
      case 'resumen': return <Building2 className="w-4 h-4 text-bojana-success" />;
      case 'progreso': return <Clock className="w-4 h-4 text-bojana-success" />;
      case 'avances': return <Camera className="w-4 h-4 text-sky-600" />;
      case 'documentos': return <FileText className="w-4 h-4 text-bojana-ink" />;
      case 'visualizaciones': return <Layers className="w-4 h-4 text-bojana-discipline" />;
      case 'decisiones': return <CheckSquare className="w-4 h-4 text-bojana-error" />;
      case 'materiales': return <Palette className="w-4 h-4 text-bojana-success" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in">
      <div className="bojana-modal bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full max-h-[92vh] flex flex-col shadow-bojana-widget overflow-hidden animate-scale-up">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-bojana-line flex items-center justify-between bg-bojana-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-bojana-widget bg-bojana-ink text-bojana-inverse flex items-center justify-center font-sans font-medium text-xs">
              BE
            </div>
            <div>
              <div className="flex items-center gap-bojana-inside">
                <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans tracking-normal">
                  Nuevo Proyecto & Portal de Cliente
                </h3>
                <span className="text-xs font-sans text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge font-medium">
                  Asistente Guiado
                </span>
              </div>
              <p className="text-xs text-bojana-muted">
                Paso {currentStep} de {totalSteps}: {
                  currentStep === 1 ? 'Información General' :
                  currentStep === 2 ? 'Disciplinas del Proyecto' :
                  currentStep === 3 ? 'Equipo Bojana Estudio' :
                  currentStep === 4 ? 'Cliente & Credenciales de Acceso' :
                  currentStep === 5 ? 'Módulos Activos del Portal' : 'Revisión & Lanzamiento'
                }
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

        {/* STEP PROGRESS BAR */}
        <div className="w-full bg-bojana-soft h-1">
          <div
            className="bg-bojana-success h-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* STEP BODY */}
        <div className="p-6 overflow-y-auto flex-1 text-xs font-sans">

          {/* STEP 1: INFORMACIÓN GENERAL */}
          {currentStep === 1 && (
            <div className="space-y-bojana-block animate-fade-in max-w-xl mx-auto">
              <div className="text-center space-y-bojana-inside mb-5">
                <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">Información General de la Obra</h4>
                <p className="text-xs text-bojana-muted">
                  Defina el nombre e identidad que verá el cliente al ingresar a su portal.
                </p>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre del Proyecto *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Los Alisos"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-medium focus:bg-bojana-surface"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Subtítulo / Tipo de Intervención</label>
                <input
                  type="text"
                  placeholder="ej: Remodelación integral de áreas comunes"
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Ubicación</label>
                  <input
                    type="text"
                    placeholder="ej: Nordelta, Tigre"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Superficie</label>
                  <input
                    type="text"
                    placeholder="ej: 540 m²"
                    value={superficie}
                    onChange={(e) => setSuperficie(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Estado General</label>
                  <select
                    value={estadoGeneral}
                    onChange={(e) => setEstadoGeneral(e.target.value as EstadoGeneralProyecto)}
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
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Etapa Actual</label>
                  <input
                    type="text"
                    placeholder="ej: Documentación ejecutiva"
                    value={etapaActual}
                    onChange={(e) => setEtapaActual(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Próximo Hito de Obra</label>
                <input
                  type="text"
                  placeholder="ej: Inicio de obra · 18 octubre"
                  value={proximoHito}
                  onChange={(e) => setProximoHito(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>
            </div>
          )}

          {/* STEP 2: DISCIPLINAS */}
          {currentStep === 2 && (
            <div className="space-y-bojana-block animate-fade-in max-w-xl mx-auto">
              <div className="text-center space-y-bojana-inside mb-5">
                <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">Disciplinas del Proyecto</h4>
                <p className="text-xs text-bojana-muted">
                  Seleccione las disciplinas involucradas. El sistema sugerirá automáticamente los módulos recomendados.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['Arquitectura', 'Ingeniería', 'Construcción', 'Diseño'] as DisciplinaType[]).map((d) => {
                  const isChecked = disciplinas.includes(d);

                  return (
                    <div
                      key={d}
                      onClick={() => toggleDiscipline(d)}
                      className={`bojana-widget p-4 rounded-bojana-widget border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "border-bojana-line bg-bojana-surface/80 shadow-bojana-widget"
                          : "border-bojana-line hover:border-bojana-line bg-bojana-surface"
                      }`}
                    >
                      <div>
                        <h5 className="bojana-heading-component font-medium text-bojana-ink">{d}</h5>
                        <span className="text-xs text-bojana-muted block mt-0.5 font-sans">
                          {d === 'Arquitectura' && 'Resumen, Progreso, Planos, Renders, Decisiones'}
                          {d === 'Ingeniería' && 'Resumen, Documentación, Revisiones'}
                          {d === 'Construcción' && 'Resumen, Progreso, Avances fotográficos'}
                          {d === 'Diseño' && 'Visualizaciones, Materiales & Propuestas'}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-bojana-widget border flex items-center justify-center ${
                        isChecked ? "bg-bojana-ink text-bojana-inverse border-bojana-line" : "border-bojana-line"
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bojana-widget bg-bojana-soft border border-bojana-success rounded-bojana-widget p-3.5 text-xs flex items-center gap-bojana-inside">
                <Sparkles className="w-4 h-4 text-bojana-success shrink-0" />
                <span className="text-bojana-success">
                  Disciplinas activas: <strong>{disciplinas.join(', ') || 'Ninguna'}</strong>. Los módulos del portal se han pre-configurado de acuerdo a esta matriz.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: EQUIPO BOJANA ESTUDIO */}
          {currentStep === 3 && (
            <div className="space-y-bojana-block animate-fade-in max-w-xl mx-auto">
              <div className="text-center space-y-bojana-inside mb-5">
                <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">Equipo de Bojana Estudio</h4>
                <p className="text-xs text-bojana-muted">
                  Profesionales del estudio asignados como responsables técnicos en el portal.
                </p>
              </div>

              <div className="space-y-bojana-inside">
                {equipo.map((m) => (
                  <div key={m.id} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-bojana-ink block font-medium">{m.nombre}</strong>
                      <span className="text-xs text-bojana-muted font-sans">{m.rol}</span>
                      {m.email && <span className="text-xs text-bojana-muted font-sans block">{m.email}</span>}
                    </div>
                    {equipo.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEquipo(prev => prev.filter(x => x.id !== m.id))}
                        className="bojana-icon-button text-bojana-muted hover:text-bojana-error p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add form */}
              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3.5 space-y-bojana-inside">
                <span className="text-xs font-sans font-medium uppercase text-bojana-muted block">+ Agregar Integrante</span>
                <div className="grid grid-cols-3 gap-bojana-inside">
                  <input
                    type="text"
                    placeholder="Nombre..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Rol..."
                    value={newMemberRol}
                    onChange={(e) => setNewMemberRol(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bojana-field bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="bojana-button bojana-button-primary px-3 py-1 bg-bojana-ink text-bojana-inverse rounded-bojana-widget text-xs font-sans font-medium"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CLIENTE Y ACCESOS */}
          {currentStep === 4 && (
            <div className="space-y-bojana-block animate-fade-in max-w-xl mx-auto">
              <div className="text-center space-y-bojana-inside mb-5">
                <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">Cliente & Credenciales de Acceso</h4>
                <p className="text-xs text-bojana-muted">
                  Configure los datos del comitente y la modalidad de acceso a su portal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Comisión Los Alisos"
                    value={clienteNombre}
                    onChange={(e) => handleClientNameChange(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Empresa / Razón Social</label>
                  <input
                    type="text"
                    placeholder="ej: Barrio Los Alisos S.A."
                    value={clienteEmpresa}
                    onChange={(e) => setClienteEmpresa(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Email del Cliente</label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Teléfono (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="+54 9 11..."
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Usuario Asignado</label>
                  <input
                    type="text"
                    value={clienteUsuario}
                    onChange={(e) => setClienteUsuario(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
                <div>
                  <label className="font-sans text-bojana-muted font-medium block mb-1">Contraseña</label>
                  <input
                    type="text"
                    value={clientePassword}
                    onChange={(e) => setClientePassword(e.target.value)}
                    className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink font-sans"
                  />
                </div>
              </div>

              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 flex items-center justify-between">
                <div>
                  <h5 className="bojana-heading-component font-medium text-bojana-ink">Acceso Directo Sin Clave (Recomendado)</h5>
                  <p className="text-xs text-bojana-muted mt-0.5">
                    Genera un link dedicado para que el cliente acceda con 1 toque sin ingresar usuario ni password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkSinProteccion(!linkSinProteccion)}
                  className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget text-xs font-sans font-medium transition ${
                    linkSinProteccion ? "bg-bojana-success text-bojana-inverse" : "bg-bojana-soft text-bojana-ink"
                  }`}
                >
                  {linkSinProteccion ? 'Habilitado' : 'Deshabilitado'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: MÓDULOS ACTIVOS DEL PORTAL */}
          {currentStep === 5 && (
            <div className="space-y-bojana-block animate-fade-in max-w-xl mx-auto">
              <div className="text-center space-y-bojana-inside mb-5">
                <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">Módulos del Portal</h4>
                <p className="text-xs text-bojana-muted">
                  El Resumen es obligatorio. Puede activar cualquier módulo adicional para este cliente.
                </p>
              </div>

              <div className="space-y-bojana-inside">
                {modulos.map((mod) => (
                  <div
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`bojana-widget p-3.5 rounded-bojana-widget border transition flex items-center justify-between gap-3 ${
                      mod.habilitado
                        ? "bg-bojana-surface border-bojana-line shadow-bojana-widget"
                        : "bg-bojana-surface border-bojana-line opacity-60"
                    }  ${mod.esObligatorio ? "cursor-default" : "cursor-pointer hover:border-bojana-line"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-bojana-widget bg-bojana-surface border border-bojana-line flex items-center justify-center shrink-0">
                        {getModuleIcon(mod.id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-bojana-inside">
                          <strong className="text-xs font-medium text-bojana-ink">{mod.titulo}</strong>
                          {mod.esObligatorio && (
                            <span className="text-xs font-sans text-bojana-success bg-bojana-soft px-1.5 py-0.2 rounded-bojana-badge font-medium">
                              Obligatorio
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-bojana-muted mt-0.5">{mod.descripcion}</p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-bojana-widget border flex items-center justify-center shrink-0 ${
                      mod.habilitado ? "bg-bojana-success text-bojana-inverse border-bojana-success" : "border-bojana-line bg-bojana-surface"
                    }`}>
                      {mod.habilitado && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: REVISIÓN & LANZAMIENTO */}
          {currentStep === 6 && (
            <div className="space-y-bojana-block animate-fade-in max-w-xl mx-auto text-xs">
              <div className="text-center space-y-bojana-inside mb-5">
                <div className="w-12 h-12 rounded-bojana-widget bg-bojana-soft text-bojana-success flex items-center justify-center mx-auto mb-2 border border-bojana-success">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">
                  ¡Todo listo para crear el Portal!
                </h4>
                <p className="text-xs text-bojana-muted">
                  Revise el resumen final de la configuración antes del lanzamiento.
                </p>
              </div>

              <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-bojana-line">
                  <span className="font-sans text-bojana-muted uppercase">Proyecto:</span>
                  <strong className="text-bojana-ink font-medium text-sm">{nombre || 'Nuevo Proyecto'}</strong>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-bojana-line">
                  <span className="font-sans text-bojana-muted uppercase">Disciplinas:</span>
                  <span className="text-bojana-ink font-medium">{disciplinas.join(', ')}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-bojana-line">
                  <span className="font-sans text-bojana-muted uppercase">Cliente / Comitente:</span>
                  <span className="text-bojana-ink font-medium">{clienteNombre || 'Comitente'} ({clienteEmpresa || '-'})</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-bojana-line">
                  <span className="font-sans text-bojana-muted uppercase">Módulos Activos:</span>
                  <span className="text-bojana-success font-sans font-medium">
                    {modulos.filter(m => m.habilitado).length} de {modulos.length} módulos habilitados
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-sans text-bojana-muted uppercase">Acceso Directo:</span>
                  <span className="text-bojana-success font-sans font-medium">
                    {linkSinProteccion ? 'Enlace Dedicado WhatsApp Activado' : 'Solo Usuario y Clave'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-bojana-line flex items-center justify-between bg-bojana-surface/80">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="bojana-button bojana-button-secondary px-4 py-2 rounded-bojana-widget border border-bojana-line text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside hover:bg-bojana-soft transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="bojana-button bojana-button-primary px-5 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition shadow-bojana-widget"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="bojana-button bojana-button-primary px-6 py-2.5 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition shadow-bojana-widget"
            >
              <Check className="w-4 h-4" />
              <span>Crear & Lanzar Portal</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
