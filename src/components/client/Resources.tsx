import React from "react";
import { ExecutionTask } from "../../types";
import { DeliverableRow, MediaFigure, VersionHistory } from "../ui/System";
import { formatDate } from "../../services/portalService";
export default function Resources({
  resources: r,
}: {
  resources: NonNullable<ExecutionTask["recursos"]>;
}) {
  return (
    <>
      {r.documentos?.map((d) => (
        <article className="section" key={d.id}>
          <h3>{d.titulo}</h3>
          {d.revisiones
            .filter((v) => v.esActual)
            .map((v) => (
              <DeliverableRow
                key={v.id}
                title={`${d.titulo} · ${v.numeroRevision}`}
                url={v.url}
                detail={formatDate(v.fecha)}
              />
            ))}
          <VersionHistory versions={d.revisiones} />
        </article>
      ))}
      {r.avances?.map((a) => (
        <article className="section" key={a.id}>
          <h3>{a.titulo}</h3>
          <p className="muted">
            {formatDate(a.fecha)} · {a.autor}
          </p>
          <p>{a.texto}</p>
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
      {r.visualizaciones?.map((g) => (
        <MediaFigure
          key={g.id}
          url={g.imagenUrl}
          title={g.titulo}
          description={g.descripcion}
        />
      ))}
      {r.tours
        ?.filter((t) => t.publicado)
        .map((t) => (
          <article className="section" key={t.id}>
            <h3>{t.titulo}</h3>
            <MediaFigure url={t.planoUrl} title={t.titulo} />
            {t.puntos.map((point) => (
              <MediaFigure
                key={point.id}
                url={point.renderUrl}
                title={point.label}
                description={point.descripcion}
              />
            ))}
          </article>
        ))}
      {r.materiales?.map((m) => (
        <article className="section" key={m.id}>
          <h3>{m.nombre}</h3>
          <p>
            {m.especificacion} · {m.medidas}
          </p>
          <p>
            {m.proveedor} · {m.marca} · {m.modelo}
          </p>
          <p>{m.notas}</p>
          {m.imagenUrl && <MediaFigure url={m.imagenUrl} title={m.nombre} />}
          <div className="options">
            {m.alternativas.map((a) => (
              <div key={a.id}>
                <h3>{a.titulo}</h3>
                <p>{a.especificacion}</p>
                {a.imagenUrl && (
                  <MediaFigure url={a.imagenUrl} title={a.titulo} />
                )}
              </div>
            ))}
          </div>
        </article>
      ))}
      {!!r.decisiones?.length && (
        <details>
          <summary>Registro de decisiones ({r.decisiones.length})</summary>
          <p className="muted">
            Las solicitudes activas se responden en el paso correspondiente.
          </p>
          {r.decisiones.map((d) => (
            <article className="section" key={d.id}>
              <h3>{d.titulo}</h3>
              <p>{d.descripcion}</p>
              <p className="status">
                {d.estado} · {formatDate(d.fechaDecision || d.fechaCreacion)}
              </p>
              {d.archivoAdjuntoUrl && (
                <DeliverableRow title={d.titulo} url={d.archivoAdjuntoUrl} />
              )}
              <div className="options">
                {d.opciones?.map((o) => (
                  <div key={o.id}>
                    <h3>{o.titulo}</h3>
                    <p>{o.descripcion}</p>
                    {o.imagenUrl && (
                      <MediaFigure url={o.imagenUrl} title={o.titulo} />
                    )}
                  </div>
                ))}
              </div>
              {d.comentarios.map((c) => (
                <p key={c.id}>
                  {c.autor}: {c.texto}
                </p>
              ))}
            </article>
          ))}
        </details>
      )}
    </>
  );
}
