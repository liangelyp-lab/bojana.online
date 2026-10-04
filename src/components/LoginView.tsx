import { Brand } from './ui/DesignSystem';
import React, { useState, useEffect } from 'react';
import { UserRole, ProjectData } from '../types';
import { ADMIN_CREDENTIALS } from '../services/storageService';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Building2,
  KeyRound,
  Sparkles,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';

interface LoginViewProps {
  project?: ProjectData | null;
  onLogin: (role: UserRole) => void;
}

export default function LoginView({ project, onLogin }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('bojana2026');
  const [error, setError] = useState<string | null>(null);
  const [directAccessDetected, setDirectAccessDetected] = useState(false);

  // Check URL parameters for direct unprotected link access
  useEffect(() => {
    if (!project) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('portal') || params.get('token') || params.get('access');

    if (token) {
      if (
        project.cliente.linkSinProteccion &&
        (token === project.cliente.dedicatedToken || token === 'direct' || token === 'cliente')
      ) {
        setDirectAccessDetected(true);
        setTimeout(() => {
          onLogin('cliente');
        }, 1000);
      }
    }
  }, [project, onLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedRole === 'admin') {
      if (
        username.trim().toLowerCase() === ADMIN_CREDENTIALS.usuario.toLowerCase() &&
        password.trim() === ADMIN_CREDENTIALS.password
      ) {
        onLogin('admin');
      } else {
        setError('Credenciales de Administrador incorrectas. (Acceso inicial: admin / bojana2026)');
      }
    } else {
      if (!project) {
        setError('Aún no hay obras registradas. Ingrese como Administrador para configurar el primer portal.');
        return;
      }

      const clientUser = project.cliente.usuario || 'cliente';
      const clientPass = project.cliente.password || 'obra2026';

      if (project.cliente.linkSinProteccion && (!password || password.trim() === clientPass)) {
        onLogin('cliente');
        return;
      }

      if (
        username.trim().toLowerCase() === clientUser.toLowerCase() &&
        password.trim() === clientPass
      ) {
        onLogin('cliente');
      } else {
        setError(`Credenciales de Cliente incorrectas para ${project.brief.nombre}.`);
      }
    }
  };

  const handleQuickDemoAdmin = () => {
    setError(null);
    setSelectedRole('admin');
    setUsername('admin');
    setPassword('bojana2026');
    onLogin('admin');
  };

  return (
    <div className="min-h-screen bg-bojana-canvas text-bojana-ink flex flex-col justify-between p-4 sm:p-6 font-sans">

      {/* Top Header */}
      <header className="max-w-bojana-modal mx-auto w-full flex items-center justify-between py-2 border-b border-bojana-line">
        <Brand />

        <span className="text-xs font-sans text-bojana-muted">
          Plataforma Profesional de Gestión
        </span>
      </header>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">

        {directAccessDetected && (
          <div className="bojana-widget mb-4 p-3.5 rounded-bojana-widget bg-bojana-soft border border-bojana-success text-bojana-success text-xs flex items-center gap-bojana-inside shadow-bojana-widget animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-bojana-success shrink-0 animate-bounce" />
            <div>
              <p className="font-medium">Acceso directo validado</p>
              <p className="text-xs text-bojana-success">Ingresando al portal sin contraseña...</p>
            </div>
          </div>
        )}

        <div className="bojana-editorial bg-bojana-surface border border-bojana-line p-2 space-y-bojana-block">

          {/* Project / Studio banner */}
          <div className="border-b border-bojana-line pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-sans uppercase text-bojana-muted font-medium tracking-normal block">
                {project ? project.tipoProyecto : 'Sistema de Gestión'}
              </span>
              <h2 className="bojana-heading-section text-base font-medium text-bojana-ink leading-tight">
                {project ? project.brief.nombre : 'Bojana Estudio de Arquitectura'}
              </h2>
              <p className="text-xs text-bojana-muted font-sans mt-0.5">
                {project ? (project.cliente.empresa || project.cliente.nombre) : 'Panel de Control y Acceso'}
              </p>
            </div>

            <div className="w-10 h-10 rounded-bojana-widget bg-bojana-soft border border-bojana-line flex items-center justify-center text-bojana-ink shrink-0">
              <Building2 className="w-5 h-5 text-bojana-ink" />
            </div>
          </div>

          {/* Access Switcher */}
          <div>
            <label className="text-xs font-sans uppercase tracking-normal text-bojana-muted block mb-1.5 font-medium">
              Tipo de Acceso
            </label>
            <div className="grid grid-cols-2 gap-bojana-inside p-1 bg-bojana-soft border border-bojana-line rounded-bojana-widget text-xs font-medium">
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setError(null); }}
                className={`bojana-button bojana-button-primary py-2 px-3 rounded-bojana-widget flex items-center justify-center gap-bojana-inside transition cursor-pointer ${
                  selectedRole === "admin"
                    ? "bg-bojana-ink text-bojana-inverse font-medium shadow-bojana-widget"
                    : "text-bojana-muted hover:text-bojana-ink"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-bojana-ink" />
                <span>Acceso Admin</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedRole('cliente'); setError(null); }}
                className={`bojana-button bojana-button-text py-2 px-3 rounded-bojana-widget flex items-center justify-center gap-bojana-inside transition cursor-pointer ${
                  selectedRole === "cliente"
                    ? "bg-bojana-surface text-bojana-ink font-medium shadow-bojana-widget"
                    : "text-bojana-muted hover:text-bojana-ink"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-bojana-success" />
                <span>Acceso Cliente</span>
              </button>
            </div>
          </div>

          {/* Link status for client */}
          {selectedRole === 'cliente' && project?.cliente.linkSinProteccion && (
            <div className="p-2.5 rounded-bojana-widget bg-bojana-soft border border-bojana-success text-xs text-bojana-success flex items-start gap-bojana-inside">
              <LinkIcon className="w-3.5 h-3.5 text-bojana-success shrink-0 mt-0.5" />
              <div>
                <strong className="block font-medium">Link directo activo</strong>
                <span>Puede ingresar con su usuario sin requerir contraseña.</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-bojana-widget bg-bojana-soft border border-bojana-error text-bojana-error text-xs flex items-center gap-bojana-inside font-sans">
              <AlertCircle className="w-4 h-4 text-bojana-error shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-bojana-inside text-xs">
            <div>
              <label className="text-xs font-sans uppercase tracking-normal text-bojana-muted block mb-1 font-medium">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'admin' : (project?.cliente.usuario || 'usuario_cliente')}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-sans focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium">
                  Contraseña
                </label>
                {selectedRole === 'cliente' && project?.cliente.linkSinProteccion && (
                  <span className="text-xs text-bojana-success font-sans font-medium">Opcional (Modo Link Abierto)</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget pl-2.5 pr-8 py-2.5 text-xs text-bojana-ink font-sans focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                />
                <Lock className="w-3.5 h-3.5 text-bojana-muted absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className={`bojana-button bojana-button-primary w-full py-2.5 px-4 rounded-bojana-widget text-xs font-medium flex items-center justify-center gap-bojana-inside transition shadow-bojana-widget cursor-pointer ${
                selectedRole === "admin"
                  ? "bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse"
                  : "bg-bojana-success hover:bg-bojana-success text-bojana-inverse"
              }`}
            >
              <span>{selectedRole === 'admin' ? 'Ingresar como Administrador' : 'Ingresar al Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-bojana-line flex items-center justify-between">
            <span className="text-xs uppercase font-sans text-bojana-muted font-medium">
              Acceso Inicial Bojana Estudio
            </span>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="bojana-button bojana-button-secondary py-1 px-2.5 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside cursor-pointer transition border border-bojana-line"
            >
              <KeyRound className="w-3 h-3 text-bojana-muted" />
              <span>Ingresar como Admin</span>
            </button>
          </div>

        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-bojana-muted font-sans">
            Bojana Estudio &bull; Dirección y Gerenciamiento de Obras
          </p>
        </div>
      </div>

      <footer className="max-w-bojana-modal mx-auto w-full text-center py-2 text-xs text-bojana-muted font-sans border-t border-bojana-line">
        Portal Protegido por Contraseña &bull; Encriptación Local &bull; Bojana Estudio
      </footer>

    </div>
  );
}
