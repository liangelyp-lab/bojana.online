import React, { useEffect, useState } from "react";
import {
  getAllProjects,
  saveProjectData,
  resetProjectDataToDefault,
} from "./services/storageService";
import { ProjectData } from "./types";
import {
  visibleContent,
  respond,
  changeTask,
  tasks,
  uid,
} from "./services/portalService";
import {
  Button,
  EmptyState,
  Feedback,
  useOnline,
} from "./components/ui/System";
import {
  ProjectList,
  Clients,
  Settings,
  NewProject,
} from "./components/studio/Screens";
import Workspace from "./components/studio/Workspace";
import Story from "./components/client/Story";
export default function App() {
  const online = useOnline();
  const [projects, setProjects] = useState(getAllProjects);
  const [role, setRole] = useState<"admin" | "cliente" | "consulta" | null>(
    null,
  );
  const [selected, setSelected] = useState<string>();
  const [page, setPage] = useState("inicio");
  const [preview, setPreview] = useState(false);
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const p = projects.find((p) => p.id === selected);
  const published = p?.publicacion?.contenido;
  useEffect(() => {
    const token = new URLSearchParams(location.search).get("portal");
    if (token) {
      const matched = projects.find(
        (p) => p.cliente.dedicatedToken === token && p.publicacion,
      );
      if (matched) {
        setSelected(matched.id);
        setRole("cliente");
      } else
        setError(
          "El enlace no corresponde a una publicación disponible en este navegador.",
        );
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.getElementById("main-content")?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page, selected, preview, role]);
  const update = (next: ProjectData) => {
    saveProjectData(next);
    setProjects(getAllProjects());
  };
  const logout = () => {
    setRole(null);
    setSelected(undefined);
    setPreview(false);
    history.replaceState({}, "", location.pathname);
  };
  const select = (id: string) => {
    setSelected(id);
    setError("");
  };
  const clientMode = role === "cliente" || role === "consulta" || preview;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <header className="site-header">
        <div className="shell row between">
          <Button
            className="brand"
            onClick={() => {
              if (role === "admin") {
                setSelected(undefined);
                setPreview(false);
                setPage("inicio");
              }
            }}
          >
            Bojana
          </Button>
          {role === "admin" && !preview && (
            <>
              <nav aria-label="Navegación del estudio">
                {[
                  ["inicio", "Inicio"],
                  ["proyectos", "Proyectos"],
                  ["clientes", "Clientes"],
                  ["configuracion", "Configuración"],
                ].map(([id, label]) => (
                  <Button
                    key={id}
                    aria-current={
                      (selected ? "proyectos" : page) === id
                        ? "page"
                        : undefined
                    }
                    onClick={() => {
                      setSelected(undefined);
                      setPage(id);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </nav>
              <Button primary onClick={() => setCreate(true)}>
                Nuevo proyecto
              </Button>
            </>
          )}
          {role && (
            <div className="row">
              {preview && (
                <Button onClick={() => setPreview(false)}>
                  Volver al estudio
                </Button>
              )}
              <Button onClick={logout}>Salir</Button>
            </div>
          )}
        </div>
      </header>
      {!online && (
        <p className="shell error" role="status">
          Sin conexión. Podés leer y editar lo guardado. Recuperá la conexión
          antes de publicar o responder.
        </p>
      )}
      <main
        className={`shell ${p && !clientMode ? "workspace-shell" : ""}`}
        id="main-content"
        tabIndex={-1}
      >
        {!role ? (
          <div className="read-width stack">
            <h1>Portal de proyectos</h1>
            <p>
              Demostración local de Bojana Estudio. Los datos se guardan
              únicamente en este navegador; no es un acceso autenticado a
              proyectos de producción.
            </p>
            <Button primary onClick={() => setRole("admin")}>
              Abrir demostración del estudio
            </Button>
            <h2>Consultar una publicación</h2>
            <p>Elegí el proyecto publicado que querés consultar.</p>
            {projects
              .filter((p) => p.publicacion)
              .map((p) => (
                <Button
                  key={p.id}
                  onClick={() => {
                    select(p.id);
                    setRole("cliente");
                  }}
                >
                  {p.info.nombre}
                </Button>
              ))}
            {!projects.some((p) => p.publicacion) && (
              <EmptyState>
                Publicá una versión desde el estudio para consultar el portal.
              </EmptyState>
            )}
            {projects
              .filter((p) => p.publicacion)
              .map((p) => (
                <Button
                  key={`read-${p.id}`}
                  onClick={() => {
                    select(p.id);
                    setRole("consulta");
                  }}
                >
                  Consultar {p.info.nombre} sin responder
                </Button>
              ))}
            <Feedback message={error} />
          </div>
        ) : clientMode ? (
          published ? (
            <>
              <p className="meta">
                {preview ? "Vista previa de la versión publicada · " : ""}
                Versión {p!.publicacion!.version}
              </p>
              {role === "consulta" && (
                <p className="muted">
                  Vista de consulta. Las respuestas corresponden al cliente
                  responsable.
                </p>
              )}
              <Story
                project={published}
                preview={preview || role === "consulta"}
                onRespond={(id, actionId, r) => {
                  update(
                    respond(p!, id, actionId, {
                      ...r,
                      autor: p!.cliente.nombre,
                    }),
                  );
                  setToast("Respuesta registrada en el paso.");
                }}
                onComment={(id, text) => {
                  if (!text) throw new Error("Escribí un comentario.");
                  const publicTask = tasks(published).find((t) => t.id === id);
                  if (!publicTask)
                    throw new Error("Este paso ya no está disponible.");
                  const c = {
                    id: uid(),
                    autor: p!.cliente.nombre,
                    rol: "cliente" as const,
                    fecha: new Date().toISOString(),
                    texto: text,
                  };
                  const draft = changeTask(p!, id, {
                    comentarios: [
                      ...(tasks(p!).find((t) => t.id === id)?.comentarios ||
                        []),
                      c,
                    ],
                  });
                  const content = changeTask(published, id, {
                    comentarios: [...(publicTask.comentarios || []), c],
                  });
                  update({
                    ...draft,
                    publicacion: {
                      ...p!.publicacion!,
                      contenido: {
                        ...content,
                        progresoTotalCalculado:
                          published.progresoTotalCalculado,
                      },
                    },
                  });
                  setToast("Comentario registrado.");
                }}
              />
            </>
          ) : (
            <EmptyState>
              Este proyecto todavía no tiene una versión publicada.
            </EmptyState>
          )
        ) : p ? (
          <Workspace
            key={p.id}
            project={p}
            onUpdate={update}
            onBack={() => {
              setSelected(undefined);
              setPage("proyectos");
            }}
            onPreview={() => setPreview(true)}
          />
        ) : page === "clientes" ? (
          <Clients projects={projects} onSelect={select} />
        ) : page === "configuracion" ? (
          <Settings
            onReset={() => {
              try {
                setProjects(resetProjectDataToDefault());
                setSelected(undefined);
                setToast("Demostración restablecida.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        ) : (
          <ProjectList
            projects={projects}
            onSelect={select}
            dashboard={page === "inicio"}
          />
        )}
      </main>
      <footer className="demo-note">
        Demostración local · Cambios guardados en este navegador. No hay envío
        de email ni autenticación de producción.
      </footer>
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
      {create && (
        <NewProject
          onClose={() => setCreate(false)}
          onCreate={(p) => {
            update(p);
            select(p.id);
            setCreate(false);
            setToast("Proyecto creado en 0%.");
          }}
        />
      )}
    </>
  );
}
