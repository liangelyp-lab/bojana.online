import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, Plus } from "lucide-react";
import type {
  ClientContactPerson,
  ContractualBase,
  DisciplinaType,
  ExecutionTask,
  InternalMilestone,
  ProjectData,
  TaskContentType,
  TeamMember,
} from "../../types";
import {
  DISCIPLINE_NEEDS_MAP,
  generateEmptyOperationalDisciplines,
  generateWorkflowFromDNA,
  getRecommendedModulesForDisciplines,
} from "../../services/storageService";
import {
  getClientProjectSequence,
  hasDependencyCycle,
} from "../../services/projectStructure";
import { Button, Field as DesignSystemField, ModalTabs, SelectControl } from "../ui/DesignSystem";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (project: ProjectData) => void;
  initialProject?: ProjectData;
}
interface Need {
  id: string;
  nombre: string;
  disciplina: DisciplinaType;
  pesoPorcentaje?: number;
  visibleCliente?: boolean;
  tiposContenido: TaskContentType[];
  tareas: ExecutionTask[];
}
interface Draft {
  nombre: string;
  subtitulo: string;
  cliente: string;
  email: string;
  telefono: string;
  ubicacion: string;
  superficie: string;
  tipo: string;
  portada: string;
  proposito: string;
  alcance: string;
  fueraDeAlcance: string;
  inicio: string;
  fin: string;
  disciplinas: DisciplinaType[];
  equipo: TeamMember[];
  contactos: ClientContactPerson[];
  necesidades: Need[];
  hitos: InternalMilestone[];
  documentos: NonNullable<ContractualBase["documentosBase"]>;
  siguiente: string;
  detalleSiguiente: string;
  tareaSiguiente: string;
  actorSiguiente: "estudio" | "cliente";
}
// Versionamos la clave para no recuperar borradores de demostración creados
// antes de que el wizard empezara a abrirse completamente vacío.
const DRAFT_KEY = "BOJANA_CREATE_PROJECT_DNA_V3";
const LEGACY_DRAFT_KEY = "BOJANA_CREATE_PROJECT_DNA_V2";
const disciplines: DisciplinaType[] = [
  "Arquitectura",
  "Ingeniería",
  "Diseño",
  "Construcción",
];
const deliverableOptions: [TaskContentType, string][] = [
  ["archivo", "Documentos"],
  ["imagenes", "Imágenes"],
  ["videos", "Videos"],
];
const emptyDraft = (): Draft => ({
  nombre: "",
  subtitulo: "",
  cliente: "",
  email: "",
  telefono: "",
  ubicacion: "",
  superficie: "",
  tipo: "",
  portada: "",
  proposito: "",
  alcance: "",
  fueraDeAlcance: "",
  inicio: "",
  fin: "",
  disciplinas: [],
  equipo: [],
  contactos: [],
  necesidades: [],
  hitos: [],
  documentos: [],
  siguiente: "",
  detalleSiguiente: "",
  tareaSiguiente: "",
  actorSiguiente: "estudio",
});
const uid = () => crypto.randomUUID();
const fieldClass =
  "bojana-control w-full min-w-0 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-faint disabled:bg-stone/50 disabled:cursor-not-allowed";
const secondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-stone hover:border-line-strong active:scale-95 transition cursor-pointer";

const projectToDraft = (project: ProjectData): Draft => ({
  nombre: project.info?.nombre || "",
  subtitulo: project.info?.subtitulo || "",
  cliente: project.cliente?.nombre || project.cliente?.empresa || "",
  email: project.cliente?.email || "",
  telefono: project.cliente?.telefono || "",
  ubicacion: project.info?.ubicacion || "",
  superficie: project.info?.superficie || "",
  tipo: project.info?.tipoProyecto || "",
  portada: project.info?.portadaUrl || "",
  proposito: project.info?.descripcion || "",
  alcance: project.baseContractual?.alcance || "",
  fueraDeAlcance: project.baseContractual?.fueraDeAlcance || "",
  inicio: project.info?.fechaInicio || "",
  fin: project.info?.fechaFin || "",
  disciplinas: project.disciplinas || (project.disciplinasOperativas || []).map((discipline) => discipline.id),
  equipo: project.equipo || [],
  contactos: project.cliente?.personas || [],
  necesidades: (project.disciplinasOperativas || []).flatMap((discipline) => discipline.necesidades.map((need) => ({
    id: need.id,
    nombre: need.nombre,
    disciplina: discipline.id,
    pesoPorcentaje: need.pesoPorcentaje ?? 100,
    visibleCliente: need.visibleCliente !== false,
    tiposContenido: Array.from(new Set(need.tareas.flatMap((task) => task.tiposContenido || ['archivo']))) as TaskContentType[],
    tareas: need.tareas.map((task) => ({ ...task, pesoPorcentaje: task.pesoPorcentaje ?? 100, tiposContenido: task.tiposContenido || ['archivo'] })),
  }))),
  hitos: project.hitosInternos || [],
  documentos: project.baseContractual?.documentosBase || [],
  siguiente: project.dna?.siguienteAccion?.titulo || project.siguienteAccionRecomendada?.titulo || "",
  detalleSiguiente: project.dna?.siguienteAccion?.descripcion || "",
  tareaSiguiente: project.dna?.siguienteAccion?.targetTaskId || "",
  actorSiguiente: "estudio",
});

export default function NewProjectModal(props: Props) {
  useEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
    if (!props.isOpen && window.location.hash.startsWith("#creation-")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [props.isOpen]);

  return props.isOpen ? <ProjectCreationForm {...props} /> : null;
}

