import Resources from "./Resources";
import React, { useState } from "react";
import { ProjectData, ExecutionTask, ClientActionRequired } from "../../types";
import {
  Button,
  Field,
  Dialog,
  DeliverableRow,
  VersionHistory,
  MediaFigure,
  EmptyState,
  Feedback,
  ProgressSummary,
  useOnline,
} from "../ui/System";
import {
  tasks,
  stateLabel,
  disciplineLabel,
  formatDate,
  readFile,
  uid,
  getSettings,
  resourceUrl,
  decisionLabel,
} from "../../services/portalService";
type Response = NonNullable<ClientActionRequired["respuestaCliente"]>;
export function ClientAction({
  task,
  preview,
  onRespond,
}: {
  task: ExecutionTask;
  preview?: boolean;
  onRespond?: (id: string, actionId: string, response: Response) => void;
}) {
  const a = task.accionCliente!;
  const online = useOnline();
  const [open, setOpen] = useState(false);
  const [option, setOption] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = (decision: Response["decision"]) => {
    try {
      if (preview)
        throw new Error("La vista previa no permite responder solicitudes.");
      if (
        a.tipo === "elegir_alternativa" &&
        !option &&
        decision !== "requiere_cambios"
      )
        throw new Error("Elegí una alternativa.");
      if (
        (decision === "requiere_cambios" || a.tipo === "enviar_informacion") &&
        !comment.trim()
      )
        throw new Error("Escribí el detalle solicitado.");
      if (a.tipo === "subir_documento" && !file)
        throw new Error("Adjuntá el documento.");
      onRespond?.(task.id, a.id, {
        fecha: new Date().toISOString(),
        decision,
        alternativaElegidaId: option || undefined,
        comentario: comment.trim() || fileName || undefined,
        archivoSubidoUrl: file || undefined,
      });
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="action">
      <h3>{a.titulo}</h3>
      <p>{a.mensaje}</p>
      <p className="muted">
        Solicita: Bojana Estudio · Paso: {task.titulo}
        {a.fechaLimite && ` · Fecha límite: ${formatDate(a.fechaLimite)}`}
      </p>
      {a.bloquearSiguientesEtapas && (
        <p>
          El trabajo dependiente continúa cuando se resuelva esta solicitud.
        </p>
      )}
      {a.adjuntos?.map((f) => (
        <DeliverableRow key={f.id} title={f.nombre} url={f.url} />
      ))}
      {a.respuestaCliente ? (
        <div>
          <p>
            <strong>
              {a.estado === "requiere_ajustes"
                ? "Cambios solicitados"
                : "Respondida"}
            </strong>{" "}
            · {a.respuestaCliente.autor || "Cliente responsable"} ·{" "}
            {formatDate(a.respuestaCliente.fecha)}
          </p>
          {a.respuestaCliente.alternativaElegidaId && (
            <p>
              Alternativa:{" "}
              {
                a.alternativas?.find(
                  (o) => o.id === a.respuestaCliente?.alternativaElegidaId,
                )?.titulo
              }
            </p>
          )}
          <p>{a.respuestaCliente.comentario}</p>
          {a.respuestaCliente.archivoSubidoUrl && (
            <DeliverableRow
              title="Documento enviado"
              url={a.respuestaCliente.archivoSubidoUrl}
            />
          )}
        </div>
      ) : (
        <Button
          primary
          onClick={() => setOpen(true)}
          disabled={preview || !online}
        >
          {a.accionRequeridaTexto || "Responder solicitud"}
        </Button>
      )}
      {open && (
        <Dialog title={a.titulo} onClose={() => setOpen(false)}>
          <div className="stack">
            <p>{a.mensaje}</p>
            <p>Objeto de la respuesta: {task.titulo}</p>
            {task.archivos?.map((f, i) => (
              <DeliverableRow key={i} title={f.nombre} url={f.url} />
            ))}
            {a.adjuntos?.map((f) => (
              <DeliverableRow key={f.id} title={f.nombre} url={f.url} />
            ))}
            {!a.adjuntos?.length &&
              !task.archivos?.length &&
              a.tipo === "aprobar_rechazar" && (
                <p className="muted">
                  La solicitud se refiere al texto de este paso. No tiene
                  archivos adjuntos.
                </p>
              )}
            {a.tipo === "elegir_alternativa" && (
              <fieldset>
                <legend>Elegí una alternativa</legend>
                <div className="options">
                  {a.alternativas?.map((o) => (
                    <div key={o.id}>
                      {o.imagenUrl && (
                        <MediaFigure url={o.imagenUrl} title={o.titulo} />
                      )}
                      <label className="check">
                        <input
                          type="radio"
                          name={`option-${a.id}`}
                          checked={option === o.id}
                          onChange={() => setOption(o.id)}
                        />
                        {o.titulo}
                      </label>
                      <p>{o.descripcion}</p>
                      {o.costoEstimado && <p>{o.costoEstimado}</p>}
                    </div>
                  ))}
                </div>
              </fieldset>
            )}
            {a.tipo === "subir_documento" && (
              <Field
                label="Documento solicitado"
                help="PDF, imagen o texto. Máximo 2 MB en esta demostración."
              >
                <input
                  type="file"
                  accept="application/pdf,image/*,text/plain"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setBusy(true);
                    setError("");
                    try {
                      setFile(await readFile(f));
                      setFileName(f.name);
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </Field>
            )}
            {fileName && <p>Archivo cargado: {fileName}</p>}
            <Field
              label={
                a.tipo === "enviar_informacion"
                  ? "Información solicitada"
                  : "Comentario"
              }
              help="Para solicitar cambios, indicá qué debemos revisar."
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Field>
            {a.tipo === "aprobar_rechazar" &&
              a.adjuntos?.some((f) => !resourceUrl(f.url)) && (
                <p>
                  El estudio debe adjuntar los archivos de la propuesta antes de
                  que puedas aprobarla. Podés solicitar los archivos mediante un
                  comentario.
                </p>
              )}
            <Feedback message={error} />
            <div className="row">
              <Button
                primary
                disabled={
                  !online ||
                  busy ||
                  (a.tipo === "aprobar_rechazar" &&
                    !!a.adjuntos?.some((f) => !resourceUrl(f.url)))
                }
                onClick={() =>
                  submit(
                    a.tipo === "elegir_alternativa"
                      ? "alternativa_elegida"
                      : ["enviar_informacion", "subir_documento"].includes(
                            a.tipo,
                          )
                        ? "info_enviada"
                        : "aprobado",
                  )
                }
              >
                {busy
                  ? "Cargando archivo…"
                  : a.tipo === "aprobar_rechazar"
                    ? "Aprobar propuesta"
                    : "Confirmar respuesta"}
              </Button>
              {a.tipo === "aprobar_rechazar" && (
                <Button onClick={() => submit("requiere_cambios")}>
                  Solicitar cambios
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
export function CommentThread({
  task,
  preview,
  onComment,
}: {
  task: ExecutionTask;
  preview?: boolean;
  onComment?: (id: string, text: string) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  return (
    <details>
      <summary>Comentarios ({task.comentarios?.length || 0})</summary>
      {task.comentarios?.map((c) => (
        <div className="comment" key={c.id}>
          <p className="muted">
            {c.autor} · {formatDate(c.fecha)}
          </p>
          <p>{c.texto}</p>
        </div>
      ))}
      {!preview && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              onComment?.(task.id, text.trim());
              setText("");
              setError("");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <Field label={`Comentario sobre ${task.titulo}`}>
            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>
          <Feedback message={error} />
          <Button type="submit">Agregar comentario</Button>
        </form>
      )}
    </details>
  );
}
export default function Story({
  project: p,
  preview,
  embedded,
  onRespond,
  onComment,
}: {
  project: ProjectData;
  preview?: boolean;
  embedded?: boolean;
  onRespond?: (id: string, actionId: string, r: Response) => void;
  onComment?: (id: string, text: string) => void;
}) {
  const pending = tasks(p).filter(
    (t) => t.accionCliente?.activa && t.accionCliente.estado === "pendiente",
  );
  const settings = getSettings();
  const ProjectHeading = embedded ? "h2" : "h1";
  return (
    <div>
      <header className="cover read-width">
        <p className="muted">
          {p.cliente.nombre}
          {p.info.ubicacion && ` · ${p.info.ubicacion}`}
        </p>
        <ProjectHeading className="project-title">
          {p.info.nombre}
        </ProjectHeading>
        <p>{p.info.subtitulo}</p>
        {p.info.descripcion && <p>{p.info.descripcion}</p>}
        <p className="muted">
          {p.disciplinas.map(disciplineLabel).join(" · ")}
        </p>
        {p.baseContractual?.alcance && (
          <details>
            <summary>Alcance acordado</summary>
            <p>{p.baseContractual.alcance}</p>
          </details>
        )}
        <p className="muted">
          Última actualización: {formatDate(p.info.ultimaActualizacion)}
          {p.info.fechaFin && ` · Fin estimado: ${formatDate(p.info.fechaFin)}`}
        </p>
        <ProgressSummary value={p.progresoTotalCalculado || 0} />
      </header>
      <section className="now read-width" aria-labelledby="now-title">
        <h2 id="now-title">Ahora</h2>
        {pending.length ? (
          <>
            <p>
              Esperando tu respuesta: {pending.length}{" "}
              {pending.length === 1 ? "solicitud" : "solicitudes"}.
            </p>
            {pending.map((t) => (
              <a className="button" key={t.id} href={`#step-${t.id}`}>
                Revisar {t.accionCliente!.titulo}
              </a>
            ))}
          </>
        ) : (
          <p>
            {p.info.etapaActual ||
              (p.progresoTotalCalculado === 0
                ? "Preparado para iniciar"
                : "El proyecto continúa en desarrollo")}
          </p>
        )}
        {p.info.proximoHito && <p>Próximo paso: {p.info.proximoHito}</p>}
      </section>
      <nav aria-label="Necesidades del proyecto" className="section">
        {p.disciplinasOperativas?.flatMap((d) =>
          d.necesidades.map((n) => (
            <a
              className="button"
              key={`${d.id}-${n.id}`}
              href={`#need-${d.id}-${n.id}`}
            >
              {n.nombre} · {disciplineLabel(d.id)}
            </a>
          )),
        )}
      </nav>
      {p.disciplinasOperativas?.map((d) =>
        d.necesidades.map((n) => (
          <section
            className="chapter"
            id={`need-${d.id}-${n.id}`}
            key={`${d.id}-${n.id}`}
          >
            <p className="meta">{disciplineLabel(d.id)}</p>
            <h2>{n.nombre}</h2>
            {n.descripcion && <p className="read-width">{n.descripcion}</p>}
            {n.tareas.map((t) => (
              <article className="section" key={t.id} id={`step-${t.id}`}>
                <div className="row between">
                  <h3>{t.titulo}</h3>
                  <span className="status">{stateLabel(t.estado, true)}</span>
                </div>
                {t.notaCliente && <p className="read-width">{t.notaCliente}</p>}
                {t.fecha && (
                  <p className="muted">Fecha estimada: {formatDate(t.fecha)}</p>
                )}
                {t.archivos?.map((f, i) => (
                  <React.Fragment key={i}>
                    {f.tipo === "imagen" && (
                      <MediaFigure url={f.url} title={f.nombre} />
                    )}
                    <DeliverableRow title={f.nombre} url={f.url} />
                  </React.Fragment>
                ))}
                {t.recursos && <Resources resources={t.recursos} />}
                {t.accionCliente?.activa && (
                  <ClientAction
                    task={t}
                    preview={preview}
                    onRespond={onRespond}
                  />
                )}
                {!!t.historialSolicitudes?.length && (
                  <details>
                    <summary>
                      Solicitudes anteriores ({t.historialSolicitudes.length})
                    </summary>
                    {t.historialSolicitudes.map((h, i) => (
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
                          Reabierta: {formatDate(h.fechaReapertura)} ·{" "}
                          {h.motivo}
                        </p>
                      </div>
                    ))}
                  </details>
                )}
                <CommentThread
                  task={t}
                  preview={preview}
                  onComment={onComment}
                />
              </article>
            ))}
            {!n.tareas.length && (
              <EmptyState>
                El estudio compartirá los próximos pasos de esta necesidad.
              </EmptyState>
            )}
          </section>
        )),
      )}
      {!!p.avances.length && (
        <section className="chapter">
          <h2>Actualizaciones del proyecto</h2>
          {[...p.avances]
            .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))
            .map((a) => (
              <article className="section" key={a.id}>
                <h3>{a.titulo}</h3>
                <p className="muted">
                  {formatDate(a.fecha)} · {a.autor}
                </p>
                <p className="read-width">{a.texto}</p>
                {a.fotos.map((url, i) => (
                  <MediaFigure
                    key={i}
                    url={url}
                    title={`${a.titulo} · Imagen ${i + 1}`}
                  />
                ))}
                {a.archivos?.map((f, i) => (
                  <DeliverableRow key={i} title={f.nombre} url={f.url} />
                ))}
              </article>
            ))}
        </section>
      )}
      {p.baseContractual?.documentosBase?.length ||
      p.documentos.length ||
      p.visualizaciones.galeria.length ||
      p.visualizaciones.tours.length ||
      p.materiales.length ||
      p.decisiones.length ? (
        <section className="chapter">
          <h2>Documentación del proyecto</h2>
          <p className="muted">
            Archivo de documentación existente. Los nuevos entregables se
            incorporan en el paso correspondiente.
          </p>
          {p.baseContractual?.documentosBase?.map((f) => (
            <DeliverableRow
              key={f.id}
              title={f.nombre}
              url={f.url}
              detail={`Documento base · ${formatDate(f.fecha)}`}
            />
          ))}
          <Resources
            resources={{
              documentos: p.documentos,
              visualizaciones: p.visualizaciones.galeria,
              tours: p.visualizaciones.tours,
              materiales: p.materiales,
              decisiones: p.decisiones,
            }}
          />
        </section>
      ) : null}
      <footer className="section">
        <h2>
          {p.lifecycleStatus === "COMPLETADO"
            ? "Proyecto completado"
            : "Seguimos en contacto"}
        </h2>
        <p>{settings.nombre}</p>
        {settings.ciudad && <p>{settings.ciudad}</p>}
        {settings.email && (
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
        )}
        {settings.telefono && <p>{settings.telefono}</p>}
        {settings.ciudad && <p>{settings.ciudad}</p>}
      </footer>
    </div>
  );
}
