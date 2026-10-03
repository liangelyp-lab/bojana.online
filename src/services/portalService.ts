import {
  ProjectData,
  ExecutionTask,
  ClientActionRequired,
  EstadoEtapa,
  calculateProjectProgressFromDisciplines,
} from "../types";
export const uid = () => crypto.randomUUID();
export const tasks = (p: ProjectData) =>
  (p.disciplinasOperativas || []).flatMap((d) =>
    d.necesidades.flatMap((n) => n.tareas),
  );
export const progress = (p: ProjectData) =>
  ["BORRADOR", "LISTO_PARA_COMPARTIR"].includes(p.lifecycleStatus)
    ? 0
    : calculateProjectProgressFromDisciplines(p.disciplinasOperativas || []);
export const stateLabel = (s: EstadoEtapa, client = false) =>
  ({
    Pendiente: client ? "Próximamente" : "No iniciada",
    Completado: client ? "Completado" : "Completada",
    "En curso": client ? "En desarrollo" : "En curso",
    "Esperando al cliente": client
      ? "Esperando tu respuesta"
      : "Esperando al cliente",
    "Requiere ajustes": "En revisión",
  })[s] || s;
export const disciplineLabel = (s: string) =>
  s === "Ingeniería" ? "Ingeniería Civil" : s;