function ProjectCreationForm({ onClose, onFinish, initialProject }: Props) {
  const creationSections = [
    "Identidad",
    "Alcance",
    "Personas",
    "Trabajo",
    "Siguiente acción",
    "Documentos",
    "Revisión",
  ];
  const [activeSection, setActiveSection] = useState(() => {
    const index = Number(window.location.hash.replace('#creation-', ''));
    return creationSections[index] || creationSections[0];
  });
  const [draft, setDraft] = useState<Draft>(() => {
    if (initialProject) return projectToDraft(initialProject);
    try {
      localStorage.removeItem(LEGACY_DRAFT_KEY);
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? { ...emptyDraft(), ...JSON.parse(saved) } : emptyDraft();
    } catch {
      return emptyDraft();
    }
  });
  const [notice, setNotice] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingScrollTopRef = useRef<number | null>(null);
  const pendingWindowScrollYRef = useRef<number | null>(null);
  useEffect(() => {
    const currentHash = window.location.hash;
    if (!currentHash.startsWith("#creation-")) {
      window.history.replaceState(null, "", "#creation-0");
    }
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    formRef.current?.querySelector<HTMLElement>("input")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
      if (window.location.hash.startsWith("#creation-")) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
  }, []);

  useEffect(() => {
    if (!editingStageId) return;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-stage-editor="true"]')) return;
      setEditingStageId(null);
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [editingStageId]);

  useLayoutEffect(() => {
    const scrollTop = pendingScrollTopRef.current;
    const windowScrollY = pendingWindowScrollYRef.current;
    if (scrollTop === null && windowScrollY === null) return;

    if (scrollTop !== null && contentRef.current) contentRef.current.scrollTop = scrollTop;
    if (windowScrollY !== null) window.scrollTo({ top: windowScrollY, behavior: "auto" });
    // Keep the position after the browser has applied the new field layout and
    // after focus/scroll anchoring has had a chance to run.
    const firstFrame = requestAnimationFrame(() => {
      if (scrollTop !== null && contentRef.current) contentRef.current.scrollTop = scrollTop;
      if (windowScrollY !== null) window.scrollTo({ top: windowScrollY, behavior: "auto" });
      requestAnimationFrame(() => {
        if (scrollTop !== null && contentRef.current) contentRef.current.scrollTop = scrollTop;
        if (windowScrollY !== null) window.scrollTo({ top: windowScrollY, behavior: "auto" });
      });
    });
    pendingScrollTopRef.current = null;
    pendingWindowScrollYRef.current = null;

    return () => cancelAnimationFrame(firstFrame);
  }, [draft]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    const scrollTop = contentRef.current?.scrollTop ?? 0;
    pendingScrollTopRef.current = scrollTop;
    pendingWindowScrollYRef.current = window.scrollY;
    setDraft((prev) => ({ ...prev, [key]: value }));
  };
  const tasks = draft.necesidades.flatMap((n) => n.tareas);
  const updateNeed = (id: string, update: Partial<Need>) =>
    set(
      "necesidades",
      draft.necesidades.map((n) => (n.id === id ? { ...n, ...update } : n)),
    );
  const updateTask = (need: Need, id: string, update: Partial<ExecutionTask>) =>
    updateNeed(need.id, {
      tareas: need.tareas.map((t) => (t.id === id ? { ...t, ...update } : t)),
    });
  const updateTaskStageCount = (need: Need, task: ExecutionTask, count: number) => {
    const nextCount = Math.max(0, Math.floor(count) || 0);
    const currentStages = task.subetapas || [];
    const baseWeight = nextCount > 0 ? Math.floor(100 / nextCount) : 0;
    const nextStages = Array.from({ length: nextCount }, (_, index) =>
      currentStages[index] || {
        id: uid(),
        label: `Etapa ${index + 1}`,
        completada: false,
        pesoPorcentaje: 0,
      },
    ).map((stage, index) => ({
      ...stage,
      pesoPorcentaje: nextCount === 0
        ? 0
        : index === nextCount - 1
          ? 100 - baseWeight * (nextCount - 1)
          : baseWeight,
    }));
    updateTask(need, task.id, {
      etapasActivas: nextCount > 0,
      subetapas: nextStages,
    });
  };
  const removeTask = (need: Need, id: string) => {
    setDraft((prev) => ({
      ...prev,
      tareaSiguiente: prev.tareaSiguiente === id ? "" : prev.tareaSiguiente,
      necesidades: prev.necesidades.map((n) => ({
        ...n,
        tareas: n.tareas
          .filter((t) => t.id !== id)
          .map((t) => ({
            ...t,
            dependencias: t.dependencias?.filter((dep) => dep !== id),
          })),
      })),
    }));
  };
  const addNeed = (
    disciplina: DisciplinaType,
    preset?: { id: string; label: string },
  ) => {
    set("necesidades", [
      ...draft.necesidades,
      {
        id: preset ? `${disciplina}-${preset.id}` : uid(),
        nombre: preset?.label || "",
        disciplina,
        pesoPorcentaje: 100,
        visibleCliente: true,
        tiposContenido: ['archivo'],
        tareas: [],
      },
    ]);
  };
  const makeProject = (): ProjectData => {
    const id = initialProject?.id || uid();
    const operational = generateEmptyOperationalDisciplines(
      draft.disciplinas,
      draft.necesidades.map((n) => ({
        needId: n.id,
        label: n.nombre.trim(),
        discipline: n.disciplina,
        pesoPorcentaje: n.pesoPorcentaje,
        visibleCliente: n.visibleCliente,
        tasks: n.tareas.map((t) => ({
          ...t,
          tiposContenido: n.tiposContenido || ['archivo'],
          subetapas: t.etapasActivas === false ? undefined : t.subetapas,
          titulo: t.titulo.trim(),
          etapa: t.etapa?.trim(),
          accionCliente:
            draft.actorSiguiente === "cliente" && draft.tareaSiguiente === t.id
              ? {
                  id: uid(),
                  activa: true,
                  tipo: "confirmar_decision",
                  titulo: draft.siguiente.trim(),
                  mensaje: draft.detalleSiguiente.trim(),
                  accionRequeridaTexto: "Responder",
                  bloquearSiguientesEtapas: true,
                  estado: "pendiente",
                }
              : undefined,
        })),
      })),
    );
    const needs = draft.necesidades.map((n) => {
      const preset = DISCIPLINE_NEEDS_MAP[n.disciplina].find(
        (p) => `${n.disciplina}-${p.id}` === n.id,
      );
      return preset?.id || n.id;
    });
    const project: ProjectData = {
      ...(initialProject || {} as ProjectData),
      id,
      lifecycleStatus: initialProject?.lifecycleStatus || "BORRADOR",
      progresoTotalCalculado: initialProject?.progresoTotalCalculado || 0,
      ultimaModificacion: new Date().toISOString(),
      info: {
        nombre: draft.nombre.trim(),
        subtitulo: draft.subtitulo.trim(),
        descripcion: draft.proposito.trim(),
        tipoProyecto: draft.tipo.trim(),
        portadaUrl: draft.portada.trim(),
        ubicacion: draft.ubicacion.trim(),
        superficie: draft.superficie.trim(),
        estadoGeneral: "En Planificación",
        etapaActual: "",
        proximoHito: draft.hitos[0]?.nombre || "",
        ultimaActualizacion: "Hoy",
        fechaInicio: draft.inicio,
        fechaFin: draft.fin,
        publicado: initialProject?.info?.publicado || false,
        portalPublicado: initialProject?.info?.portalPublicado || false,
        cambiosSinPublicar: initialProject?.info?.cambiosSinPublicar || 0,
      },
      baseContractual: {
        alcance: draft.alcance.trim(),
        fueraDeAlcance: draft.fueraDeAlcance.trim(),
        presupuestoAprobado: true,
        plazoInicio: draft.inicio,
        plazoFin: draft.fin,
        documentosBase: draft.documentos,
      },
      disciplinas: draft.disciplinas,
      disciplinasOperativas: operational,
      equipo: draft.equipo,
      cliente: {
        nombre: draft.cliente.trim(),
        empresa: draft.cliente.trim(),
        email: draft.email.trim(),
        telefono: draft.telefono.trim(),
        usuario: "",
        linkSinProteccion: true,
        dedicatedToken: uid(),
        personas: draft.contactos,
      },
      dna: {
        necesidades: needs,
        pasosWorkflow: generateWorkflowFromDNA(draft.disciplinas, needs).map(
          (step) => ({ ...step, completado: step.id !== "publicar" }),
        ),
        siguienteAccion: {
          titulo: draft.siguiente.trim(),
          descripcion: draft.detalleSiguiente.trim(),
          ctaTexto: "Ver tarea",
          targetStepId: "operacion",
          targetTaskId: draft.tareaSiguiente || undefined,
        },
      },
      siguienteAccionRecomendada: {
        titulo: draft.siguiente.trim(),
        accionCta: "Ver tarea",
        targetStepId: draft.tareaSiguiente || "operacion",
      },
      hitosInternos: draft.hitos,
      actividadReciente: initialProject?.actividadReciente || [],
      modulos: getRecommendedModulesForDisciplines(draft.disciplinas),
      progreso: initialProject?.progreso || [],
      avances: initialProject?.avances || [],
      documentos: initialProject?.documentos || [],
      visualizaciones: initialProject?.visualizaciones || { galeria: [], tours: [] },
      decisiones: initialProject?.decisiones || [],
      materiales: initialProject?.materiales || [],
    };
    project.info.etapaActual =
      getClientProjectSequence(project)[0]?.nombre || "";
    return project;
  };
  const finish = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.disciplinas.length) {
      setNotice("Seleccioná al menos una disciplina.");
      const target = document.getElementById("creation-disciplines");
      if (target && contentRef.current) contentRef.current.scrollTo({ top: target.offsetTop - 24, behavior: "smooth" });
      return;
    }
    if (draft.inicio && draft.fin && draft.fin < draft.inicio) {
      setNotice("La fecha de fin debe ser igual o posterior al inicio.");
      return;
    }
    if (
      draft.actorSiguiente === "cliente" &&
      !tasks.some((t) => t.id === draft.tareaSiguiente && t.visibleCliente)
    ) {
      setNotice("Asociá la acción del cliente a una tarea visible.");
      return;
    }
    if (
      draft.equipo.some((m) => !m.nombre.trim()) ||
      draft.contactos.some((c) => !c.nombre.trim() || !c.email.trim())
    ) {
      setNotice("Completá los integrantes y contactos que agregaste.");
      return;
    }
    if (hasDependencyCycle(tasks)) {
      setNotice(
        "Las dependencias forman un ciclo. Corregí el orden de trabajo antes de crear.",
      );
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    onFinish(makeProject());
  };
  const activeSectionIndex = creationSections.indexOf(activeSection);
  const isLastSection = activeSectionIndex === creationSections.length - 1;
  const goToNextSection = () => {
    const nextSection = creationSections[activeSectionIndex + 1];
    if (!nextSection) return;
    setActiveSection(nextSection);
    window.history.replaceState(null, "", `#creation-${activeSectionIndex + 1}`);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const sequence = getClientProjectSequence({
    disciplinasOperativas: generateEmptyOperationalDisciplines(
      draft.disciplinas,
      draft.necesidades.map((need) => ({
        needId: need.id,
        label: need.nombre,
        discipline: need.disciplina,
        tasks: need.tareas,
      })),
    ),
    progreso: [],
  } as unknown as ProjectData);

  return (
    <div
      className="bojana-project-editor-overlay fixed inset-0 z-50 flex h-dvh items-center justify-center overflow-hidden overscroll-none bg-black/50 px-3 py-4 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
        if (event.key === "Tab") {
          const elements: HTMLElement[] = Array.from(
            formRef.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input, select, textarea, a[href]",
            ) || [],
          );
          const first = elements[0],
            last = elements.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <form
        ref={formRef}
        onSubmit={finish}
        role="dialog"
        aria-modal="true"
        aria-labelledby="creation-title"
        className="bojana-project-editor grid min-h-0 w-full max-w-bojana-modal overflow-hidden rounded-bojana-widget border border-line bg-bojana-canvas text-bojana-ink shadow-bojana-widget"
      >
        <header className="flex justify-between items-start gap-4 border-b border-line p-6 sm:px-8 bg-white/70 backdrop-blur-sm">
          <div>
            <h2 id="creation-title" className="font-display text-2xl sm:text-3xl font-normal text-ink mt-1">
              {initialProject ? "Editar proyecto" : "Crear proyecto"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-bojana-muted">
              {initialProject ? "Actualizá el alcance, los pesos y la estructura de trabajo." : "Configurá todo el ADN a partir del alcance aprobado."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar creación"
            onClick={onClose}
            className="bojana-icon-button"
          >
            <X className="size-4" />
          </button>
        </header>
        <ModalTabs
          ariaLabel="Secciones del ADN del proyecto"
          activeTab={activeSection}
          onChange={(name) => {
            if (!initialProject) return;
            setActiveSection(name);
            const sectionIndex = creationSections.indexOf(name);
            window.history.replaceState(null, "", `#creation-${sectionIndex}`);
            contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          tabs={creationSections.map((name) => ({ id: name, label: name }))}
        />
        <div ref={contentRef} className="min-h-0 flex-1 overscroll-contain overflow-y-auto [overflow-anchor:none] p-5 sm:p-8 space-y-bojana-block">
          {activeSection === creationSections[0] && <Section index={0} title="Identidad y propósito">
            <div className="grid sm:grid-cols-2 gap-bojana-block">
              <Field
                label="Nombre del proyecto"
                value={draft.nombre}
                onChange={(v) => set("nombre", v)}
                required
              />
              <Field
                label="Tipo de proyecto"
                value={draft.tipo}
                onChange={(v) => set("tipo", v)}
              />
              <Field
                label="Subtítulo"
                value={draft.subtitulo}
                onChange={(v) => set("subtitulo", v)}
              />
              <Field
                label="Ubicación"
                value={draft.ubicacion}
                onChange={(v) => set("ubicacion", v)}
              />
              <Field
                label="Superficie"
                value={draft.superficie}
                onChange={(v) => set("superficie", v)}
              />
              <Field
                label="Enlace de portada"
                value={draft.portada}
                type="url"
                onChange={(v) => set("portada", v)}
              />
            </div>
            <Field
              label="Propósito — resultado esperado"
              value={draft.proposito}
              onChange={(v) => set("proposito", v)}
              multiline
              required
            />
          </Section>}
          {activeSection === creationSections[1] && <Section index={1} title="Alcance y plazo">
            <Field
              label="Qué incluye el alcance aprobado"
              value={draft.alcance}
              onChange={(v) => set("alcance", v)}
              multiline
              required
            />
            <Field
              label="Qué queda fuera del alcance"
              value={draft.fueraDeAlcance}
              onChange={(v) => set("fueraDeAlcance", v)}
              multiline
            />
            <div className="grid sm:grid-cols-2 gap-bojana-block">
              <Field
                label="Inicio estimado (opcional)"
                value={draft.inicio}
                type="date"
                onChange={(v) => set("inicio", v)}
              />
              <Field
                label="Fin estimado (opcional)"
                value={draft.fin}
                type="date"
                onChange={(v) => set("fin", v)}
              />
            </div>
            {draft.hitos.map((h, i) => (
              <div
                key={h.id}
                className="grid sm:grid-cols-[1fr_180px_auto] gap-bojana-inside"
              >
                <Field
                  label="Hito"
                  value={h.nombre}
                  onChange={(v) =>
                    set(
                      "hitos",
                      draft.hitos.map((x) =>
                        x.id === h.id ? { ...x, nombre: v } : x,
                      ),
                    )
                  }
                  required
                />
                <Field
                  label="Fecha estimada"
                  type="date"
                  value={h.fecha}
                  onChange={(v) =>
                    set(
                      "hitos",
                      draft.hitos.map((x) =>
                        x.id === h.id ? { ...x, fecha: v } : x,
                      ),
                    )
                  }
                />
                <Remove
                  label={`Quitar hito ${i + 1}`}
                  onClick={() =>
                    set(
                      "hitos",
                      draft.hitos.filter((x) => x.id !== h.id),
                    )
                  }
                />
              </div>
            ))}
            <Add
              label="Agregar hito"
              onClick={() =>
                set("hitos", [
                  ...draft.hitos,
                  { id: uid(), nombre: "", fecha: "" },
                ])
              }
            />
          </Section>}
          {activeSection === creationSections[2] && <Section index={2} title="Personas">
            <div className="grid sm:grid-cols-3 gap-bojana-block">
              <Field
                label="Cliente / comitente"
                value={draft.cliente}
                required
                onChange={(v) => set("cliente", v)}
              />
              <Field
                label="Email del cliente"
                type="email"
                value={draft.email}
                onChange={(v) => set("email", v)}
              />
              <Field
                label="Teléfono"
                value={draft.telefono}
                onChange={(v) => set("telefono", v)}
              />
            </div>
            <p className="text-sm leading-6 text-bojana-muted">
              Equipo y responsables del estudio
            </p>
            {draft.equipo.map((m) => (
              <div
                key={m.id}
                className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-bojana-inside"
              >
                <Field
                  label="Nombre"
                  value={m.nombre}
                  required
                  onChange={(v) =>
                    set(
                      "equipo",
                      draft.equipo.map((x) =>
                        x.id === m.id ? { ...x, nombre: v } : x,
                      ),
                    )
                  }
                />
                <Field
                  label="Rol"
                  value={m.rol}
                  onChange={(v) =>
                    set(
                      "equipo",
                      draft.equipo.map((x) =>
                        x.id === m.id ? { ...x, rol: v } : x,
                      ),
                    )
                  }
                />
                <Field
                  label="Email"
                  type="email"
                  value={m.email || ""}
                  onChange={(v) =>
                    set(
                      "equipo",
                      draft.equipo.map((x) =>
                        x.id === m.id ? { ...x, email: v } : x,
                      ),
                    )
                  }
                />
                <Remove
                  label={`Quitar a ${m.nombre || "integrante"}`}
                  onClick={() => {
                    setDraft((prev) => ({
                      ...prev,
                      equipo: prev.equipo.filter((x) => x.id !== m.id),
                      necesidades: prev.necesidades.map((n) => ({
                        ...n,
                        tareas: n.tareas.map((t) =>
                          t.responsableId === m.id
                            ? { ...t, responsableId: undefined }
                            : t,
                        ),
                      })),
                    }));
                  }}
                />
              </div>
            ))}
            <Add
              label="Agregar integrante"
              onClick={() =>
                set("equipo", [
                  ...draft.equipo,
                  { id: uid(), nombre: "", rol: "", email: "" },
                ])
              }
            />
            <p className="text-sm leading-6 text-bojana-muted">
              Participantes del cliente y permisos
            </p>
            {draft.contactos.map((c) => (
              <div
                key={c.id}
                className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-bojana-inside items-end"
              >
                <Field
                  label="Nombre"
                  required
                  value={c.nombre}
                  onChange={(v) =>
                    set(
                      "contactos",
                      draft.contactos.map((x) =>
                        x.id === c.id ? { ...x, nombre: v } : x,
                      ),
                    )
                  }
                />
                <Field
                  label="Email"
                  required
                  type="email"
                  value={c.email}
                  onChange={(v) =>
                    set(
                      "contactos",
                      draft.contactos.map((x) =>
                        x.id === c.id ? { ...x, email: v } : x,
                      ),
                    )
                  }
                />
                <label className="flex items-center min-h-11 gap-bojana-inside text-sm">
                  <input
                    type="checkbox"
                    checked={c.accesoPortal}
                    onChange={(e) =>
                      set(
                        "contactos",
                        draft.contactos.map((x) =>
                          x.id === c.id
                            ? { ...x, accesoPortal: e.target.checked }
                            : x,
                        ),
                      )
                    }
                  />
                  Acceso al portal
                </label>
                <Remove
                  label={`Quitar contacto ${c.nombre}`}
                  onClick={() =>
                    set(
                      "contactos",
                      draft.contactos.filter((x) => x.id !== c.id),
                    )
                  }
                />
              </div>
            ))}
            <Add
              label="Agregar participante"
              onClick={() =>
                set("contactos", [
                  ...draft.contactos,
                  { id: uid(), nombre: "", email: "", accesoPortal: false },
                ])
              }
            />
          </Section>}
          {activeSection === creationSections[3] && <Section index={3} title="Trabajo">
            <fieldset id="creation-disciplines">
              <legend className="mb-2 text-sm">Disciplinas participantes</legend>
              <div className="flex flex-wrap gap-bojana-inside">
                {disciplines.map((disc) => (
                  <label key={disc} className="flex min-h-11 items-center gap-bojana-inside rounded-bojana-widget border border-bojana-line px-3">
                    <input
                      type="checkbox"
                      checked={draft.disciplinas.includes(disc)}
                      onChange={(e) => {
                        if (e.target.checked) set("disciplinas", [...draft.disciplinas, disc]);
                        else {
                          const removed = draft.necesidades.filter((n) => n.disciplina === disc).flatMap((n) => n.tareas.map((t) => t.id));
                          setDraft((prev) => ({
                            ...prev,
                            disciplinas: prev.disciplinas.filter((d) => d !== disc),
                            tareaSiguiente: removed.includes(prev.tareaSiguiente) ? "" : prev.tareaSiguiente,
                            necesidades: prev.necesidades.filter((n) => n.disciplina !== disc).map((n) => ({
                              ...n,
                              tareas: n.tareas.map((t) => ({ ...t, dependencias: t.dependencias?.filter((dep) => !removed.includes(dep)) })),
                            })),
                          }));
                        }
                      }}
                    />
                    {disc === "Ingeniería" ? "Ingeniería Civil" : disc}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="text-sm leading-6 text-bojana-muted">
              Elegí necesidades y agregá las tareas reales del alcance. Las
              etapas son agrupaciones opcionales dentro de cada necesidad. Definí
              el peso de cada tarea y de sus etapas para calcular el progreso.
            </p>
            {draft.disciplinas.map((disc) => (
              <div
                key={disc}
                className="space-y-bojana-inside border-t border-bojana-line pt-4"
              >
                <h4 className="bojana-heading-component">{disc}</h4>
                <div className="flex flex-wrap gap-bojana-inside">
                  {DISCIPLINE_NEEDS_MAP[disc].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={secondaryClass}
                      disabled={draft.necesidades.some(
                        (n) => n.id === `${disc}-${p.id}`,
                      )}
                      onClick={() => addNeed(disc, p)}
                    >
                      {p.label}
                    </button>
                  ))}
                  <Add label="Necesidad propia" onClick={() => addNeed(disc)} />
                </div>
              </div>
            ))}
            {draft.necesidades.map((need, ni) => (
              <div
                key={need.id}
                className="space-y-bojana-block border-t border-bojana-line pt-5"
              >
                <div className="grid min-w-0 grid-cols-[minmax(0,1.1fr)_5.5rem_minmax(0,1.1fr)_auto] items-end gap-1.5">
                  <div className="min-w-0">
                    <Field
                      label={need.disciplina}
                      value={need.nombre}
                      required
                      onChange={(v) => updateNeed(need.id, { nombre: v })}
                    />
                  </div>
                  <div className="min-w-0">
                    <Field
                      label="Peso (%)"
                      type="number"
                      value={String(need.pesoPorcentaje ?? 100)}
                      onChange={(v) => updateNeed(need.id, { pesoPorcentaje: Math.max(0, Number(v) || 0) })}
                    />
                  </div>
                  <div className="min-w-0 space-y-bojana-inside">
                    <span className="bojana-label">Entregables</span>
                    <div className={`${fieldClass} flex items-center gap-3`}>
                      {deliverableOptions.map(([type, label]) => {
                        const checked = (need.tiposContenido || ["archivo"]).includes(type);
                        return (
                          <label key={type} className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-ink-muted transition hover:text-ink">
                            <input
                              type="checkbox"
                              className="size-3.5 accent-ink"
                              checked={checked}
                              onChange={() => {
                                const currentTypes = need.tiposContenido || ["archivo"];
                                const nextTypes = checked
                                  ? currentTypes.filter((item) => item !== type)
                                  : [...currentTypes, type];
                                updateNeed(need.id, { tiposContenido: nextTypes, tareas: need.tareas.map((task) => ({ ...task, tiposContenido: nextTypes })) });
                              }}
                            />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <Remove
                    label={`Quitar necesidad ${need.nombre}`}
                    onClick={() => {
                      const removed = need.tareas.map((t) => t.id);
                      setDraft((prev) => ({
                        ...prev,
                        tareaSiguiente: removed.includes(prev.tareaSiguiente)
                          ? ""
                          : prev.tareaSiguiente,
                        necesidades: prev.necesidades
                          .filter((n) => n.id !== need.id)
                          .map((n) => ({
                            ...n,
                            tareas: n.tareas.map((t) => ({
                              ...t,
                              dependencias: t.dependencias?.filter(
                                (dep) => !removed.includes(dep),
                              ),
                            })),
                          })),
                      }));
                    }}
                  />
                </div>
                {need.tareas.map((task, ti) => {
                  const taskIsExpanded = expandedTasks[task.id] ?? false;
                  return (
                  <div
                    key={task.id}
                    className="group ml-4 rounded-bojana-widget bg-stone/50 p-3"
                  >
                    <div
                      className="relative flex cursor-pointer items-end gap-3 px-0 py-2"
                      onClick={() => setExpandedTasks((current) => ({ ...current, [task.id]: !taskIsExpanded }))}
                    >
                      <div
                        className="grid min-w-0 flex-1 grid-cols-[minmax(0,1.1fr)_5.5rem_5.5rem_auto] items-end gap-1.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="min-w-0">
                          <Field
                            label="Tarea"
                            required
                            value={task.titulo}
                            placeholder="Título de la tarea"
                            onChange={(v) => updateTask(need, task.id, { titulo: v })}
                          />
                        </div>
                        <div className="min-w-0">
                          <Field
                            label="Peso (%)"
                            type="number"
                            value={String(task.pesoPorcentaje ?? 100)}
                            onChange={(v) => updateTask(need, task.id, { pesoPorcentaje: Math.max(0, Number(v) || 0) })}
                          />
                        </div>
                        <div className="min-w-0">
                          <Field
                            label="Etapas"
                            type="number"
                            min="0"
                            value={String((task.subetapas || []).length)}
                            onChange={(value) => updateTaskStageCount(need, task, Number(value))}
                          />
                        </div>
                        <Remove
                          label={`Quitar tarea ${task.titulo}`}
                          onClick={() => removeTask(need, task.id)}
                        />
                      </div>
                    </div>
                    {taskIsExpanded && <div className="ml-4 space-y-bojana-block px-3 pb-3">
                    {(task.subetapas || []).length > 0 && <div className="ml-8 w-full max-w-[42rem] space-y-bojana-inside">
                      {(task.subetapas || []).map((stage, stageIndex) => (
                        editingStageId === `${task.id}:${stage.id}` ? (
                          <div key={stage.id} data-stage-editor="true" className="grid items-end gap-bojana-inside sm:grid-cols-[auto_minmax(0,1fr)]">
                            <input
                              type="checkbox"
                              className="mb-2 size-4 accent-ink"
                              checked={stage.completada || false}
                              aria-label={`Completar ${stageIndex + 1}`}
                              onChange={(event) => updateTask(need, task.id, { subetapas: (task.subetapas || []).map(item => item.id === stage.id ? { ...item, completada: event.target.checked } : item) })}
                            />
                            <Field compact label="" placeholder={`Etapa ${stageIndex + 1}`} value={stage.label} onChange={(v) => updateTask(need, task.id, { subetapas: (task.subetapas || []).map(item => item.id === stage.id ? { ...item, label: v } : item) })} />
                          </div>
                        ) : (
                          <div
                            key={stage.id}
                            role="button"
                            tabIndex={0}
                            className="grid cursor-pointer items-center gap-bojana-inside rounded-lg py-1 text-sm text-ink transition hover:bg-stone/60 sm:grid-cols-[auto_minmax(0,1fr)]"
                            onClick={() => setEditingStageId(`${task.id}:${stage.id}`)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setEditingStageId(`${task.id}:${stage.id}`);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-ink"
                              checked={stage.completada || false}
                              aria-label={`Completar ${stageIndex + 1}`}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateTask(need, task.id, { subetapas: (task.subetapas || []).map(item => item.id === stage.id ? { ...item, completada: event.target.checked } : item) })}
                            />
                            <span className={`truncate ${stage.completada ? "text-ink-muted line-through" : ""}`}>
                              {stage.label || `Etapa ${stageIndex + 1}`}
                            </span>
                          </div>
                        )
                      ))}
                    </div>}
                    <details className="group border-t border-bojana-line">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-bojana-inside py-2.5 text-xs font-semibold text-ink [&::-webkit-details-marker]:hidden">
                        <span>Depende de estas tareas (opcional)</span>
                        <span className="text-[11px] font-normal text-bojana-muted">
                          {(task.dependencias || []).length > 0
                            ? `${(task.dependencias || []).length} seleccionada${(task.dependencias || []).length === 1 ? "" : "s"}`
                            : "Seleccionar"}
                        </span>
                      </summary>
                      <div className="max-h-44 space-y-1 overflow-y-auto py-2">
                        {tasks
                          .filter((t) => t.id !== task.id)
                          .map((dep) => (
                            <label
                              key={dep.id}
                              className="flex min-h-8 cursor-pointer items-center gap-bojana-inside rounded-lg px-2 text-xs text-ink hover:bg-stone"
                            >
                              <input
                                type="checkbox"
                                checked={task.dependencias?.includes(dep.id) || false}
                                onChange={(e) =>
                                  updateTask(need, task.id, {
                                    dependencias: e.target.checked
                                      ? [...(task.dependencias || []), dep.id]
                                      : task.dependencias?.filter((id) => id !== dep.id),
                                  })
                                }
                              />
                              <span className="truncate">{dep.titulo || "Tarea sin título"}</span>
                            </label>
                          ))}
                      </div>
                    </details>
                    </div>}
                  </div>
                  );
                })}
                <Button
                  variant="ghost"
                  className="!min-h-8 !px-2 text-xs"
                  onClick={() =>
                    updateNeed(need.id, {
                      tareas: [
                        ...need.tareas,
                        {
                          id: uid(),
                          titulo: "",
                          estado: "Pendiente",
                          pesoPorcentaje: 100,
                          etapasActivas: false,
                          tiposContenido: need.tiposContenido || ['archivo'],
                          visibleCliente: true,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={16} />
                  Agregar tarea
                </Button>
              </div>
            ))}
          </Section>}
          {activeSection === creationSections[4] && <Section index={4} title="Siguiente acción">
            <Field
              label="Primer movimiento"
              required
              value={draft.siguiente}
              onChange={(v) => set("siguiente", v)}
            />
            <Field
              label="Contexto para el cliente"
              value={draft.detalleSiguiente}
              multiline
              onChange={(v) => set("detalleSiguiente", v)}
            />
            <div className="grid sm:grid-cols-2 gap-bojana-block">
              <label className="block space-y-bojana-inside text-sm">
                <span className="bojana-label">Quién debe actuar</span>
                <SelectControl
                  className={fieldClass}
                  value={draft.actorSiguiente}
                  onChange={(e) =>
                    set(
                      "actorSiguiente",
                      e.target.value as Draft["actorSiguiente"],
                    )
                  }
                >
                  <option value="estudio">El estudio</option>
                  <option value="cliente">El cliente</option>
                </SelectControl>
              </label>
              <label className="block space-y-bojana-inside text-sm">
                <span className="bojana-label">
                  Tarea asociada{" "}
                  {draft.actorSiguiente === "cliente"
                    ? "(requerida)"
                    : "(opcional)"}
                </span>
                <SelectControl
                  required={draft.actorSiguiente === "cliente"}
                  className={fieldClass}
                  value={draft.tareaSiguiente}
                  onChange={(e) => set("tareaSiguiente", e.target.value)}
                >
                  <option value="">Seleccionar tarea</option>
                  {tasks
                    .filter(
                      (t) =>
                        draft.actorSiguiente !== "cliente" || t.visibleCliente,
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.titulo}
                      </option>
                    ))}
                </SelectControl>
              </label>
            </div>
          </Section>}
          {activeSection === creationSections[5] && <Section index={5} title="Base documental">
            <p className="text-sm leading-6 text-bojana-muted">
              Registrá enlaces del presupuesto aprobado y los documentos
              disponibles. Adjuntarlos no suma avance.
            </p>
            {draft.documentos.map((doc) => (
              <div
                key={doc.id}
                className="grid gap-bojana-block border-t border-bojana-line pt-4 sm:grid-cols-2"
              >
                <Field
                  label="Nombre del documento"
                  required
                  value={doc.nombre}
                  onChange={(v) =>
                    set(
                      "documentos",
                      draft.documentos.map((x) =>
                        x.id === doc.id ? { ...x, nombre: v } : x,
                      ),
                    )
                  }
                />
                <Field
                  label="Enlace del archivo"
                  type="url"
                  value={doc.url || ""}
                  onChange={(v) =>
                    set(
                      "documentos",
                      draft.documentos.map((x) =>
                        x.id === doc.id ? { ...x, url: v } : x,
                      ),
                    )
                  }
                />
                <label className="block space-y-bojana-inside text-sm">
                  <span className="bojana-label">Tipo</span>
                  <SelectControl
                    className={fieldClass}
                    value={doc.tipo}
                    onChange={(e) =>
                      set(
                        "documentos",
                        draft.documentos.map((x) =>
                          x.id === doc.id
                            ? { ...x, tipo: e.target.value as typeof doc.tipo }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="presupuesto">Presupuesto aprobado</option>
                    <option value="planos_existentes">Planos existentes</option>
                    <option value="documentacion_tecnica">
                      Documentación técnica
                    </option>
                    <option value="otros">Otros</option>
                  </SelectControl>
                </label>
                <Field
                  label="Contexto"
                  value={doc.contexto || ""}
                  onChange={(v) =>
                    set(
                      "documentos",
                      draft.documentos.map((x) =>
                        x.id === doc.id ? { ...x, contexto: v } : x,
                      ),
                    )
                  }
                />
                <label className="flex gap-bojana-inside items-center text-sm">
                  <input
                    type="checkbox"
                    checked={doc.visibleCliente !== false}
                    onChange={(e) =>
                      set(
                        "documentos",
                        draft.documentos.map((x) =>
                          x.id === doc.id
                            ? { ...x, visibleCliente: e.target.checked }
                            : x,
                        ),
                      )
                    }
                  />
                  Visible para el cliente
                </label>
                <Remove
                  label={`Quitar documento ${doc.nombre}`}
                  onClick={() =>
                    set(
                      "documentos",
                      draft.documentos.filter((x) => x.id !== doc.id),
                    )
                  }
                />
              </div>
            ))}
            <Add
              label="Agregar documento base"
              onClick={() =>
                set("documentos", [
                  ...draft.documentos,
                  {
                    id: uid(),
                    nombre: "",
                    tipo: "otros",
                    fecha: new Date().toISOString().slice(0, 10),
                    visibleCliente: true,
                  },
                ])
              }
            />
          </Section>}
          {activeSection === creationSections[6] && <Section index={6} title="Revisión del ADN">
            <dl className="grid sm:grid-cols-2 gap-bojana-block text-sm">
              <div>
                <dt className="text-bojana-muted">Proyecto y cliente</dt>
                <dd>
                  {draft.nombre || "Pendiente"} · {draft.cliente || "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="text-bojana-muted">Ejecución inicial</dt>
                <dd>
                  0% · {draft.necesidades.length} necesidades · {tasks.length}{" "}
                  tareas
                </dd>
              </div>
              <div>
                <dt className="text-bojana-muted">Próximo paso</dt>
                <dd>{draft.siguiente || "Pendiente"}</dd>
              </div>
              <div>
                <dt className="text-bojana-muted">Documentación visible</dt>
                <dd>
                  {
                    draft.documentos.filter((d) => d.visibleCliente !== false)
                      .length
                  }{" "}
                  documentos
                </dd>
              </div>
            </dl>
            <p className="text-sm leading-6 text-bojana-muted">Secuencia para el cliente</p>
            {sequence.length ? (
              <ol className="space-y-bojana-inside text-sm">
                {sequence.map((s, i) => (
                  <li key={s.id}>
                    {i + 1}. {s.nombre} · Próximamente
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm">
                Todavía no hay tareas visibles seleccionadas.
              </p>
            )}
            <p className="text-sm leading-6 text-bojana-muted">
              Crear genera el workspace con esta configuración. La publicación y
              la bienvenida se realizan después, mediante acciones separadas.
            </p>
          </Section>}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-bojana-inside border-t border-bojana-line bg-bojana-surface p-4 sm:px-8">
          <p role="status" className="flex-1 text-sm leading-6 text-bojana-muted">
            {notice || "El proyecto comienza en 0%."}
          </p>
          {initialProject ? (
            <button type="submit" className="bojana-button bojana-button-primary min-h-11 bg-bojana-ink text-bojana-inverse px-5 py-2 rounded-bojana-widget focus-visible:outline-2 focus-visible:outline-offset-2">
              Guardar cambios
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`${secondaryClass} min-h-11 px-5`}
                onClick={() => {
                  try {
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                    setNotice("Borrador guardado. Podés continuar al volver a Crear proyecto.");
                  } catch {
                    setNotice("No se pudo guardar el borrador. Mantené esta ventana abierta.");
                  }
                }}
              >
                Guardar borrador
              </button>
              <button
                type={isLastSection ? "submit" : "button"}
                onClick={isLastSection ? undefined : goToNextSection}
                className="bojana-button bojana-button-primary min-h-11 bg-bojana-ink text-bojana-inverse px-5 py-2 rounded-bojana-widget focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {isLastSection ? "Crear proyecto" : "Siguiente"}
              </button>
            </>
          )}
        </footer>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  required = false,
  compact = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  required?: boolean;
  compact?: boolean;
  placeholder?: string;
}) {
  const [error, setError] = useState('');
  const examples: Record<string,string> = { 'Nombre del proyecto':'Ej.: Remodelación del SUM', 'Cliente / comitente':'Ej.: Consorcio Los Alisos', 'Propósito — resultado esperado':'Ej.: Conectar los espacios comunes', 'Ubicación':'Ej.: Nordelta, Tigre', 'Qué incluye el alcance aprobado':'Ej.: Planos y dos visualizaciones', 'Primer movimiento':'Ej.: Preparar la propuesta inicial' };
  const validate = (e: React.InvalidEvent<HTMLInputElement|HTMLTextAreaElement>) => { e.preventDefault(); setError(e.currentTarget.validationMessage); };
  return (
    <div className="block text-sm space-y-bojana-inside">
      {label && <span className="bojana-label">
          {label}
          {required && " *"}
        </span>}
      {multiline ? (
        <textarea
          required={required}
          aria-invalid={!!error}
          onInvalid={validate}
          placeholder={placeholder || examples[label]}
          rows={3}
          className={`${fieldClass} ${compact ? "!px-3 !py-1.5" : ""}`}
          value={value}
          onChange={(e) => { setError(''); onChange(e.target.value); }}
        />
      ) : (
        <DesignSystemField
          aria-label={label}
          required={required}
          aria-invalid={!!error}
          onInvalid={validate}
          placeholder={placeholder || examples[label]}
          type={type}
          className={`${fieldClass} ${compact ? "!px-3 !py-1.5" : ""}`}
          value={value}
          onChange={(e) => { setError(""); onChange(e.target.value); }}
        />
      )}
      {error && <p role="alert" className="text-xs text-bojana-error">{error}</p>}
    </div>
  );
}
function Section({
  index,
  children,
}: {
  index: number;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`creation-${index}`} className="space-y-bojana-block scroll-mt-4">{children}</section>
  );
}
function Add({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={secondaryClass} onClick={onClick}>
      <Plus size={16} />
      {label}
    </button>
  );
}
function Remove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink-faint transition hover:bg-transparent hover:text-ink active:scale-95"
      onClick={onClick}
    >
      <X size={18} strokeWidth={1.8} />
    </button>
  );
}
