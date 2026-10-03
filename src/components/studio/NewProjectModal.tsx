import React, { useState, useCallback } from 'react';
import {
  ProjectData,
  DisciplinaType,
  ContractualBase,
} from '../../types';
import {
  DISCIPLINE_NEEDS_MAP,
  DEFAULT_OPERATIONAL_DISCIPLINES,
  generateEmptyOperationalDisciplines,
  getRecommendedModulesForDisciplines,
} from '../../services/storageService';
import {
  X,
  Building2,
  Users,
  AlignLeft,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  FileText,
  Check,
  Compass,
  Clock,
  Hammer,
  Palette,
} from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (newProject: ProjectData) => void;
}

interface ConfigTask {
  id: string;
  titulo: string;
  pesoPorcentaje: number;
}

interface NeedConfig {
  needId: string;
  label: string;
  discipline: DisciplinaType;
  tasks: ConfigTask[];
}

const DISCIPLINE_ICONS: Record<DisciplinaType, React.ReactNode> = {
  Arquitectura: <Compass size={15} />,
  Ingeniería: <Layers size={15} />,
  Construcción: <Hammer size={15} />,
  Diseño: <Palette size={15} />,
};

const DISCIPLINE_COLORS: Record<DisciplinaType, string> = {
  Arquitectura: 'bg-stone-100 border-stone-300 text-stone-700',
  Ingeniería: 'bg-blue-50 border-blue-200 text-blue-700',
  Construcción: 'bg-amber-50 border-amber-200 text-amber-700',
  Diseño: 'bg-rose-50 border-rose-200 text-rose-700',
};

const DISCIPLINE_ACTIVE: Record<DisciplinaType, string> = {
  Arquitectura: 'bg-stone-800 border-stone-800 text-white',
  Ingeniería: 'bg-blue-600 border-blue-600 text-white',
  Construcción: 'bg-amber-600 border-amber-600 text-white',
  Diseño: 'bg-rose-600 border-rose-600 text-white',
};