export function visibleContent(p: ProjectData): ProjectData {
  // Allowlist: never copy access secrets, internal notes, collaborators or draft configuration.
  return {
    id: p.id,
    lifecycleStatus: p.lifecycleStatus,
    info: {
      ...p.info,
      cambiosSinPublicar: 0,
      ultimaPublicacion: undefined,
      ultimaActualizacion: undefined,
    },
    disciplinas: p.disciplinas,
    equipo: [],
    cliente: {
      nombre: p.cliente.nombre,
      empresa: p.cliente.empresa,
      email: "",
      telefono: "",
      usuario: "",
      linkSinProteccion: false,
      dedicatedToken: "",
    },
    modulos: [],
    baseContractual: p.baseContractual
      ? {
          alcance: p.baseContractual.alcance,
          presupuestoAprobado: p.baseContractual.presupuestoAprobado,
          plazoInicio: p.baseContractual.plazoInicio,
          plazoFin: p.baseContractual.plazoFin,
          documentosBase: p.baseContractual.documentosBase,
        }
      : undefined,
    disciplinasOperativas: (p.disciplinasOperativas || []).map((d) => ({
      id: d.id,
      necesidades: d.necesidades
        .map((n) => ({
          id: n.id,
          nombre: n.nombre,
          descripcion: n.descripcion,
          tareas: n.tareas
            .filter((t) => t.visibleCliente && t.estado !== "Fuera de alcance")
            .map((t) => ({
              id: t.id,
              titulo: t.titulo,
              pesoPorcentaje: 0,
              estado: t.estado,
              fecha: t.fecha,
              visibleCliente: true,
              notaCliente: t.notaCliente,
              archivos: t.archivos,
              recursos: t.recursos,
              comentarios: t.comentarios,
              historialSolicitudes: t.historialSolicitudes,
              cierreFecha: t.cierreFecha,
              accionCliente: t.accionCliente
                ? {
                    id: t.accionCliente.id,
                    origenDecisionId: t.accionCliente.origenDecisionId,
                    activa: t.accionCliente.activa,
                    tipo: t.accionCliente.tipo,
                    titulo: t.accionCliente.titulo,
                    mensaje: t.accionCliente.mensaje,
                    accionRequeridaTexto: t.accionCliente.accionRequeridaTexto,
                    fechaLimite: t.accionCliente.fechaLimite,
                    bloquearSiguientesEtapas:
                      t.accionCliente.bloquearSiguientesEtapas,
                    alternativas: t.accionCliente.alternativas,
                    adjuntos: t.accionCliente.adjuntos,
                    estado: t.accionCliente.estado,
                    fechaSolicitud: t.accionCliente.fechaSolicitud,
                    respuestaCliente: t.accionCliente.respuestaCliente,
                  }
                : undefined,
            })),
        }))
        .filter((n) => n.tareas.length || n.descripcion),
    })),
    // Legacy resources stay available until the studio assigns their context. No invented linkage.
    progreso: [],
    avances: p.avances,
    documentos: p.documentos,
    visualizaciones: {
      galeria: p.visualizaciones.galeria,
      tours: p.visualizaciones.tours.filter((t) => t.publicado),
    },
    decisiones: p.decisiones,
    materiales: p.materiales,
    progresoTotalCalculado: progress(p),
    ultimaModificacion: p.ultimaModificacion,
  };
}
export function publicationChanges(p: ProjectData): string[] {
  const before = p.publicacion?.contenido;
  const next = visibleContent(p);
  if (!before)
    return ["Publicación inicial del proyecto y su contenido visible"];
  const changes: string[] = [];
  if (
    JSON.stringify({
      ...before.info,
      ultimaActualizacion: undefined,
      ultimaPublicacion: undefined,
    }) !== JSON.stringify(next.info)
  )
    changes.push("Identidad, alcance, fechas o siguiente paso");
  if (
    JSON.stringify(before.baseContractual) !==
    JSON.stringify(next.baseContractual)
  )
    changes.push("Base contractual y documentos iniciales");
  const old = new Map(tasks(before).map((t) => [t.id, t]));
  for (const t of tasks(next)) {
    if (JSON.stringify(old.get(t.id)) !== JSON.stringify(t))
      changes.push(
        `${old.has(t.id) ? "Actualizar" : "Incorporar"} paso: ${t.titulo}`,
      );
    old.delete(t.id);
  }
  for (const t of old.values()) changes.push(`Retirar del portal: ${t.titulo}`);
  if (
    JSON.stringify(
      before.disciplinasOperativas?.map((d) => [
        d.id,
        d.necesidades.map((n) => [n.id, n.nombre, n.descripcion]),
      ]),
    ) !==
    JSON.stringify(
      next.disciplinasOperativas?.map((d) => [
        d.id,
        d.necesidades.map((n) => [n.id, n.nombre, n.descripcion]),
      ]),
    )
  )
    changes.push("Estructura y descripción de necesidades");
  for (const key of [
    "avances",
    "documentos",
    "visualizaciones",
    "decisiones",
    "materiales",
  ] as const)
    if (JSON.stringify(before[key]) !== JSON.stringify(next[key]))
      changes.push(`Actualizar ${key}`);
  if (before.progresoTotalCalculado !== next.progresoTotalCalculado)
    changes.push(`Avance: ${next.progresoTotalCalculado}%`);
  return changes;
}
export function requireOnline() {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw new Error(
      "Sin conexión. Podés leer y editar lo guardado. Recuperá la conexión antes de publicar o responder.",
    );
}
export function publish(
  p: ProjectData,
  autor = "Estudio administrador",
): ProjectData {
  requireOnline();
  if (!p.info.nombre.trim() || !p.cliente.nombre.trim())
    throw new Error(
      "Completá el nombre del proyecto y del cliente antes de publicar.",
    );
  if (tasks(p).some((t) => t.visibleCliente && !t.titulo.trim()))
    throw new Error("Todos los pasos visibles necesitan un nombre.");
  const fecha = new Date().toISOString();
  const version = (p.publicacion?.version || 0) + 1;
  const cambios = publicationChanges(p);
  const activated = {
    ...p,
    lifecycleStatus:
      p.lifecycleStatus === "COMPLETADO" ? "COMPLETADO" : "ACTIVO",
    info: {
      ...p.info,
      publicado: true,
      portalPublicado: true,
      cambiosSinPublicar: 0,
      ultimaPublicacion: fecha,
      ultimaActualizacion: fecha,
    },
  } as ProjectData;
  const contenido = structuredClone(visibleContent(activated));
  contenido.info.ultimaActualizacion = fecha;
  return {
    ...activated,
    publicacion: { version, fecha, autor, contenido },
    historialPublicaciones: [
      ...(p.historialPublicaciones || []),
      { version, fecha, autor, cambios },
    ],
  };
}
export function blockers(p: ProjectData, t: ExecutionTask): ExecutionTask[] {
  return tasks(p).filter(
    (other) =>
      t.dependencias?.includes(other.id) &&
      (other.estado !== "Completado" ||
        (other.accionCliente?.activa &&
          ["pendiente", "requiere_ajustes"].includes(
            other.accionCliente.estado,
          ))),
  );
}
export function changeTask(
  p: ProjectData,
  id: string,
  change: Partial<ExecutionTask>,
): ProjectData {
  const task = tasks(p).find((t) => t.id === id);
  if (!task) throw new Error("No encontramos el paso.");
  if (
    p.lifecycleStatus === "COMPLETADO" &&
    change.estado &&
    change.estado !== task.estado
  )
    throw new Error("Reabrí el proyecto antes de cambiar su ejecución.");
  if (
    change.estado &&
    ["En curso", "Completado"].includes(change.estado) &&
    (blockers(p, task).length ||
      (task.accionCliente?.activa &&
        ["pendiente", "requiere_ajustes"].includes(task.accionCliente.estado)))
  )
    throw new Error(
      "Este paso espera una respuesta o un paso previo. Resolvé la dependencia antes de continuar.",
    );
  if (
    change.estado &&
    ["En curso", "Completado"].includes(change.estado) &&
    ["BORRADOR", "LISTO_PARA_COMPARTIR"].includes(p.lifecycleStatus)
  )
    throw new Error("Publicá la bienvenida antes de iniciar la ejecución.");
  if (
    change.estado === "Esperando al cliente" &&
    !(change.accionCliente || task.accionCliente)?.activa
  )
    throw new Error(
      "Creá una solicitud para indicar qué necesitás del cliente.",
    );
  if (change.dependencias) {
    const graph = new Map(
      tasks(p).map((t) => [
        t.id,
        t.id === id ? change.dependencias! : t.dependencias || [],
      ]),
    );
    const visit = (node: string, trail: Set<string>): boolean => {
      if (trail.has(node)) return true;
      return (graph.get(node) || []).some((next) =>
        visit(next, new Set([...trail, node])),
      );
    };
    if (visit(id, new Set()))
      throw new Error("No se puede crear una dependencia circular.");
  }
  const scopeChanged =
    !!change.estado &&
    change.estado !== task.estado &&
    (change.estado === "Fuera de alcance" ||
      task.estado === "Fuera de alcance");
  if (scopeChanged && !change.motivoCambioAlcance?.trim())
    throw new Error("Registrá el motivo del cambio de alcance.");
  if (change.accionCliente?.origenDecisionId && task.recursos?.decisiones) {
    change = {
      ...change,
      recursos: {
        ...task.recursos,
        ...change.recursos,
        decisiones: task.recursos.decisiones.map((d) =>
          d.id === change.accionCliente!.origenDecisionId
            ? {
                ...d,
                titulo: change.accionCliente!.titulo,
                descripcion: change.accionCliente!.mensaje,
                opciones: change.accionCliente!.alternativas?.map((o, i) => ({
                  ...o,
                  letra: o.letra || `Opción ${i + 1}`,
                })),
                estado:
                  change.accionCliente!.estado === "pendiente"
                    ? "Pendiente"
                    : d.estado,
                fechaDecision:
                  change.accionCliente!.estado === "pendiente"
                    ? undefined
                    : d.fechaDecision,
                opcionAprobadaId:
                  change.accionCliente!.estado === "pendiente"
                    ? undefined
                    : d.opcionAprobadaId,
              }
            : d,
        ),
      },
    };
  }
  const disciplinasOperativas = p.disciplinasOperativas?.map((d) => ({
    ...d,
    necesidades: d.necesidades.map((n) => ({
      ...n,
      tareas: n.tareas.map((t) =>
        t.id === id
          ? {
              ...t,
              ...change,
              cierreFecha:
                change.estado === "Completado"
                  ? new Date().toISOString()
                  : t.cierreFecha,
            }
          : t,
      ),
    })),
  }));
  return {
    ...p,
    disciplinasOperativas,
    progresoTotalCalculado: calculateProjectProgressFromDisciplines(
      disciplinasOperativas || [],
    ),
    actividadReciente: scopeChanged
      ? [
          ...(p.actividadReciente || []),
          {
            id: uid(),
            autor: "Bojana Estudio",
            fecha: new Date().toISOString(),
            descripcion: `Cambio de alcance de ${task.titulo}: ${change.estado}. ${change.motivoCambioAlcance}`,
          },
        ]
      : p.actividadReciente,
  };
}
export function respond(
  p: ProjectData,
  taskId: string,
  actionId: string,
  response: NonNullable<ClientActionRequired["respuestaCliente"]>,
): ProjectData {
  requireOnline();
  const publicTask =
    p.publicacion &&
    tasks(p.publicacion.contenido).find((t) => t.id === taskId);
  const draftTask = tasks(p).find((t) => t.id === taskId);
  if (
    !publicTask?.accionCliente ||
    publicTask.accionCliente.id !== actionId ||
    publicTask.accionCliente.estado !== "pendiente" ||
    !publicTask.accionCliente.activa ||
    draftTask?.accionCliente?.id !== actionId ||
    draftTask.accionCliente.estado !== "pendiente"
  )
    throw new Error(
      "La solicitud ya fue respondida o cambió. Volvé a abrir el portal.",
    );
  const a = publicTask.accionCliente;
  const allowed =
    a.tipo === "aprobar_rechazar"
      ? ["aprobado", "requiere_cambios"]
      : a.tipo === "elegir_alternativa"
        ? ["alternativa_elegida"]
        : a.tipo === "confirmar_decision"
          ? ["aprobado"]
          : ["info_enviada"];
  if (!allowed.includes(response.decision))
    throw new Error("La respuesta no corresponde al tipo de solicitud.");
  if (
    response.decision === "aprobado" &&
    a.tipo === "aprobar_rechazar" &&
    a.adjuntos?.some((f) => !resourceUrl(f.url))
  )
    throw new Error(
      "El estudio debe adjuntar los archivos de la propuesta antes de que puedas aprobarla.",
    );
  const contentKey = (action: ClientActionRequired) =>
    JSON.stringify([
      action.tipo,
      action.titulo,
      action.mensaje,
      action.alternativas,
      action.adjuntos,
    ]);
  if (contentKey(a) !== contentKey(draftTask!.accionCliente!))
    throw new Error(
      "El estudio está revisando esta solicitud. Esperá su próxima publicación antes de responder.",
    );
  if (
    a.tipo === "elegir_alternativa" &&
    !a.alternativas?.some((o) => o.id === response.alternativaElegidaId)
  )
    throw new Error("Elegí una alternativa disponible.");
  if (a.tipo === "enviar_informacion" && !response.comentario?.trim())
    throw new Error("Escribí la información solicitada.");
  if (a.tipo === "subir_documento" && !response.archivoSubidoUrl)
    throw new Error("Adjuntá el documento solicitado.");
  if (response.decision === "requiere_cambios" && !response.comentario?.trim())
    throw new Error("Explicá qué cambios necesitás.");
  const update = (content: ProjectData) => ({
    ...content,
    disciplinasOperativas: content.disciplinasOperativas?.map((d) => ({
      ...d,
      necesidades: d.necesidades.map((n) => ({
        ...n,
        tareas: n.tareas.map((t) =>
          t.id === taskId
            ? {
                ...t,
                estado:
                  response.decision === "requiere_cambios"
                    ? ("Requiere ajustes" as const)
                    : ("En revisión" as const),
                recursos: t.recursos
                  ? {
                      ...t.recursos,
                      decisiones: t.recursos.decisiones?.map((decision) =>
                        decision.id === a.origenDecisionId
                          ? {
                              ...decision,
                              estado:
                                response.decision === "requiere_cambios"
                                  ? ("Requiere cambios" as const)
                                  : ("Aprobado" as const),
                              fechaDecision: response.fecha,
                              opcionAprobadaId: response.alternativaElegidaId,
                              comentarios: [
                                ...decision.comentarios,
                                ...(response.comentario
                                  ? [
                                      {
                                        id: uid(),
                                        autor:
                                          response.autor ||
                                          "Cliente responsable",
                                        rol: "cliente" as const,
                                        fecha: response.fecha,
                                        texto: response.comentario,
                                      },
                                    ]
                                  : []),
                              ],
                            }
                          : decision,
                      ),
                    }
                  : undefined,
                accionCliente: {
                  ...t.accionCliente!,
                  estado:
                    response.decision === "requiere_cambios"
                      ? ("requiere_ajustes" as const)
                      : response.decision === "info_enviada"
                        ? ("informacion_enviada" as const)
                        : ("aprobado" as const),
                  respuestaCliente: response,
                },
              }
            : t,
        ),
      })),
    })),
  });
  return {
    ...update(p),
    publicacion: {
      ...p.publicacion!,
      contenido: update(p.publicacion!.contenido),
    },
  };
}
export function resourceUrl(url?: string): string | undefined {
  if (!url || url === "#" || /example\.com|placeholder/i.test(url))
    return undefined;
  return /^(https?:\/\/|data:(application\/pdf|image\/|text\/plain)|blob:)/i.test(
    url,
  )
    ? url
    : undefined;
}
export async function readFile(file: File): Promise<string> {
  if (!/^(application\/pdf|text\/plain|image\/)/.test(file.type))
    throw new Error(
      "No reconocimos el tipo de archivo. Usá PDF, imagen o texto.",
    );
  if (file.size > 2 * 1024 * 1024)
    throw new Error(
      "El archivo supera los 2 MB permitidos en esta demostración local.",
    );
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("No pudimos cargar el archivo. Probá nuevamente."));
    reader.readAsDataURL(file);
  });
}
export const getSettings = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("BOJANA_SETTINGS") || "null") || {
        nombre: "Bojana Estudio",
        email: "",
        telefono: "",
        ciudad: "",
      }
    );
  } catch {
    return { nombre: "Bojana Estudio", email: "", telefono: "", ciudad: "" };
  }
};
export const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const date = new Date(
    value.includes("T") ? value : `${value.slice(0, 10)}T12:00:00`,
  );
  if (Number.isNaN(date.getTime())) return value;
  return value.includes("T")
    ? date.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })
    : date.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

