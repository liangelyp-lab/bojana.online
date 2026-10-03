import React, { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type {
  ClientContactPerson,
  ContractualBase,
  DisciplinaType,
  ExecutionTask,
  InternalMilestone,
  ProjectData,
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (project: ProjectData) => void;
}
interface Need {
  id: string;
  nombre: string;
  disciplina: DisciplinaType;
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
const DRAFT_KEY = "BOJANA_CREATE_PROJECT_DNA_V2";
const disciplines: DisciplinaType[] = [
  "Arquitectura",
  "Ingeniería",
  "Diseño",
  "Construcción",
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
  "w-full min-w-0 rounded-md border border-[#D8D8D2] bg-white px-3 py-2.5 text-sm text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]";
const secondaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#D8D8D2] px-3 py-2 text-sm hover:bg-[#ECECE7] focus-visible:outline-2 focus-visible:outline-offset-2";

export default function NewProjectModal(props: Props) {
  return props.isOpen ? <ProjectCreationForm {...props} /> : null;
}

function ProjectCreationForm({ onClose, onFinish }: Props) {
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? { ...emptyDraft(), ...JSON.parse(saved) } : emptyDraft();
    } catch {
      return emptyDraft();
    }
  });
  const [notice, setNotice] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    formRef.current?.querySelector<HTMLElement>("input")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
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
  const move = <T,>(items: T[], index: number, direction: number) => {
    const copy = [...items];
    const next = index + direction;
    if (next < 0 || next >= copy.length) return copy;
    [copy[index], copy[next]] = [copy[next], copy[index]];
    return copy;
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
        tareas: [],
      },
    ]);
  };
  const makeProject = (): ProjectData => {
    const id = uid();
    const operational = generateEmptyOperationalDisciplines(
      draft.disciplinas,
      draft.necesidades.map((n) => ({
        needId: n.id,
        label: n.nombre.trim(),
        discipline: n.disciplina,
        tasks: n.tareas.map((t) => ({
          ...t,
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
      id,
      lifecycleStatus: "BORRADOR",
      progresoTotalCalculado: 0,
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
        publicado: false,
        portalPublicado: false,
        cambiosSinPublicar: 0,
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
      actividadReciente: [],
      modulos: getRecommendedModulesForDisciplines(draft.disciplinas),
      progreso: [],
      avances: [],
      documentos: [],
      visualizaciones: { galeria: [], tours: [] },
      decisiones: [],
      materiales: [],
    };
    project.info.etapaActual =
      getClientProjectSequence(project)[0]?.nombre || "";
    return project;
  };
  const finish = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.disciplinas.length) {
      setNotice("Seleccioná al menos una disciplina.");
      document.getElementById("creation-disciplines")?.scrollIntoView();
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
  } as ProjectData);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 px-3 py-4 sm:p-6 flex justify-center"
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
        className="flex flex-col w-full max-w-5xl max-h-full rounded-lg bg-[#F7F7F4] text-[#111111] shadow-xl overflow-hidden"
      >
        <header className="flex justify-between items-start gap-4 border-b border-[#D8D8D2] p-5 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#686864]">
              Bojana Estudio
            </p>
            <h2 id="creation-title" className="text-2xl mt-1">
              Crear proyecto
            </h2>
            <p className="text-sm text-[#686864] mt-1">
              Configurá todo el ADN a partir del alcance aprobado.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar creación"
            onClick={onClose}
            className={secondaryClass}
          >
            <X size={18} />
          </button>
        </header>
        <nav
          aria-label="Secciones del ADN"
          className="flex flex-wrap gap-x-5 gap-y-2 px-5 sm:px-8 py-3 border-b border-[#D8D8D2] text-xs"
        >
          {[
            "Identidad",
            "Alcance",
            "Personas",
            "Trabajo",
            "Siguiente acción",
            "Documentos",
            "Revisión",
          ].map((name, i) => (
            <a
              key={name}
              href={`#creation-${i}`}
              className="min-h-6 underline underline-offset-4"
            >
              {name}
            </a>
          ))}
        </nav>
        <div className="overflow-y-auto p-5 sm:p-8 space-y-10">
          <Section index={0} title="Identidad y propósito">
            <div className="grid sm:grid-cols-2 gap-4">
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
          </Section>
          <Section index={1} title="Alcance y plazo">
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
            <div className="grid sm:grid-cols-2 gap-4">
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
                className="grid sm:grid-cols-[1fr_180px_auto] gap-2"
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
          </Section>
          <Section index={2} title="Disciplinas y personas">
            <fieldset id="creation-disciplines">
              <legend className="text-sm mb-2">
                Disciplinas participantes
              </legend>
              <div className="flex flex-wrap gap-3">
                {disciplines.map((disc) => (
                  <label
                    key={disc}
                    className="flex gap-2 items-center min-h-11 px-3 border border-[#D8D8D2] rounded-md"
                  >
                    <input
                      type="checkbox"
                      checked={draft.disciplinas.includes(disc)}
                      onChange={(e) => {
                        if (e.target.checked)
                          set("disciplinas", [...draft.disciplinas, disc]);
                        else {
                          const removed = draft.necesidades
                            .filter((n) => n.disciplina === disc)
                            .flatMap((n) => n.tareas.map((t) => t.id));
                          setDraft((prev) => ({
                            ...prev,
                            disciplinas: prev.disciplinas.filter(
                              (d) => d !== disc,
                            ),
                            tareaSiguiente: removed.includes(
                              prev.tareaSiguiente,
                            )
                              ? ""
                              : prev.tareaSiguiente,
                            necesidades: prev.necesidades
                              .filter((n) => n.disciplina !== disc)
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
                        }
                      }}
                    />
                    {disc === "Ingeniería" ? "Ingeniería Civil" : disc}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid sm:grid-cols-3 gap-4">
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
            <p className="text-sm text-[#686864]">
              Equipo y responsables del estudio
            </p>
            {draft.equipo.map((m) => (
              <div
                key={m.id}
                className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2"
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
            <p className="text-sm text-[#686864]">
              Participantes del cliente y permisos
            </p>
            {draft.contactos.map((c) => (
              <div
                key={c.id}
                className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end"
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
                <label className="flex items-center min-h-11 gap-2 text-sm">
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
          </Section>
          <Section index={3} title="Orden de trabajo">
            <p className="text-sm text-[#686864]">
              Elegí necesidades y agregá las tareas reales del alcance. Las
              etapas son agrupaciones opcionales dentro de cada necesidad. Todas
              las tareas tienen el mismo peso.
            </p>
            {draft.disciplinas.map((disc) => (
              <div
                key={disc}
                className="space-y-3 border-t border-[#D8D8D2] pt-4"
              >
                <h4>{disc}</h4>
                <div className="flex flex-wrap gap-2">
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
                className="space-y-4 border-t border-[#D8D8D2] pt-5"
              >
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1">
                    <Field
                      label={`Necesidad · ${need.disciplina}`}
                      value={need.nombre}
                      required
                      onChange={(v) => updateNeed(need.id, { nombre: v })}
                    />
                  </div>
                  <Order
                    index={ni}
                    count={draft.necesidades.length}
                    label="necesidad"
                    onMove={(direction) =>
                      set("necesidades", move(draft.necesidades, ni, direction))
                    }
                  />
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
                {need.tareas.map((task, ti) => (
                  <div
                    key={task.id}
                    className="space-y-3 border-l-2 border-[#D8D8D2] pl-4"
                  >
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex-1">
                        <Field
                          label={`Tarea ${ti + 1}`}
                          required
                          value={task.titulo}
                          onChange={(v) =>
                            updateTask(need, task.id, { titulo: v })
                          }
                        />
                      </div>
                      <Order
                        index={ti}
                        count={need.tareas.length}
                        label="tarea"
                        onMove={(direction) =>
                          updateNeed(need.id, {
                            tareas: move(need.tareas, ti, direction),
                          })
                        }
                      />
                      <Remove
                        label={`Quitar tarea ${task.titulo}`}
                        onClick={() => removeTask(need, task.id)}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field
                        label="Etapa opcional"
                        value={task.etapa || ""}
                        onChange={(v) =>
                          updateTask(need, task.id, { etapa: v })
                        }
                      />
                      <label className="text-sm space-y-1 block">
                        <span>Responsable</span>
                        <select
                          className={fieldClass}
                          value={task.responsableId || ""}
                          onChange={(e) =>
                            updateTask(need, task.id, {
                              responsableId: e.target.value,
                            })
                          }
                        >
                          <option value="">Sin asignar</option>
                          {draft.equipo.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="flex items-center gap-2 min-h-11 text-sm">
                      <input
                        type="checkbox"
                        checked={task.visibleCliente}
                        onChange={(e) => {
                          updateTask(need, task.id, {
                            visibleCliente: e.target.checked,
                          });
                          if (
                            !e.target.checked &&
                            draft.tareaSiguiente === task.id &&
                            draft.actorSiguiente === "cliente"
                          )
                            set("tareaSiguiente", "");
                        }}
                      />
                      Mostrar esta tarea en la vista del cliente
                    </label>
                    <fieldset>
                      <legend className="text-xs text-[#686864]">
                        Depende de estas tareas (opcional)
                      </legend>
                      <div className="flex flex-wrap gap-x-4">
                        {tasks
                          .filter((t) => t.id !== task.id)
                          .map((dep) => (
                            <label
                              key={dep.id}
                              className="flex gap-2 items-center min-h-9 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  task.dependencias?.includes(dep.id) || false
                                }
                                onChange={(e) =>
                                  updateTask(need, task.id, {
                                    dependencias: e.target.checked
                                      ? [...(task.dependencias || []), dep.id]
                                      : task.dependencias?.filter(
                                          (id) => id !== dep.id,
                                        ),
                                  })
                                }
                              />
                              {dep.titulo || "Tarea sin título"}
                            </label>
                          ))}
                      </div>
                    </fieldset>
                  </div>
                ))}
                <Add
                  label="Agregar tarea"
                  onClick={() =>
                    updateNeed(need.id, {
                      tareas: [
                        ...need.tareas,
                        {
                          id: uid(),
                          titulo: "",
                          estado: "Pendiente",
                          pesoPorcentaje: 1,
                          visibleCliente: true,
                        },
                      ],
                    })
                  }
                />
              </div>
            ))}
          </Section>
          <Section index={4} title="Siguiente acción">
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
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm space-y-1">
                <span>Quién debe actuar</span>
                <select
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
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span>
                  Tarea asociada{" "}
                  {draft.actorSiguiente === "cliente"
                    ? "(requerida)"
                    : "(opcional)"}
                </span>
                <select
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
                </select>
              </label>
            </div>
          </Section>
          <Section index={5} title="Base documental">
            <p className="text-sm text-[#686864]">
              Registrá enlaces del presupuesto aprobado y los documentos
              disponibles. Adjuntarlos no suma avance.
            </p>
            {draft.documentos.map((doc) => (
              <div
                key={doc.id}
                className="grid sm:grid-cols-2 gap-3 border-t border-[#D8D8D2] pt-4"
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
                <label className="text-sm space-y-1">
                  <span>Tipo</span>
                  <select
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
                  </select>
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
                <label className="flex gap-2 items-center text-sm">
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
          </Section>
          <Section index={6} title="Revisión del ADN">
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[#686864]">Proyecto y cliente</dt>
                <dd>
                  {draft.nombre || "Pendiente"} · {draft.cliente || "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="text-[#686864]">Ejecución inicial</dt>
                <dd>
                  0% · {draft.necesidades.length} necesidades · {tasks.length}{" "}
                  tareas
                </dd>
              </div>
              <div>
                <dt className="text-[#686864]">Próximo paso</dt>
                <dd>{draft.siguiente || "Pendiente"}</dd>
              </div>
              <div>
                <dt className="text-[#686864]">Documentación visible</dt>
                <dd>
                  {
                    draft.documentos.filter((d) => d.visibleCliente !== false)
                      .length
                  }{" "}
                  documentos
                </dd>
              </div>
            </dl>
            <p className="text-sm text-[#686864]">Secuencia para el cliente</p>
            {sequence.length ? (
              <ol className="space-y-2 text-sm">
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
            <p className="text-sm text-[#686864]">
              Crear genera el workspace con esta configuración. La publicación y
              la bienvenida se realizan después, mediante acciones separadas.
            </p>
          </Section>
        </div>
        <footer className="border-t border-[#D8D8D2] p-4 sm:px-8 flex flex-wrap justify-between items-center gap-3 bg-white">
          <p role="status" className="text-sm text-[#686864] flex-1">
            {notice || "El proyecto comienza en 0%."}
          </p>
          <button
            type="button"
            className={secondaryClass}
            onClick={() => {
              try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                setNotice(
                  "Borrador guardado. Podés continuar al volver a Crear proyecto.",
                );
              } catch {
                setNotice(
                  "No se pudo guardar el borrador. Mantené esta ventana abierta.",
                );
              }
            }}
          >
            Guardar borrador
          </button>
          <button
            type="submit"
            className="min-h-11 bg-[#111111] text-white px-5 py-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Crear proyecto
          </button>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block text-sm space-y-1">
      <span>
        {label}
        {required && " *"}
      </span>
      {multiline ? (
        <textarea
          required={required}
          rows={3}
          className={fieldClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          required={required}
          type={type}
          className={fieldClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function Section({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`creation-${index}`} className="space-y-4 scroll-mt-4">
      <h3 className="text-lg">{title}</h3>
      {children}
    </section>
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
      className={secondaryClass}
      onClick={onClick}
    >
      <Trash2 size={16} />
    </button>
  );
}
function Order({
  index,
  count,
  label,
  onMove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (direction: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={index === 0}
        aria-label={`Subir ${label}`}
        className={`${secondaryClass} disabled:opacity-40`}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={16} />
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        aria-label={`Bajar ${label}`}
        className={`${secondaryClass} disabled:opacity-40`}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={16} />
      </button>
    </>
  );
}