export default function NewProjectModal({ isOpen, onClose, onFinish }: NewProjectModalProps) {
  if (!isOpen) return null;

  // ── BLOQUE 1: INFORMACIÓN ────────────────────────────────
  const [nombre, setNombre] = useState('');
  const [subtituloProyecto, setSubtituloProyecto] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [superficie, setSuperficie] = useState('');

  // ── BLOQUE 2: DISCIPLINAS ────────────────────────────────
  const [disciplinas, setDisciplinas] = useState<DisciplinaType[]>([]);

  // ── BLOQUE 3: ALCANCE + PLAZO ────────────────────────────
  const [alcance, setAlcance] = useState('');
  const [plazoInicio, setPlazoInicio] = useState('');
  const [plazoFin, setPlazoFin] = useState('');

  // ── BLOQUE 4: ADN ────────────────────────────────────────
  // Map of needId → NeedConfig (only for selected needs)
  const [needConfigs, setNeedConfigs] = useState<Record<string, NeedConfig>>({});
  const [expandedNeedId, setExpandedNeedId] = useState<string | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, { titulo: string; pct: number }>>({});

  // ── BLOQUE 5: DOCS BASE ──────────────────────────────────
  const [docsBase, setDocsBase] = useState<ContractualBase['documentosBase']>([]);
  const [newDocNombre, setNewDocNombre] = useState('');
  const [newDocTipo, setNewDocTipo] = useState<'presupuesto' | 'planos_existentes' | 'documentacion_tecnica' | 'otros'>('otros');

  // ── DISCIPLINE TOGGLE ────────────────────────────────────
  const toggleDisciplina = (disc: DisciplinaType) => {
    setDisciplinas(prev => {
      if (prev.includes(disc)) {
        // Remove needs for this discipline
        const removedNeedIds = (DISCIPLINE_NEEDS_MAP[disc] || []).map(n => n.id + '_' + disc);
        setNeedConfigs(nc => {
          const copy = { ...nc };
          Object.keys(copy).forEach(k => { if (copy[k].discipline === disc) delete copy[k]; });
          return copy;
        });
        return prev.filter(d => d !== disc);
      }
      return [...prev, disc];
    });
  };

  // ── NEED TOGGLE ──────────────────────────────────────────
  const toggleNeed = (disc: DisciplinaType, needId: string, label: string) => {
    const key = needId + '_' + disc;
    setNeedConfigs(prev => {
      if (prev[key]) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      // Load default tasks from preset
      const baseDiscipline = DEFAULT_OPERATIONAL_DISCIPLINES[disc];
      const baseNeed = baseDiscipline?.necesidades.find(n => n.id === needId);
      const defaultTasks: ConfigTask[] = baseNeed?.tareas.map(t => ({
        id: t.id,
        titulo: t.titulo,
        pesoPorcentaje: t.pesoPorcentaje || Math.round(100 / (baseNeed.tareas.length || 1)),
      })) || [
        { id: `${needId}-t1`, titulo: 'Inicio', pesoPorcentaje: 50 },
        { id: `${needId}-t2`, titulo: 'Cierre', pesoPorcentaje: 50 },
      ];
      return { ...prev, [key]: { needId, label, discipline: disc, tasks: defaultTasks } };
    });
  };

  const isNeedSelected = (disc: DisciplinaType, needId: string) =>
    !!needConfigs[needId + '_' + disc];

  // ── TASK MANAGEMENT ──────────────────────────────────────
  const updateTask = (key: string, taskId: string, field: 'titulo' | 'pesoPorcentaje', value: string | number) => {
    setNeedConfigs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        tasks: prev[key].tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
      }
    }));
  };

  const removeTask = (key: string, taskId: string) => {
    setNeedConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key], tasks: prev[key].tasks.filter(t => t.id !== taskId) }
    }));
  };

  const addTask = (key: string) => {
    const input = newTaskInputs[key];
    if (!input?.titulo?.trim()) return;
    const newTask: ConfigTask = {
      id: `${key}-t${Date.now()}`,
      titulo: input.titulo.trim(),
      pesoPorcentaje: input.pct || 10,
    };
    setNeedConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key], tasks: [...prev[key].tasks, newTask] }
    }));
    setNewTaskInputs(prev => ({ ...prev, [key]: { titulo: '', pct: 10 } }));
  };

  const getTotalPct = (key: string) =>
    needConfigs[key]?.tasks.reduce((s, t) => s + (t.pesoPorcentaje || 0), 0) ?? 0;

  // ── ADD DOC ──────────────────────────────────────────────
  const addDoc = () => {
    if (!newDocNombre.trim()) return;
    setDocsBase(prev => [...(prev || []), {
      id: `doc-${Date.now()}`,
      nombre: newDocNombre.trim(),
      tipo: newDocTipo,
      fecha: new Date().toISOString().split('T')[0],
    }]);
    setNewDocNombre('');
  };

  // ── BUILD & SUBMIT ───────────────────────────────────────
  const canCreate = nombre.trim().length > 0 && disciplinas.length > 0;

  const handleCreate = () => {
    const projectId = `proj-${Date.now()}`;
    const token = `${nombre.toLowerCase().replace(/[^a-z0-9]/g, '') || 'portal'}-${Math.random().toString(36).substring(2, 6)}`;

    // Build selected needs config for the engine
    const selectedNeedsConfig = (Object.values(needConfigs) as NeedConfig[]).map(nc => ({
      needId: nc.needId,
      discipline: nc.discipline,
      label: nc.label,
      tasks: nc.tasks,
    }));

    const emptyDisciplines = generateEmptyOperationalDisciplines(disciplinas, selectedNeedsConfig);
    const recModules = getRecommendedModulesForDisciplines(disciplinas);

    const newProject: ProjectData = {
      id: projectId,
      lifecycleStatus: 'BORRADOR',
      baseContractual: {
        alcance: alcance.trim() || 'Por definir',
        presupuestoAprobado: true,
        fechaPresupuestoAprobado: new Date().toISOString().split('T')[0],
        plazoInicio: plazoInicio || '',
        plazoFin: plazoFin || '',
        documentosBase: docsBase || [],
      },
      info: {
        nombre: nombre.trim(),
        subtitulo: subtituloProyecto.trim() || disciplinas.join(' · '),
        descripcion: alcance.trim() || '',
        ubicacion: ubicacion.trim() || '',
        superficie: superficie.trim() || '',
        estadoGeneral: 'En Planificación',
        etapaActual: 'Configuración inicial',
        proximoHito: '',
        ultimaActualizacion: 'Hoy',
        fechaInicio: plazoInicio || '',
        fechaFin: plazoFin || '',
        publicado: false,
        portalPublicado: false,
        cambiosSinPublicar: 0,
        ultimaPublicacion: '',
      },
      disciplinas,
      disciplinasOperativas: emptyDisciplines,
      progresoTotalCalculado: 0,
      equipo: [
        { id: 'eq-1', nombre: 'Bojana Estudio', rol: 'Dirección General de Proyecto', email: 'contacto@bojanaestudio.com', telefono: '' }
      ],
      cliente: {
        nombre: clienteNombre.trim() || '',
        empresa: clienteNombre.trim() || '',
        email: clienteEmail.trim() || '',
        telefono: '',
        usuario: clienteNombre.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cliente',
        password: 'bojana2026',
        linkSinProteccion: true,
        dedicatedToken: token,
        personas: clienteEmail.trim() ? [{
          id: 'cp-1',
          nombre: clienteNombre.trim() || 'Contacto principal',
          email: clienteEmail.trim(),
          accesoPortal: true,
        }] : [],
      },
      hitosInternos: [],
      actividadReciente: [
        { id: 'act-init', fecha: 'Hoy', descripcion: 'Proyecto creado en el sistema', autor: 'Bojana Estudio' }
      ],
      modulos: recModules,
      progreso: [],
      avances: [],
      documentos: [],
      visualizaciones: { galeria: [], tours: [] },
      decisiones: [],
      materiales: [],
      ultimaModificacion: new Date().toISOString(),
    };

    onFinish(newProject);
  };

  // ── UI ───────────────────────────────────────────────────
  const allDisciplines: DisciplinaType[] = ['Arquitectura', 'Ingeniería', 'Construcción', 'Diseño'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-stone-200 overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Bojana Estudio</p>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Nuevo Proyecto</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
            <X size={20} />
          </button>
        </div>

        <div className="px-7 py-6 space-y-8">

          {/* ════════════════════════════════════════════════
              BLOQUE 1 — INFORMACIÓN
          ════════════════════════════════════════════════ */}
          <section>
            <SectionLabel icon={<Building2 size={14} />} label="Información" />
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldLabel>Nombre del proyecto</FieldLabel>
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    placeholder="Los Alisos — Remodelación integral"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Subtítulo <span className="text-stone-300 font-normal">opcional</span></FieldLabel>
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    placeholder="Remodelación integral de áreas comunes"
                    value={subtituloProyecto}
                    onChange={e => setSubtituloProyecto(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Cliente / Comitente</FieldLabel>
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    placeholder="Consorcio Los Alisos"
                    value={clienteNombre}
                    onChange={e => setClienteNombre(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Email del cliente</FieldLabel>
                  <input
                    type="email"
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    placeholder="cliente@email.com"
                    value={clienteEmail}
                    onChange={e => setClienteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Ubicación <span className="text-stone-300 font-normal">opcional</span></FieldLabel>
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    placeholder="Nordelta, Tigre"
                    value={ubicacion}
                    onChange={e => setUbicacion(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Superficie <span className="text-stone-300 font-normal">opcional</span></FieldLabel>
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    placeholder="540 m²"
                    value={superficie}
                    onChange={e => setSuperficie(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <Divider />

          {/* ════════════════════════════════════════════════
              BLOQUE 2 — DISCIPLINAS
          ════════════════════════════════════════════════ */}
          <section>
            <SectionLabel icon={<Layers size={14} />} label="Disciplinas" />
            <p className="text-xs text-stone-400 mt-1 mb-3">Seleccioná las disciplinas que abarca este proyecto.</p>
            <div className="flex flex-wrap gap-2">
              {allDisciplines.map(disc => {
                const active = disciplinas.includes(disc);
                return (
                  <button
                    key={disc}
                    onClick={() => toggleDisciplina(disc)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${active ? DISCIPLINE_ACTIVE[disc] : DISCIPLINE_COLORS[disc]} cursor-pointer`}
                  >
                    {active && <Check size={13} />}
                    {DISCIPLINE_ICONS[disc]}
                    {disc}
                  </button>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* ════════════════════════════════════════════════
              BLOQUE 3 — ALCANCE + PLAZO
          ════════════════════════════════════════════════ */}
          <section>
            <SectionLabel icon={<AlignLeft size={14} />} label="Alcance" />
            <div className="space-y-3 mt-3">
              <div>
                <FieldLabel>Descripción del alcance</FieldLabel>
                <textarea
                  rows={3}
                  className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white resize-none"
                  placeholder="Servicios incluidos, alcance acordado con el comitente..."
                  value={alcance}
                  onChange={e => setAlcance(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Plazo inicio</FieldLabel>
                  <input
                    type="date"
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    value={plazoInicio}
                    onChange={e => setPlazoInicio(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Plazo fin</FieldLabel>
                  <input
                    type="date"
                    className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                    value={plazoFin}
                    onChange={e => setPlazoFin(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <Divider />

          {/* ════════════════════════════════════════════════
              BLOQUE 4 — ADN DEL PROYECTO
          ════════════════════════════════════════════════ */}
          <section>
            <SectionLabel icon={<Compass size={14} />} label="ADN del proyecto" />
            <p className="text-xs text-stone-400 mt-1 mb-3">
              Seleccioná las necesidades de cada disciplina. Podés editar las tareas y su peso (%).
            </p>

            {disciplinas.length === 0 && (
              <div className="py-6 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50">
                <p className="text-sm text-stone-400">Seleccioná al menos una disciplina para configurar el ADN.</p>
              </div>
            )}

            {disciplinas.map(disc => {
              const needs = DISCIPLINE_NEEDS_MAP[disc] || [];
              return (
                <div key={disc} className="mb-5">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-2 ${DISCIPLINE_COLORS[disc]}`}>
                    {DISCIPLINE_ICONS[disc]}
                    {disc}
                  </div>
                  <div className="space-y-2">
                    {needs.map(need => {
                      const key = need.id + '_' + disc;
                      const selected = isNeedSelected(disc, need.id);
                      const expanded = expandedNeedId === key;
                      const tasks = needConfigs[key]?.tasks || [];
                      const totalPct = getTotalPct(key);

                      return (
                        <div key={need.id} className={`border rounded-xl overflow-hidden transition-all ${selected ? 'border-stone-300 bg-white shadow-sm' : 'border-stone-100 bg-stone-50'}`}>
                          {/* Need header row */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            <button
                              onClick={() => toggleNeed(disc, need.id, need.label)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-stone-800 border-stone-800' : 'border-stone-300 bg-white'}`}
                            >
                              {selected && <Check size={11} className="text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${selected ? 'text-stone-800' : 'text-stone-500'}`}>{need.label}</p>
                              <p className="text-xs text-stone-400 truncate">{need.descripcion}</p>
                            </div>
                            {selected && (
                              <button
                                onClick={() => setExpandedNeedId(expanded ? null : key)}
                                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100"
                              >
                                <span>{tasks.length} tareas</span>
                                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            )}
                          </div>

                          {/* Expanded tasks */}
                          {selected && expanded && (
                            <div className="border-t border-stone-100 bg-stone-50/80 px-4 py-3 space-y-2">
                              {/* Task list */}
                              {tasks.map((task, idx) => (
                                <div key={task.id} className="flex items-center gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
                                  <span className="text-xs text-stone-300 font-mono w-4">{idx + 1}</span>
                                  <input
                                    className="flex-1 text-xs text-stone-700 bg-transparent focus:outline-none min-w-0"
                                    value={task.titulo}
                                    onChange={e => updateTask(key, task.id, 'titulo', e.target.value)}
                                  />
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <input
                                      type="number"
                                      min={1}
                                      max={100}
                                      className="w-12 text-xs text-center border border-stone-200 rounded-md py-1 bg-white focus:outline-none focus:ring-1 focus:ring-stone-300"
                                      value={task.pesoPorcentaje}
                                      onChange={e => updateTask(key, task.id, 'pesoPorcentaje', parseInt(e.target.value) || 0)}
                                    />
                                    <span className="text-xs text-stone-400">%</span>
                                    <button onClick={() => removeTask(key, task.id)} className="text-stone-300 hover:text-red-400 transition-colors ml-1">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Total percentage indicator */}
                              <div className={`flex items-center justify-between px-1 py-1 text-xs ${totalPct === 100 ? 'text-emerald-600' : totalPct > 100 ? 'text-red-500' : 'text-amber-600'}`}>
                                <span>Total: <strong>{totalPct}%</strong></span>
                                {totalPct !== 100 && <span className="text-stone-400">(debe sumar 100%)</span>}
                                {totalPct === 100 && <Check size={12} />}
                              </div>

                              {/* Add task row */}
                              <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                                <input
                                  className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-stone-300 text-stone-700 placeholder-stone-300"
                                  placeholder="Nueva tarea..."
                                  value={newTaskInputs[key]?.titulo || ''}
                                  onChange={e => setNewTaskInputs(prev => ({ ...prev, [key]: { ...prev[key], titulo: e.target.value, pct: prev[key]?.pct ?? 10 } }))}
                                  onKeyDown={e => { if (e.key === 'Enter') addTask(key); }}
                                />
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  className="w-12 text-xs text-center border border-stone-200 rounded-lg py-2 bg-white focus:outline-none focus:ring-1 focus:ring-stone-300"
                                  placeholder="10"
                                  value={newTaskInputs[key]?.pct ?? ''}
                                  onChange={e => setNewTaskInputs(prev => ({ ...prev, [key]: { ...prev[key], pct: parseInt(e.target.value) || 0, titulo: prev[key]?.titulo || '' } }))}
                                />
                                <span className="text-xs text-stone-400">%</span>
                                <button
                                  onClick={() => addTask(key)}
                                  className="flex items-center gap-1 text-xs bg-stone-800 text-white rounded-lg px-2.5 py-2 hover:bg-stone-700 transition-colors"
                                >
                                  <Plus size={12} /> Agregar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>

          <Divider />

          {/* ════════════════════════════════════════════════
              BLOQUE 5 — INFORMACIÓN INICIAL
          ════════════════════════════════════════════════ */}
          <section>
            <SectionLabel icon={<FileText size={14} />} label="Información inicial" />
            <p className="text-xs text-stone-400 mt-1 mb-3">
              Presupuesto aprobado, documentación técnica, planos existentes u otros archivos de base.
            </p>

            {(docsBase || []).length > 0 && (
              <div className="space-y-2 mb-3">
                {(docsBase || []).map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-lg px-3.5 py-2.5">
                    <FileText size={14} className="text-stone-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 font-medium truncate">{doc.nombre}</p>
                      <p className="text-xs text-stone-400 capitalize">{doc.tipo.replace(/_/g, ' ')}</p>
                    </div>
                    <button
                      onClick={() => setDocsBase(prev => (prev || []).filter(d => d.id !== doc.id))}
                      className="text-stone-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <select
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2.5 bg-white text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300 flex-shrink-0"
                value={newDocTipo}
                onChange={e => setNewDocTipo(e.target.value as any)}
              >
                <option value="presupuesto">Presupuesto</option>
                <option value="planos_existentes">Planos existentes</option>
                <option value="documentacion_tecnica">Doc. técnica</option>
                <option value="otros">Otros</option>
              </select>
              <input
                className="flex-1 text-sm border border-stone-200 rounded-lg px-3.5 py-2.5 bg-white text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-300"
                placeholder="Nombre del documento..."
                value={newDocNombre}
                onChange={e => setNewDocNombre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addDoc(); }}
              />
              <button
                onClick={addDoc}
                className="flex items-center gap-1.5 text-sm bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg px-3 py-2.5 transition-colors flex-shrink-0"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>
          </section>

        </div>

        {/* ── FOOTER ── */}
        <div className="px-7 py-5 border-t border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div>
            {!canCreate && (
              <p className="text-xs text-stone-400">
                {!nombre.trim() ? 'Ingresá el nombre del proyecto.' : 'Seleccioná al menos una disciplina.'}
              </p>
            )}
            {canCreate && (
              <p className="text-xs text-stone-500">
                <span className="font-medium text-stone-700">{nombre.trim()}</span>
                {disciplinas.length > 0 && <span className="text-stone-400"> · {disciplinas.join(', ')}</span>}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${canCreate ? 'bg-stone-900 text-white hover:bg-stone-700 shadow-sm' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
            >
              Crear proyecto
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── SMALL HELPERS ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-stone-400">{icon}</span>
      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">{label}</h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-stone-500 mb-1">{children}</label>;
}

function Divider() {
  return <hr className="border-stone-100" />;
}