export type ResourceKind = keyof NonNullable<ExecutionTask["recursos"]>;
export function resourceCollection(p: ProjectData, kind: ResourceKind): any[] {
  return kind === "visualizaciones"
    ? p.visualizaciones.galeria
    : kind === "tours"
      ? p.visualizaciones.tours
      : p[kind];
}
export function assignResource(
  p: ProjectData,
  taskId: string,
  kind: ResourceKind,
  id: string,
): ProjectData {
  const resource = resourceCollection(p, kind).find((item) => item.id === id);
  const task = tasks(p).find((t) => t.id === taskId);
  if (!resource || !task)
    throw new Error("No encontramos el recurso o el paso.");
  const change: Partial<ExecutionTask> = {
    recursos: {
      ...task.recursos,
      [kind]: [...(task.recursos?.[kind] || []), structuredClone(resource)],
    },
  };
  if (kind === "decisiones" && resource.estado === "Pendiente") {
    if (task.accionCliente?.activa && task.accionCliente.estado === "pendiente")
      throw new Error(
        "Resolvé la solicitud actual antes de incorporar otra decisión pendiente.",
      );
    change.accionCliente = {
      id: uid(),
      origenDecisionId: resource.id,
      activa: true,
      tipo: resource.opciones?.length
        ? "elegir_alternativa"
        : "aprobar_rechazar",
      titulo: resource.titulo,
      mensaje: resource.descripcion,
      accionRequeridaTexto: "Revisar propuesta",
      estado: "pendiente",
      fechaSolicitud: new Date().toISOString(),
      alternativas: resource.opciones,
      adjuntos: resource.archivoAdjuntoUrl
        ? [
            {
              id: uid(),
              nombre: resource.titulo,
              url: resource.archivoAdjuntoUrl,
            },
          ]
        : [],
    };
    change.estado = "Esperando al cliente";
    change.visibleCliente = true;
    change.comentarios = [...(task.comentarios || []), ...resource.comentarios];
  }
  const result = changeTask(p, taskId, change);
  const remaining = resourceCollection(p, kind).filter(
    (item) => item.id !== id,
  );
  return kind === "visualizaciones"
    ? {
        ...result,
        visualizaciones: { ...result.visualizaciones, galeria: remaining },
      }
    : kind === "tours"
      ? {
          ...result,
          visualizaciones: { ...result.visualizaciones, tours: remaining },
        }
      : { ...result, [kind]: remaining };
}

