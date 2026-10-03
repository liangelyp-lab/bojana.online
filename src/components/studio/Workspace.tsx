import React, { useState } from "react";
import {
  ProjectData,
  ExecutionTask,
  EstadoEtapa,
  ClientActionRequired,
  OperationalDiscipline,
} from "../../types";
import {
  Button,
  Field,
  Dialog,
  Feedback,
  EmptyState,
  ProgressSummary,
  useCompactWorkspace,
  useOnline,
  DeliverableRow,
} from "../ui/System";
import Story from "../client/Story";
import Resources from "../client/Resources";
import ResourceEditor from "./ResourceEditor";
import {
  tasks,
  progress,
  stateLabel,
  disciplineLabel,
  changeTask,
  blockers,
  uid,
  readFile,
  visibleContent,
  publicationChanges,
  publish,
  formatDate,
  getSettings,
  assignResource,
  resourceCollection,
  ResourceKind,
  reopenAction,
  decisionLabel,
} from "../../services/portalService";
interface Props {
  project: ProjectData;
  onUpdate: (p: ProjectData) => void;
  onBack: () => void;
  onPreview: () => void;
}
const states: EstadoEtapa[] = [
  "Pendiente",
  "En curso",
  "En revisión",
  "Esperando al cliente",
  "Pausada",
  "Completado",
  "Fuera de alcance",
];
export default function Workspace({
  project: p,
  onUpdate,
  onBack,
  onPreview,
}: Props) {
  const compact = useCompactWorkspace();
  const online = useOnline();
  const [resourceEdit, setResourceEdit] = useState<{
    kind: ResourceKind;
    item: any;
    taskId: string;
  }>();
  const [selected, setSelected] = useState<string>();
  const [actionOpen, setActionOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [communicate, setCommunicate] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const task = tasks(p).find((t) => t.id === selected);
  const changes = publicationChanges(p);
  const persist = (next: ProjectData) => {
    onUpdate(next);
    setError("");
    setMessage("Guardado en este navegador");
  };
  const save = (next: ProjectData) => {
    try {
      persist(next);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };
  const editTask = (change: Partial<ExecutionTask>) => {
    try {
      save(changeTask(p, task!.id, change));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const updateNeed = (disc: string, id: string, change: any) =>
    save({
      ...p,
      disciplinasOperativas: p.disciplinasOperativas?.map((d) =>
        d.id === disc
          ? {
              ...d,
              necesidades: d.necesidades.map((n) =>
                n.id === id ? { ...n, ...change } : n,
              ),
            }
          : d,
      ),
    });
  const selectTask = (id: string) => {
    setSelected(id);
    setIndexOpen(false);
    requestAnimationFrame(() =>
      document.getElementById("task-inspector-title")?.focus(),
    );
  };
  const index = (
    <div className="workspace-index">
      <Field label="Buscar pasos">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Field>
      {p.disciplinasOperativas?.map((d) => (
        <div className="section" key={d.id}>
          <h2 className="component-heading">{disciplineLabel(d.id)}</h2>
          {d.necesidades.map((n) => (
            <div key={n.id}>
              <a
                className="button"
                href={`#edit-${d.id}-${n.id}`}
                onClick={() => setIndexOpen(false)}
              >
                {n.nombre}
              </a>
              {n.tareas
                .filter((t) =>
                  t.titulo.toLowerCase().includes(search.toLowerCase()),
                )
                .map((t) => (
                  <Button
                    key={t.id}
                    aria-pressed={selected === t.id}
                    onClick={() => selectTask(t.id)}
                  >
                    {t.titulo}
                  </Button>
                ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
  const inspector = (
    <aside className="inspector" aria-label="Propiedades del paso">
      {task ? (
        <div className="stack">
          <h2 id="task-inspector-title" tabIndex={-1}>
            {task.titulo}
          </h2>
          <Field label="Nombre del paso">
            <input
              value={task.titulo}
              onChange={(e) => editTask({ titulo: e.target.value })}
            />
          </Field>
          <Field label="Estado">
            <select
              value={
                task.estado === "Requiere ajustes" ? "En revisión" : task.estado
              }
              onChange={(e) => {
                const estado = e.target.value as EstadoEtapa;
                const scopeChanged =
                  estado !== task.estado &&
                  (estado === "Fuera de alcance" ||
                    task.estado === "Fuera de alcance");
                const motivo = scopeChanged
                  ? window.prompt(
                      `Motivo del cambio de alcance de ${task.titulo}`,
                    )
                  : undefined;
                if (scopeChanged && !motivo?.trim()) return;
                editTask({
                  estado,
                  ...(scopeChanged ? { motivoCambioAlcance: motivo! } : {}),
                });
              }}
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {stateLabel(s)}
                </option>
              ))}
            </select>
          </Field>
          {blockers(p, task).length > 0 && (
            <p>
              Espera:{" "}
              {blockers(p, task)
                .map((t) => t.titulo)
                .join(", ")}
            </p>
          )}
          <Field label="Fecha estimada">
            <input
              type="date"
              value={/^\d{4}-/.test(task.fecha || "") ? task.fecha : ""}
              onChange={(e) => editTask({ fecha: e.target.value })}
            />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={task.visibleCliente}
              onChange={(e) => editTask({ visibleCliente: e.target.checked })}
            />
            Visible en la próxima publicación
          </label>
          <Field label="Descripción para el cliente">
            <textarea
              value={task.notaCliente || ""}
              onChange={(e) => editTask({ notaCliente: e.target.value })}
            />
          </Field>
          {!!task.subetapas?.length && (
            <fieldset>
              <legend>Comprobaciones del paso</legend>
              {task.subetapas.map((sub) => (
                <label key={sub.id} className="check">
                  <input
                    type="checkbox"
                    checked={sub.completada}
                    onChange={(e) =>
                      editTask({
                        subetapas: task.subetapas!.map((item) =>
                          item.id === sub.id
                            ? { ...item, completada: e.target.checked }
                            : item,
                        ),
                      })
                    }
                  />
                  {sub.label}
                </label>
              ))}
              <p className="muted">
                Las comprobaciones no modifican el avance. Cerrá el paso cuando
                termine el trabajo y estén resueltas las solicitudes.
              </p>
            </fieldset>
          )}
          <Field label="Nota interna">
            <textarea
              value={task.comentarioInterno || ""}
              onChange={(e) => editTask({ comentarioInterno: e.target.value })}
            />
          </Field>
          <fieldset>
            <legend>Pasos previos requeridos</legend>
            {tasks(p)
              .filter((t) => t.id !== task.id)
              .map((t) => (
                <label key={t.id} className="check">
                  <input
                    type="checkbox"
                    checked={task.dependencias?.includes(t.id) || false}
                    onChange={(e) => {
                      if (
                        e.target.checked &&
                        t.dependencias?.includes(task.id)
                      ) {
                        setError("No se puede crear una dependencia circular.");
                        return;
                      }
                      editTask({
                        dependencias: e.target.checked
                          ? [...(task.dependencias || []), t.id]
                          : (task.dependencias || []).filter(
                              (id) => id !== t.id,
                            ),
                      });
                    }}
                  />
                  {t.titulo}
                </label>
              ))}
          </fieldset>
          <Field
            label="Adjuntar entregable"
            help="PDF, imagen o texto; máximo 2 MB por archivo. Las versiones anteriores se conservan."
          >
            <input
              type="file"
              disabled={busy}
              accept="application/pdf,image/*,text/plain"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                try {
                  const url = await readFile(f);
                  editTask({
                    archivos: [
                      ...(task.archivos || []),
                      {
                        nombre: `${f.name} · ${formatDate(new Date().toISOString())}`,
                        url,
                        tipo: f.type.startsWith("image/")
                          ? "imagen"
                          : f.type === "application/pdf"
                            ? "pdf"
                            : "archivo",
                      },
                    ],
                  });
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Field>
          {busy && <p role="status">Cargando archivo…</p>}
          {task.archivos?.map((f, i) => (
            <DeliverableRow key={i} title={f.nombre} url={f.url} />
          ))}
          <Field label="Incorporar una revisión documental existente">
            <select
              value=""
              onChange={(e) => {
                const [docId, revId] = e.target.value.split(":");
                const d = p.documentos.find((d) => d.id === docId);
                const r = d?.revisiones.find((r) => r.id === revId);
                if (d && r)
                  editTask({
                    archivos: [
                      ...(task.archivos || []),
                      {
                        nombre: `${d.titulo} · ${r.numeroRevision}`,
                        url: r.url,
                        tipo: "pdf",
                      },
                    ],
                  });
              }}
            >
              <option value="">Elegí una revisión</option>
              {p.documentos.flatMap((d) =>
                d.revisiones.map((r) => (
                  <option key={r.id} value={`${d.id}:${r.id}`}>
                    {d.titulo} · {r.numeroRevision}
                  </option>
                )),
              )}
            </select>
          </Field>
          <Field
            label="Incorporar un recurso anterior a este paso"
            help="Se conserva su contenido y versiones. El cambio requiere publicación."
          >
            <select
              value=""
              onChange={(e) => {
                const [kind, id] = e.target.value.split("|");
                try {
                  save(assignResource(p, task.id, kind as ResourceKind, id));
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <option value="">Elegí el recurso y su contexto</option>
              {(
                [
                  "documentos",
                  "avances",
                  "visualizaciones",
                  "tours",
                  "materiales",
                  "decisiones",
                ] as ResourceKind[]
              ).flatMap((kind) =>
                resourceCollection(p, kind).map((item) => (
                  <option
                    key={`${kind}-${item.id}`}
                    value={`${kind}|${item.id}`}
                  >
                    {kind} · {item.titulo || item.nombre}
                  </option>
                )),
              )}
            </select>
          </Field>
          {task.recursos && (
            <>
              <Resources resources={task.recursos} />
              {Object.entries(task.recursos)
                .filter(([kind]) => kind !== "decisiones")
                .flatMap(([kind, items]) =>
                  (items || []).map((item) => (
                    <Button
                      key={`${kind}-${item.id}`}
                      onClick={() =>
                        setResourceEdit({
                          kind: kind as ResourceKind,
                          item,
                          taskId: task.id,
                        })
                      }
                    >
                      Editar {item.titulo || item.nombre}
                    </Button>
                  )),
                )}
            </>
          )}
          {!!task.historialSolicitudes?.length && (
            <details>
              <summary>
                Solicitudes anteriores ({task.historialSolicitudes.length})
              </summary>
              {task.historialSolicitudes.map((h, i) => (
                <div key={i}>
                  <p>
                    {h.solicitud} · {h.respuesta?.autor} ·{" "}
                    {formatDate(h.respuesta?.fecha)}
                  </p>
                  <p>
                    {decisionLabel(h.respuesta?.decision)}:{" "}
                    {h.respuesta?.comentario}
                  </p>
                  <p>
                    Reabierta: {formatDate(h.fechaReapertura)} · {h.motivo}
                  </p>
                </div>
              ))}
            </details>
          )}
          <Button onClick={() => setActionOpen(true)}>
            {task.accionCliente
              ? "Revisar solicitud del cliente"
              : "Solicitar acción del cliente"}
          </Button>
          {task.accionCliente?.respuestaCliente && (
            <>
              <p>
                Respuesta:{" "}
                {task.accionCliente.respuestaCliente.autor ||
                  "Cliente responsable"}{" "}
                · {formatDate(task.accionCliente.respuestaCliente.fecha)}
              </p>
              <p>{task.accionCliente.respuestaCliente.comentario}</p>
              <Button
                onClick={() => {
                  const reason = window.prompt(
                    "Motivo de reapertura de la solicitud",
                  );
                  if (!reason?.trim()) return;
                  try {
                    save(reopenAction(p, task.id, reason));
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                Reabrir solicitud
              </Button>
            </>
          )}
          <details>
            <summary>Comentarios ({task.comentarios?.length || 0})</summary>
            {task.comentarios?.map((c) => (
              <p key={c.id}>
                {c.autor} · {formatDate(c.fecha)}: {c.texto}
              </p>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const text = String(
                  new FormData(form).get("text") || "",
                ).trim();
                if (text) {
                  editTask({
                    comentarios: [
                      ...(task.comentarios || []),
                      {
                        id: uid(),
                        autor: "Bojana Estudio",
                        rol: "admin",
                        fecha: new Date().toISOString(),
                        texto: text,
                      },
                    ],
                  });
                  form.reset();
                }
              }}
            >
              <Field label="Comentario para el cliente">
                <textarea required name="text" />
              </Field>
              <Button type="submit">Agregar comentario</Button>
            </form>
          </details>
          <Feedback message={error} />
        </div>
      ) : (
        <EmptyState>
          Seleccioná un paso para editar sus propiedades, archivos y
          solicitudes.
        </EmptyState>
      )}
    </aside>
  );
  return (
    <>
      <header className="stack">
        <Button onClick={onBack}>Volver a proyectos</Button>
        <div className="row between">
          <div>
            <h1>{p.info.nombre}</h1>
            <p className="status">
              {p.lifecycleStatus === "BORRADOR"
                ? "Preparación del portal"
                : p.lifecycleStatus === "COMPLETADO"
                  ? "Proyecto completado"
                  : "Proyecto activo"}{" "}
              · {changes.length} cambios visibles sin publicar
            </p>
          </div>
          <ProgressSummary value={progress(p)} />
        </div>
        <div className="row">
          {p.lifecycleStatus === "ACTIVO" && progress(p) === 100 && (
            <Button
              onClick={() => {
                if (
                  window.confirm(
                    `Cerrar ${p.info.nombre} como proyecto completado. El cierre se verá después de publicar.`,
                  )
                )
                  save({
                    ...p,
                    lifecycleStatus: "COMPLETADO",
                    info: {
                      ...p.info,
                      estadoGeneral: "Finalizado",
                      etapaActual: "Proyecto completado",
                      proximoHito: "",
                    },
                  });
              }}
            >
              Cerrar proyecto
            </Button>
          )}
          {p.lifecycleStatus === "COMPLETADO" && (
            <Button
              onClick={() => {
                if (
                  window.confirm(
                    `Reabrir ${p.info.nombre} para revisar su ejecución. Se conservará el cierre publicado hasta publicar los nuevos cambios.`,
                  )
                )
                  save({
                    ...p,
                    lifecycleStatus: "ACTIVO",
                    info: {
                      ...p.info,
                      estadoGeneral: "En Ejecución",
                      etapaActual: "Revisión del proyecto",
                    },
                  });
              }}
            >
              Reabrir proyecto
            </Button>
          )}
          <Button onClick={onPreview} disabled={!p.publicacion}>
            Ver versión publicada
          </Button>
          <Button
            primary
            onClick={() => setReview(true)}
            disabled={!changes.length || !online}
          >
            Publicar cambios
          </Button>
          <Button
            onClick={() => setCommunicate(true)}
            disabled={!p.publicacion}
          >
            Compartir publicación
          </Button>
        </div>
        <p className="meta" role="status">
          {message}
        </p>
        <Feedback message={error} />
      </header>
      <Button className="mobile-index" onClick={() => setIndexOpen(true)}>
        Abrir índice del proyecto
      </Button>
      {indexOpen && (
        <Dialog title="Índice del proyecto" onClose={() => setIndexOpen(false)}>
          {index}
        </Dialog>
      )}
      <div className="workspace">
        <aside
          className="desktop-index workspace-index"
          aria-label="Índice del proyecto"
        >
          {index}
        </aside>
        <div>
          <details className="section">
            <summary>Identidad, alcance y acceso del proyecto</summary>
            <div className="stack">
              <Field label="Nombre del proyecto">
                <input
                  required
                  value={p.info.nombre}
                  onChange={(e) =>
                    save({ ...p, info: { ...p.info, nombre: e.target.value } })
                  }
                />
              </Field>
              <Field label="Propósito">
                <textarea
                  value={p.info.descripcion}
                  onChange={(e) =>
                    save({
                      ...p,
                      info: { ...p.info, descripcion: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Alcance acordado">
                <textarea
                  value={p.baseContractual?.alcance || ""}
                  onChange={(e) =>
                    save({
                      ...p,
                      baseContractual: {
                        ...p.baseContractual,
                        alcance: e.target.value,
                        presupuestoAprobado:
                          p.baseContractual?.presupuestoAprobado ?? true,
                        plazoInicio: p.baseContractual?.plazoInicio || "",
                        plazoFin: p.baseContractual?.plazoFin || "",
                      },
                    })
                  }
                />
              </Field>
              <Field label="Ubicación">
                <input
                  value={p.info.ubicacion}
                  onChange={(e) =>
                    save({
                      ...p,
                      info: { ...p.info, ubicacion: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Momento actual">
                <input
                  value={p.info.etapaActual}
                  onChange={(e) =>
                    save({
                      ...p,
                      info: { ...p.info, etapaActual: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Próximo paso">
                <input
                  value={p.info.proximoHito}
                  onChange={(e) =>
                    save({
                      ...p,
                      info: { ...p.info, proximoHito: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Inicio estimado">
                <input
                  type="date"
                  value={
                    /^\d{4}-/.test(p.info.fechaInicio) ? p.info.fechaInicio : ""
                  }
                  onChange={(e) =>
                    save({
                      ...p,
                      info: { ...p.info, fechaInicio: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Fin estimado">
                <input
                  type="date"
                  min={p.info.fechaInicio || undefined}
                  value={/^\d{4}-/.test(p.info.fechaFin) ? p.info.fechaFin : ""}
                  onChange={(e) => {
                    if (
                      p.info.fechaInicio &&
                      e.target.value &&
                      e.target.value < p.info.fechaInicio
                    ) {
                      setError("El fin no puede ser anterior al inicio.");
                      return;
                    }
                    save({
                      ...p,
                      info: { ...p.info, fechaFin: e.target.value },
                    });
                  }}
                />
              </Field>
              <Field label="Cliente responsable">
                <input
                  value={p.cliente.nombre}
                  onChange={(e) =>
                    save({
                      ...p,
                      cliente: { ...p.cliente, nombre: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Email del cliente">
                <input
                  type="email"
                  value={p.cliente.email}
                  onChange={(e) =>
                    save({
                      ...p,
                      cliente: { ...p.cliente, email: e.target.value },
                    })
                  }
                />
              </Field>
              <p className="muted">
                El enlace es una referencia de esta demostración local. No
                habilita acceso entre dispositivos ni sustituye autenticación.
              </p>
            </div>
          </details>
          {p.disciplinasOperativas?.map((d) => (
            <div key={d.id}>
              {d.necesidades.map((n) => (
                <section
                  className="section"
                  id={`edit-${d.id}-${n.id}`}
                  key={n.id}
                >
                  <p className="meta">{disciplineLabel(d.id)}</p>
                  <h2>{n.nombre}</h2>
                  <Field label="Necesidad / resultado esperado">
                    <input
                      value={n.nombre}
                      onChange={(e) =>
                        updateNeed(d.id, n.id, { nombre: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Para qué existe esta necesidad">
                    <textarea
                      value={n.descripcion || ""}
                      onChange={(e) =>
                        updateNeed(d.id, n.id, { descripcion: e.target.value })
                      }
                    />
                  </Field>
                  {n.tareas
                    .filter((t) =>
                      t.titulo.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((t) => (
                      <div className="task-row" key={t.id}>
                        <Button
                          className="task-select"
                          aria-pressed={selected === t.id}
                          onClick={() => selectTask(t.id)}
                        >
                          <span>{t.titulo}</span>
                          <span className="status">
                            {stateLabel(t.estado)} ·{" "}
                            {t.visibleCliente ? "Portal" : "Interno"}
                          </span>
                        </Button>
                      </div>
                    ))}
                  <Button
                    onClick={() => {
                      const id = uid();
                      if (
                        updateNeed(d.id, n.id, {
                          tareas: [
                            ...n.tareas,
                            {
                              id,
                              titulo: "Nuevo paso",
                              estado: "Pendiente",
                              visibleCliente: false,
                              pesoPorcentaje: 0,
                            },
                          ],
                        })
                      )
                        selectTask(id);
                    }}
                  >
                    Agregar paso
                  </Button>
                </section>
              ))}
              <Button
                onClick={() =>
                  save({
                    ...p,
                    disciplinasOperativas: p.disciplinasOperativas?.map(
                      (item) =>
                        item.id === d.id
                          ? {
                              ...item,
                              necesidades: [
                                ...item.necesidades,
                                {
                                  id: uid(),
                                  nombre: "Nueva necesidad",
                                  descripcion: "",
                                  tareas: [],
                                },
                              ],
                            }
                          : item,
                    ),
                  })
                }
              >
                Agregar necesidad a {disciplineLabel(d.id)}
              </Button>
            </div>
          ))}
          {!p.disciplinasOperativas?.length && (
            <EmptyState>
              Este proyecto todavía no tiene una estructura de trabajo.
            </EmptyState>
          )}
          <details className="section">
            <summary>Documentación anterior y versiones</summary>
            <p className="muted">
              Conservamos los recursos anteriores. Podés incorporarlos al paso
              seleccionado desde su inspector, manteniendo el archivo original.
            </p>
            {p.documentos.map((d) => (
              <div key={d.id}>
                <h3>{d.titulo}</h3>
                {d.revisiones.map((r) => (
                  <DeliverableRow
                    key={r.id}
                    title={`${d.titulo} · ${r.numeroRevision}`}
                    url={r.url}
                    detail={`${formatDate(r.fecha)} · ${r.cambios || ""}`}
                  />
                ))}
              </div>
            ))}
            {p.baseContractual?.documentosBase?.map((d) => (
              <DeliverableRow key={d.id} title={d.nombre} url={d.url} />
            ))}
          </details>
          <details className="section">
            <summary>Historial de publicación</summary>
            {p.historialPublicaciones?.map((h) => (
              <div key={h.version}>
                <h3>Versión {h.version}</h3>
                <p>
                  {h.autor} · {formatDate(h.fecha)}
                </p>
                <ul>
                  {h.cambios.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
            {!p.historialPublicaciones?.length && (
              <EmptyState>Todavía no hay publicaciones registradas.</EmptyState>
            )}
          </details>
        </div>
        {compact
          ? task && (
              <Dialog
                title={`Propiedades · ${task.titulo}`}
                onClose={() => setSelected(undefined)}
              >
                {inspector}
              </Dialog>
            )
          : inspector}
      </div>
      {resourceEdit && (
        <ResourceEditor
          kind={resourceEdit.kind}
          item={resourceEdit.item}
          onClose={() => setResourceEdit(undefined)}
          onSave={(item) => {
            const current = tasks(p).find((t) => t.id === resourceEdit.taskId)!;
            persist(
              changeTask(p, current.id, {
                recursos: {
                  ...current.recursos,
                  [resourceEdit.kind]: current.recursos![
                    resourceEdit.kind
                  ]!.map((r) => (r.id === item.id ? item : r)),
                },
              }),
            );
            setResourceEdit(undefined);
          }}
        />
      )}
      {actionOpen && task && (
        <ActionEditor
          task={task}
          onClose={() => setActionOpen(false)}
          onSave={(a) => {
            persist(
              changeTask(p, task.id, {
                accionCliente: a,
                estado: "Esperando al cliente",
                visibleCliente: true,
              }),
            );
            setActionOpen(false);
          }}
        />
      )}
      {review && (
        <Dialog
          title="Revisar publicación"
          wide
          onClose={() => setReview(false)}
        >
          <div className="stack">
            <p>
              Se publicará esta versión visible. No se enviará ningún email.
            </p>
            <ul>
              {changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            {changes.some((c) => c.startsWith("Retirar")) && (
              <p>
                Al confirmar, los pasos retirados dejarán de verse. Se conservan
                en el registro interno.
              </p>
            )}
            <Feedback message={error} />
            <div className="row">
              <Button
                primary
                onClick={() => {
                  if (save(publish(p))) {
                    setReview(false);
                    setCommunicate(true);
                  }
                }}
              >
                Confirmar publicación
              </Button>
              <Button onClick={() => setReview(false)}>Volver a editar</Button>
            </div>
            <section
              className="section"
              aria-label="Vista previa de la próxima publicación"
            >
              <Story
                project={visibleContent({
                  ...p,
                  lifecycleStatus:
                    p.lifecycleStatus === "BORRADOR"
                      ? "ACTIVO"
                      : p.lifecycleStatus,
                })}
                preview
                embedded
              />
            </section>
          </div>
        </Dialog>
      )}
      {communicate && (
        <Dialog
          title="Compartir publicación"
          onClose={() => setCommunicate(false)}
        >
          <div className="stack">
            <p>
              Versión {p.publicacion?.version} publicada el{" "}
              {formatDate(p.publicacion?.fecha)}.
            </p>
            <p>
              Esta demostración guarda el proyecto en este navegador. El enlace
              requiere un servicio compartido para que otra persona pueda
              acceder desde otro dispositivo.
            </p>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${location.origin}${location.pathname}?portal=${encodeURIComponent(p.cliente.dedicatedToken)}`,
                  );
                  setMessage("Enlace copiado");
                  setCommunicate(false);
                } catch {
                  setError(
                    "No pudimos copiar el enlace. Revisá el permiso del navegador.",
                  );
                }
              }}
            >
              Copiar enlace de referencia
            </Button>
            {p.cliente.email ? (
              <a
                className="button"
                href={`mailto:${encodeURIComponent(p.cliente.email)}?subject=${encodeURIComponent(`Actualización de ${p.publicacion?.contenido.info.nombre || p.info.nombre}`)}&body=${encodeURIComponent(`Hola ${p.cliente.nombre},\nLa versión ${p.publicacion?.version} de ${p.info.nombre} está publicada. Avance: ${p.publicacion?.contenido.progresoTotalCalculado || 0}%.\n${getSettings().nombre}`)}`}
              >
                Preparar email en tu correo
              </a>
            ) : (
              <p>Completá el email del cliente para preparar un aviso.</p>
            )}
            <p className="muted">
              Abrir el correo no confirma envío, entrega ni lectura.
            </p>
            <Feedback message={error} />
          </div>
        </Dialog>
      )}
    </>
  );
}
function ActionEditor({
  task,
  onClose,
  onSave,
}: {
  task: ExecutionTask;
  onClose: () => void;
  onSave: (a: ClientActionRequired) => void;
}) {
  const [a, setA] = useState<ClientActionRequired>(
    () =>
      task.accionCliente || {
        id: uid(),
        activa: true,
        tipo: "aprobar_rechazar",
        titulo: `Revisar ${task.titulo}`,
        mensaje: "",
        accionRequeridaTexto: "Revisar propuesta",
        estado: "pendiente",
        adjuntos: (task.archivos || []).map((f) => ({
          id: uid(),
          nombre: f.nombre,
          url: f.url,
          tipo: f.tipo === "pdf" ? "pdf" : "otro",
        })),
      },
  );
  const [error, setError] = useState("");
  const readonly = !!a.respuestaCliente;
  return (
    <Dialog title={`Solicitud · ${task.titulo}`} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            a.tipo === "elegir_alternativa" &&
            (a.alternativas?.length || 0) < 2
          ) {
            setError("Agregá al menos dos alternativas para comparar.");
            return;
          }
          try {
            onSave({
              ...a,
              id:
                task.accionCliente &&
                JSON.stringify(task.accionCliente) !== JSON.stringify(a)
                  ? uid()
                  : a.id,
              fechaSolicitud: a.fechaSolicitud || new Date().toISOString(),
              solicitudEnviadaEmail: false,
              emailEntregado: false,
              emailAbierto: false,
            });
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <Field label="Qué necesitás del cliente">
          <select
            disabled={readonly}
            value={a.tipo}
            onChange={(e) =>
              setA({
                ...a,
                tipo: e.target.value as ClientActionRequired["tipo"],
              })
            }
          >
            <option value="aprobar_rechazar">
              Aprobar o solicitar cambios
            </option>
            <option value="elegir_alternativa">Elegir alternativa</option>
            <option value="enviar_informacion">Enviar información</option>
            <option value="subir_documento">Subir documento</option>
            <option value="confirmar_decision">Confirmar decisión</option>
          </select>
        </Field>
        <Field label="Título de la solicitud">
          <input
            required
            disabled={readonly}
            value={a.titulo}
            onChange={(e) => setA({ ...a, titulo: e.target.value })}
          />
        </Field>
        <Field label="Contexto, objeto a revisar y consecuencia">
          <textarea
            required
            disabled={readonly}
            value={a.mensaje}
            onChange={(e) => setA({ ...a, mensaje: e.target.value })}
          />
        </Field>
        <Field label="Texto de la acción">
          <input
            required
            disabled={readonly}
            value={a.accionRequeridaTexto}
            onChange={(e) =>
              setA({ ...a, accionRequeridaTexto: e.target.value })
            }
          />
        </Field>
        <Field label="Fecha límite, si corresponde">
          <input
            disabled={readonly}
            type="date"
            value={/^\d{4}-/.test(a.fechaLimite || "") ? a.fechaLimite : ""}
            onChange={(e) => setA({ ...a, fechaLimite: e.target.value })}
          />
        </Field>
        <label className="check">
          <input
            type="checkbox"
            disabled={readonly}
            checked={a.bloquearSiguientesEtapas || false}
            onChange={(e) =>
              setA({ ...a, bloquearSiguientesEtapas: e.target.checked })
            }
          />
          La respuesta es necesaria para continuar
        </label>
        <p className="muted">
          Configurá los pasos dependientes en su inspector. Guardar la solicitud
          no la publica ni envía email.
        </p>
        {a.tipo === "elegir_alternativa" && (
          <div className="stack">
            {a.alternativas?.map((o, i) => (
              <div key={o.id}>
                <Field label={`Alternativa ${i + 1}`}>
                  <input
                    required
                    disabled={readonly}
                    value={o.titulo}
                    onChange={(e) =>
                      setA({
                        ...a,
                        alternativas: a.alternativas!.map((item) =>
                          item.id === o.id
                            ? { ...item, titulo: e.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label={`Descripción de alternativa ${i + 1}`}>
                  <textarea
                    disabled={readonly}
                    value={o.descripcion || ""}
                    onChange={(e) =>
                      setA({
                        ...a,
                        alternativas: a.alternativas!.map((item) =>
                          item.id === o.id
                            ? { ...item, descripcion: e.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            ))}
            <Button
              disabled={readonly}
              onClick={() =>
                setA({
                  ...a,
                  alternativas: [
                    ...(a.alternativas || []),
                    { id: uid(), titulo: "", descripcion: "" },
                  ],
                })
              }
            >
              Agregar alternativa
            </Button>
          </div>
        )}
        {a.adjuntos?.map((f) => (
          <div key={f.id}>
            <DeliverableRow title={f.nombre} url={f.url} />
            {!readonly && (
              <Button
                onClick={() =>
                  setA({
                    ...a,
                    adjuntos: a.adjuntos!.filter((item) => item.id !== f.id),
                  })
                }
              >
                Retirar {f.nombre} de la solicitud
              </Button>
            )}
          </div>
        ))}
        {!readonly && (
          <Field
            label="Adjuntar archivo a revisar"
            help="PDF, imagen o texto, hasta 2 MB."
          >
            <input
              type="file"
              accept="application/pdf,image/*,text/plain"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const url = await readFile(f);
                  setA({
                    ...a,
                    adjuntos: [
                      ...(a.adjuntos || []),
                      {
                        id: uid(),
                        nombre: f.name,
                        url,
                        tipo:
                          f.type === "application/pdf"
                            ? "pdf"
                            : f.type.startsWith("image/")
                              ? "imagen"
                              : "otro",
                      },
                    ],
                  });
                  setError("");
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            />
          </Field>
        )}
        <Feedback message={error} />
        {!readonly && (
          <Button primary type="submit">
            Guardar solicitud
          </Button>
        )}
        {readonly && (
          <p>
            Esta solicitud ya fue respondida. Para reabrirla, cerrá esta ficha y
            registrá el motivo desde el inspector.
          </p>
        )}
      </form>
    </Dialog>
  );
}
