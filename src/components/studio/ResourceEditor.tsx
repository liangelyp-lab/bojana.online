import React, { useState } from "react";
import { Button, Field, Dialog, Feedback } from "../ui/System";
import {
  readFile,
  resourceUrl,
  ResourceKind,
  uid,
} from "../../services/portalService";
const fields: Record<ResourceKind, Record<string, string>> = {
  documentos: {
    titulo: "Nombre del entregable",
    categoria: "Categoría",
    formato: "Formato",
  },
  avances: {
    titulo: "Título de la actualización",
    texto: "Descripción del avance",
    fecha: "Fecha",
    autor: "Autor",
    categoria: "Categoría",
  },
  visualizaciones: {
    titulo: "Título de la imagen",
    descripcion: "Descripción",
    imagenUrl: "URL de imagen",
    fecha: "Fecha",
    categoria: "Categoría",
  },
  tours: { titulo: "Título del plano", planoUrl: "URL del plano" },
  materiales: {
    nombre: "Nombre del material",
    especificacion: "Especificación",
    proveedor: "Proveedor",
    marca: "Marca",
    modelo: "Modelo",
    medidas: "Medidas",
    notas: "Notas",
    imagenUrl: "URL de imagen",
  },
  decisiones: { titulo: "Objeto de la decisión", descripcion: "Descripción" },
};
export default function ResourceEditor({
  kind,
  item,
  onClose,
  onSave,
}: {
  kind: ResourceKind;
  item: any;
  onClose: () => void;
  onSave: (item: any) => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(item));
  const [file, setFile] = useState<{ url: string; nombre: string }>();
  const [revision, setRevision] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key: string, value: any) => setDraft({ ...draft, [key]: value });
  return (
    <Dialog title={`Editar ${item.titulo || item.nombre}`} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            if (!String(draft.titulo || draft.nombre || "").trim())
              throw new Error("El recurso necesita un nombre.");
            for (const key of ["imagenUrl", "planoUrl"])
              if (draft[key] && !resourceUrl(draft[key]))
                throw new Error("Usá una URL válida de archivo.");
            let next = draft;
            if (file) {
              if (kind === "documentos") {
                if (!revision.trim() || !reason.trim())
                  throw new Error("Indicá versión y motivo de la revisión.");
                next = {
                  ...draft,
                  revisiones: [
                    ...draft.revisiones.map((r: any) => ({
                      ...r,
                      esActual: false,
                    })),
                    {
                      id: uid(),
                      numeroRevision: revision,
                      fecha: new Date().toISOString(),
                      url: file.url,
                      cambios: reason,
                      esActual: true,
                    },
                  ],
                };
              } else if (kind === "avances")
                next = { ...draft, fotos: [...(draft.fotos || []), file.url] };
              else if (kind === "tours")
                next = { ...draft, planoUrl: file.url };
              else if (kind === "materiales" || kind === "visualizaciones")
                next = { ...draft, imagenUrl: file.url };
            }
            onSave(next);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        {Object.entries(fields[kind]).map(([key, label]) => (
          <Field key={key} label={label}>
            {["texto", "descripcion", "notas"].includes(key) ? (
              <textarea
                value={draft[key] || ""}
                onChange={(e) => set(key, e.target.value)}
              />
            ) : (
              <input
                required={key === "titulo" || key === "nombre"}
                type={key === "fecha" ? "date" : "text"}
                value={
                  key === "fecha" && !/^\d{4}-/.test(draft[key] || "")
                    ? ""
                    : draft[key] || ""
                }
                onChange={(e) => set(key, e.target.value)}
              />
            )}
          </Field>
        ))}
        {kind === "tours" && (
          <>
            <label className="check">
              <input
                type="checkbox"
                checked={draft.publicado}
                onChange={(e) => set("publicado", e.target.checked)}
              />
              Incluir el plano en la próxima publicación
            </label>
            {draft.puntos.map((point: any, i: number) => (
              <fieldset key={point.id}>
                <legend>Punto {i + 1}</legend>
                {[
                  ["label", "Nombre"],
                  ["descripcion", "Descripción"],
                  ["renderUrl", "URL de imagen"],
                  ["x", "Posición horizontal (%)"],
                  ["y", "Posición vertical (%)"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input
                      type={key === "x" || key === "y" ? "number" : "text"}
                      min={key === "x" || key === "y" ? 0 : undefined}
                      max={key === "x" || key === "y" ? 100 : undefined}
                      value={point[key] ?? ""}
                      onChange={(e) =>
                        set(
                          "puntos",
                          draft.puntos.map((p: any) =>
                            p.id === point.id
                              ? {
                                  ...p,
                                  [key]:
                                    key === "x" || key === "y"
                                      ? Number(e.target.value)
                                      : e.target.value,
                                }
                              : p,
                          ),
                        )
                      }
                    />
                  </Field>
                ))}
              </fieldset>
            ))}
          </>
        )}
        {kind === "materiales" &&
          draft.alternativas.map((alt: any, i: number) => (
            <fieldset key={alt.id}>
              <legend>Alternativa {i + 1}</legend>
              {[
                ["titulo", "Nombre"],
                ["especificacion", "Especificación"],
                ["imagenUrl", "URL de imagen"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    value={alt[key] || ""}
                    onChange={(e) =>
                      set(
                        "alternativas",
                        draft.alternativas.map((a: any) =>
                          a.id === alt.id ? { ...a, [key]: e.target.value } : a,
                        ),
                      )
                    }
                  />
                </Field>
              ))}
            </fieldset>
          ))}
        {kind !== "decisiones" && (
          <Field
            label={
              kind === "documentos"
                ? "Adjuntar nueva revisión"
                : "Adjuntar imagen o plano"
            }
            help={`Máximo 2 MB. ${kind === "documentos" ? "Se conservarán las versiones anteriores." : "El archivo aparecerá con este recurso."}`}
          >
            <input
              disabled={busy}
              type="file"
              accept={
                kind === "documentos"
                  ? "application/pdf,image/*,text/plain"
                  : "image/*"
              }
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                try {
                  setFile({ url: await readFile(f), nombre: f.name });
                  setError("");
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Field>
        )}
        {file && <p>Archivo cargado: {file.nombre}</p>}
        {kind === "documentos" && file && (
          <>
            <Field label="Número o nombre de versión">
              <input
                required
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
              />
            </Field>
            <Field label="Qué cambió y por qué">
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          </>
        )}
        {kind === "decisiones" && (
          <p>
            Las respuestas se registran desde la solicitud contextual del paso.
            Este formulario conserva el registro anterior.
          </p>
        )}
        <Feedback message={error} />
        <Button primary type="submit" disabled={busy}>
          {busy ? "Cargando archivo…" : "Guardar recurso"}
        </Button>
      </form>
    </Dialog>
  );
}