export function reopenAction(
  p: ProjectData,
  taskId: string,
  reason: string,
): ProjectData {
  const task = tasks(p).find((t) => t.id === taskId);
  const a = task?.accionCliente;
  if (!a?.respuestaCliente || !reason.trim())
    throw new Error(
      "Registrá un motivo para reabrir una solicitud respondida.",
    );
  return changeTask(p, taskId, {
    estado: "Esperando al cliente",
    accionCliente: {
      ...a,
      id: uid(),
      estado: "pendiente",
      respuestaCliente: undefined,
      fechaSolicitud: new Date().toISOString(),
    },
    historialSolicitudes: [
      ...(task!.historialSolicitudes || []),
      {
        solicitud: a.titulo,
        respuesta: structuredClone(a.respuestaCliente),
        fechaReapertura: new Date().toISOString(),
        motivo: reason.trim(),
      },
    ],
    comentarios: [
      ...(task!.comentarios || []),
      {
        id: uid(),
        autor: "Bojana Estudio",
        rol: "admin",
        fecha: new Date().toISOString(),
        texto: `Solicitud reabierta: ${reason.trim()}`,
      },
    ],
  });
}
export const decisionLabel = (value?: string) =>
  ({
    aprobado: "Aprobado",
    requiere_cambios: "Cambios solicitados",
    alternativa_elegida: "Alternativa elegida",
    info_enviada: "Información enviada",
  })[value || ""] || "Sin respuesta";
