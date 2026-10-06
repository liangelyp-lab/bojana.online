import { Brand, Button, Field } from '../ui/DesignSystem';
import DriveConnectionSettings from '../storage/DriveConnectionSettings';
import React, { useState } from 'react';
import {
  Save,
  RotateCcw
} from 'lucide-react';

interface TeamUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface StudioSettingsViewProps {
  onResetDefaults: () => void;
  onToast: (msg: string) => void;
  onActiveUserChange?: (user: TeamUser | null) => void;
}

export default function StudioSettingsView({
  onResetDefaults,
  onToast,
  onActiveUserChange
}: StudioSettingsViewProps) {
  const [studioName, setStudioName] = useState('Bojana Estudio');
  const [studioEmail, setStudioEmail] = useState('contacto@bojanaestudio.com');
  const [studioPhone, setStudioPhone] = useState('+54 9 11 4589-2230');
  const [studioCity, setStudioCity] = useState('Buenos Aires, Argentina');
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => {
    try { return JSON.parse(localStorage.getItem('bojana-studio-users') || '[]'); } catch { return []; }
  });
  const [newUser, setNewUser] = useState({ nombre: '', email: '', rol: '' });

  const addTeamUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUser.nombre.trim() || !newUser.email.trim()) return;
    const user: TeamUser = { id: `user-${Date.now()}`, nombre: newUser.nombre.trim(), email: newUser.email.trim(), rol: newUser.rol.trim() || 'Miembro del estudio' };
    const next = [...teamUsers, user];
    setTeamUsers(next);
    localStorage.setItem('bojana-studio-users', JSON.stringify(next));
    setNewUser({ nombre: '', email: '', rol: '' });
    onActiveUserChange?.(user);
    onToast('Usuario del estudio registrado.');
  };

  const removeTeamUser = (id: string) => {
    const next = teamUsers.filter(user => user.id !== id);
    setTeamUsers(next);
    localStorage.setItem('bojana-studio-users', JSON.stringify(next));
    onToast('Usuario eliminado del equipo.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onToast('Configuración del estudio actualizada correctamente.');
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-line pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
          Preferencias de la firma
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl leading-tight font-normal text-ink">
          Configuración del estudio
        </h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Datos institucionales y parámetros aplicados por defecto a los nuevos portales y entregas.
        </p>
      </div>

      {/* 2-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Studio Profile Form (Column 1 of 2) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="rounded-3xl border border-line bg-white p-7 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-line pb-6">
              <Brand compact />
              <div>
                <h3 className="font-display text-2xl font-normal text-ink">{studioName}</h3>
                <span className="text-xs text-ink-muted">Arquitectura, Construcción, Ingeniería & Diseño</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Nombre del Estudio" type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)} />

              <Field label="Email de Contacto Oficial" type="email" value={studioEmail} onChange={(e) => setStudioEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Teléfono Principal" type="text" value={studioPhone} onChange={(e) => setStudioPhone(e.target.value)} />

              <Field label="Sede / Ciudad" type="text" value={studioCity} onChange={(e) => setStudioCity(e.target.value)} />
            </div>

            <div className="flex justify-end pt-4 border-t border-line">
              <Button type="submit" className="px-6">
                <Save className="size-4" />
                <span>Guardar cambios</span>
              </Button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-12 rounded-3xl border border-line bg-white p-7 shadow-sm space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Accesos internos</p>
            <h3 className="mt-2 font-display text-2xl font-normal text-ink">Equipo del estudio</h3>
            <p className="mt-1 text-sm text-ink-muted">Registrá las personas que pueden ingresar y trabajar en el panel del estudio.</p>
          </div>

          <form onSubmit={addTeamUser} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <Field label="Nombre completo" value={newUser.nombre} onChange={event => setNewUser({ ...newUser, nombre: event.target.value })} placeholder="Nombre y apellido" required />
            <Field label="Email de acceso" type="email" value={newUser.email} onChange={event => setNewUser({ ...newUser, email: event.target.value })} placeholder="nombre@estudio.com" required />
            <Field label="Rol" value={newUser.rol} onChange={event => setNewUser({ ...newUser, rol: event.target.value })} placeholder="Arquitecta, dirección..." />
            <Button type="submit" className="md:mb-0">Agregar usuario</Button>
          </form>

          {teamUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-canvas/50 p-6 text-center text-sm text-ink-muted">Todavía no hay usuarios registrados.</div>
          ) : (
            <div className="divide-y divide-line rounded-2xl border border-line">
              {teamUsers.map(user => (
                <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{user.nombre}</p>
                    <p className="text-xs text-ink-muted">{user.email} · {user.rol}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => { onActiveUserChange?.(user); onToast(`${user.nombre} es ahora el usuario visible.`); }}>Usar en navegación</Button>
                    <Button variant="ghost" onClick={() => removeTeamUser(user.id)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Storage & System Operations (Column 2 of 2) */}
        <div className="lg:col-span-5 space-y-6">
          <DriveConnectionSettings />

          {/* Local data cleanup */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-sm space-y-4">
            <div>
              <h4 className="font-display text-xl font-normal text-ink">Restablecer datos</h4>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Elimina los proyectos y clientes guardados en este navegador para comenzar con un espacio vacío.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Eliminar todos los proyectos y clientes guardados localmente?')) {
                  onResetDefaults();
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-xs font-semibold text-ink hover:bg-stone hover:border-line-strong active:scale-[0.98] transition cursor-pointer"
            >
              <RotateCcw className="size-3.5 text-ink-muted" />
              <span>Eliminar datos locales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
