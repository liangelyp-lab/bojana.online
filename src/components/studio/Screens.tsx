import React, { useState } from "react";
import { ProjectData, DisciplinaType } from "../../types";
import { Button, Field, Dialog, EmptyState, Feedback } from "../ui/System";
import {
  progress,
  disciplineLabel,
  getSettings,
  uid,
  readFile,
} from "../../services/portalService";
export function ProjectRows({
  projects,
  onSelect,
}: {
  projects: ProjectData[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      {projects.map((p) => (
        <button
          className="project-row"
          key={p.id}
          onClick={() => onSelect(p.id)}
        >
          <span>
            <strong>{p.info.nombre}</strong>
            <span>
              {p.cliente.nombre} ·{" "}
              {p.disciplinas.map(disciplineLabel).join(" · ")}
            </span>
            <span className="muted">
              {p.info.proximoHito || "Próximo paso por definir"}
            </span>
          </span>
          <span className="status">
            {p.lifecycleStatus === "BORRADOR"
              ? "Preparación"
              : p.lifecycleStatus === "COMPLETADO"
                ? "Completado"
                : "Activo"}{" "}
            · {progress(p)}%
          </span>
        </button>
      ))}
      {!projects.length && (
        <EmptyState>No hay proyectos para mostrar.</EmptyState>
      )}
    </div>
  );
}
export function ProjectList({
  projects,
  onSelect,
  dashboard,
}: {
  projects: ProjectData[];
  onSelect: (id: string) => void;
  dashboard?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = projects.filter(
    (p) =>
      (filter === "all" ||
        (filter === "active"
          ? p.lifecycleStatus !== "COMPLETADO"
          : p.lifecycleStatus === "COMPLETADO")) &&
      `${p.info.nombre} ${p.cliente.nombre}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div>
      <h1>{dashboard ? "Inicio del estudio" : "Proyectos"}</h1>
      {dashboard && (
        <p className="read-width">Proyectos y próximos pasos del estudio.</p>
      )}
      <div className="form-grid">
        <Field label="Buscar proyecto o cliente">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Estado del proyecto">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="active">En preparación o activos</option>
            <option value="done">Completados</option>
          </select>
        </Field>
      </div>
      <ProjectRows projects={filtered} onSelect={onSelect} />
      {!filtered.length && (search || filter !== "all") && (
        <Button
          onClick={() => {
            setSearch("");
            setFilter("all");
          }}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
export function Clients({
  projects,
  onSelect,
}: {
  projects: ProjectData[];
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const groups = projects.reduce<Record<string, ProjectData[]>>((groups, p) => {
    const key = p.cliente.email || p.cliente.nombre;
    (groups[key] ||= []).push(p);
    return groups;
  }, {});
  const visible = Object.entries(groups).filter(([, ps]) =>
    `${ps![0].cliente.nombre} ${ps![0].cliente.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div>
      <h1>Clientes</h1>
      <Field label="Buscar cliente">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Field>
      {visible.map(([key, ps]) => (
        <section className="section" key={key}>
          <h2>{ps![0].cliente.nombre}</h2>
          <p>{ps![0].cliente.empresa}</p>
          {ps![0].cliente.email && (
            <p>
              <a href={`mailto:${ps![0].cliente.email}`}>
                {ps![0].cliente.email}
              </a>
            </p>
          )}
          <ProjectRows projects={ps!} onSelect={onSelect} />
        </section>
      ))}
      {!visible.length && (
        <EmptyState>
          No encontramos clientes con ese criterio.{" "}
          {search && (
            <Button onClick={() => setSearch("")}>Limpiar búsqueda</Button>
          )}
        </EmptyState>
      )}
    </div>
  );
}
export function Settings({ onReset }: { onReset: () => void }) {
  const [settings, setSettings] = useState(getSettings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="read-width">
      <h1>Configuración del estudio</h1>
      <p>Datos de contacto utilizados en el portal y los avisos preparados.</p>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            localStorage.setItem("BOJANA_SETTINGS", JSON.stringify(settings));
            setSaved(true);
            setError("");
          } catch {
            setError(
              "No pudimos guardar la configuración. Revisá el almacenamiento del navegador.",
            );
          }
        }}
      >
        {[
          ["nombre", "Nombre del estudio"],
          ["email", "Email de contacto"],
          ["telefono", "Teléfono"],
          ["ciudad", "Ciudad"],
        ].map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              required={key === "nombre"}
              type={key === "email" ? "email" : "text"}
              value={settings[key]}
              onChange={(e) => {
                setSettings({ ...settings, [key]: e.target.value });
                setSaved(false);
              }}
            />
          </Field>
        ))}
        <Button primary type="submit">
          Guardar configuración
        </Button>
        {saved && <p role="status">Configuración guardada.</p>}
        <Feedback message={error} />
      </form>
      <section className="section">
        <h2>Datos de demostración</h2>
        <p>
          Esta acción reemplaza todos los proyectos de este navegador por el
          ejemplo inicial. Se perderán los cambios locales.
        </p>
        <Button
          onClick={() => {
            if (
              window.confirm(
                "Restablecer todos los proyectos de este navegador elimina tus cambios locales. ¿Querés continuar?",
              )
            )
              onReset();
          }}
        >
          Restablecer demostración
        </Button>
      </section>
    </div>
  );
}
export function NewProject({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: ProjectData) => void;
}) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scope, setScope] = useState("");
  const [client, setClient] = useState("");
  const [email, setEmail] = useState("");
  const [place, setPlace] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [next, setNext] = useState("");
  const [disc, setDisc] = useState<DisciplinaType[]>([]);
  const [docs, setDocs] = useState<
    NonNullable<ProjectData["baseContractual"]>["documentosBase"]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (![name, purpose, scope, client, next].every((value) => value.trim()))
        throw new Error(
          "Completá identidad, propósito, alcance, cliente y próximo paso.",
        );
      if (!disc.length) throw new Error("Elegí al menos una disciplina.");
      if (start && end && end < start)
        throw new Error("El fin no puede ser anterior al inicio.");
      const now = new Date().toISOString();
      onCreate({
        id: uid(),
        lifecycleStatus: "BORRADOR",
        progresoTotalCalculado: 0,
        info: {
          nombre: name.trim(),
          subtitulo: "",
          descripcion: purpose.trim(),
          ubicacion: place.trim(),
          superficie: "",
          estadoGeneral: "En Planificación",
          etapaActual: "Preparado para iniciar",
          proximoHito: next.trim(),
          ultimaActualizacion: now,
          fechaInicio: start,
          fechaFin: end,
          publicado: false,
          portalPublicado: false,
        },
        baseContractual: {
          alcance: scope.trim(),
          presupuestoAprobado: true,
          plazoInicio: start,
          plazoFin: end,
          documentosBase: docs,
        },
        disciplinas: disc,
        disciplinasOperativas: disc.map((d) => ({ id: d, necesidades: [] })),
        cliente: {
          nombre: client.trim(),
          email: email.trim(),
          empresa: "",
          telefono: "",
          usuario: "",
          linkSinProteccion: false,
          dedicatedToken: uid(),
        },
        equipo: [],
        modulos: [],
        progreso: [],
        avances: [],
        documentos: [],
        visualizaciones: { galeria: [], tours: [] },
        decisiones: [],
        materiales: [],
        ultimaModificacion: now,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <Dialog title="Crear proyecto" onClose={onClose}>
      <form className="stack" onSubmit={create}>
        <p>
          Registrá un proyecto con presupuesto aprobado. La ejecución comienza
          en 0% y el portal permanece sin publicar.
        </p>
        <Field label="Nombre del proyecto">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Resultado esperado">
          <textarea
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </Field>
        <Field label="Alcance acordado">
          <textarea
            required
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Cliente responsable">
            <input
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          </Field>
          <Field label="Email del cliente">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Ubicación">
          <input value={place} onChange={(e) => setPlace(e.target.value)} />
        </Field>
        <div className="form-grid">
          <Field label="Inicio estimado">
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="Fin estimado">
            <input
              type="date"
              min={start || undefined}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
        </div>
        <fieldset>
          <legend>Disciplinas contratadas</legend>
          {(
            [
              "Arquitectura",
              "Ingeniería",
              "Diseño",
              "Construcción",
            ] as DisciplinaType[]
          ).map((d) => (
            <label className="check" key={d}>
              <input
                type="checkbox"
                checked={disc.includes(d)}
                onChange={(e) =>
                  setDisc(
                    e.target.checked
                      ? [...disc, d]
                      : disc.filter((x) => x !== d),
                  )
                }
              />
              {disciplineLabel(d)}
            </label>
          ))}
        </fieldset>
        <Field label="Primer próximo paso">
          <input
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field
          label="Documentos base"
          help="PDF, imágenes o texto. Máximo 2 MB por archivo en esta demostración."
        >
          <input
            type="file"
            multiple
            accept="application/pdf,image/*,text/plain"
            disabled={busy}
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              setBusy(true);
              try {
                const entries = await Promise.all(
                  files.map(async (f) => ({
                    id: uid(),
                    nombre: f.name,
                    tipo: "otros" as const,
                    url: await readFile(f),
                    fecha: new Date().toISOString(),
                  })),
                );
                setDocs([...(docs || []), ...entries]);
                setError("");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </Field>
        {docs?.map((d) => (
          <p key={d.id}>{d.nombre}</p>
        ))}
        <Feedback message={error} />
        <Button primary type="submit" disabled={busy}>
          {busy ? "Cargando documentos…" : "Crear proyecto"}
        </Button>
      </form>
    </Dialog>
  );
}
