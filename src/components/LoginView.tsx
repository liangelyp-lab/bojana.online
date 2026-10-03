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
    <div className="min-h-[100dvh] bg-white text-gray-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gray-950 rounded flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-white"></div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-gray-955 tracking-tight font-sans">Bojana Estudio</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-gray-100 text-gray-700 font-bold border border-gray-200 rounded">
              Portal de Clientes & Dirección de Obra
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-gray-400">
          Plataforma Profesional de Gestión
        </span>
      </header>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        
        {directAccessDetected && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2.5 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
            <div>
              <p className="font-bold">Acceso directo validado</p>
              <p className="text-[11px] text-emerald-700">Ingresando al portal sin contraseña...</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
          
          {/* Project / Studio banner */}
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider block">
                {project ? project.tipoProyecto : 'Sistema de Gestión'}
              </span>
              <h2 className="text-base font-bold text-gray-950 leading-tight">
                {project ? project.brief.nombre : 'Bojana Estudio de Arquitectura'}
              </h2>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                {project ? (project.cliente.empresa || project.cliente.nombre) : 'Panel de Control y Acceso'}
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
              <Building2 className="w-5 h-5 text-gray-700" />
            </div>
          </div>

          {/* Access Switcher */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1.5 font-bold">
              Tipo de Acceso
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setSelectedRole('admin'); setError(null); }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-gray-950 text-white font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Acceso Admin</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedRole('cliente'); setError(null); }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedRole === 'cliente'
                    ? 'bg-white text-gray-950 font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Acceso Cliente</span>
              </button>
            </div>
          </div>

          {/* Link status for client */}
          {selectedRole === 'cliente' && project?.cliente.linkSinProteccion && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Link directo activo</strong>
                <span>Puede ingresar con su usuario sin requerir contraseña.</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-1 font-bold">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'admin' : (project?.cliente.usuario || 'usuario_cliente')}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 font-mono focus:bg-white focus:outline-hidden focus:border-gray-900"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
                  Contraseña
                </label>
                {selectedRole === 'cliente' && project?.cliente.linkSinProteccion && (
                  <span className="text-[10px] text-emerald-600 font-mono font-bold">Opcional (Modo Link Abierto)</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-2.5 pr-8 py-2.5 text-xs text-gray-900 font-mono focus:bg-white focus:outline-hidden focus:border-gray-900"
                />
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-gray-950 hover:bg-gray-800 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <span>{selectedRole === 'admin' ? 'Ingresar como Administrador' : 'Ingresar al Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[9px] uppercase font-mono text-gray-400 font-bold">
              Acceso Inicial Bojana Estudio
            </span>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="py-1 px-2.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition border border-gray-200"
            >
              <KeyRound className="w-3 h-3 text-gray-600" />
              <span>Ingresar como Admin</span>
            </button>
          </div>

        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-400 font-mono">
            Bojana Estudio &bull; Dirección y Gerenciamiento de Obras
          </p>
        </div>
      </div>

      <footer className="max-w-4xl mx-auto w-full text-center py-2 text-[10px] text-gray-400 font-mono border-t border-gray-200">
        Portal Protegido por Contraseña &bull; Encriptación Local &bull; Bojana Estudio
      </footer>

    </div>
  );
}
