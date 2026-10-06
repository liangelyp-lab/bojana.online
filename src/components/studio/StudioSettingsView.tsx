import { Brand, Button, Field } from '../ui/DesignSystem';
import DriveConnectionSettings from '../storage/DriveConnectionSettings';
import React, { useState } from 'react';
import {
  Save,
  RotateCcw
} from 'lucide-react';

interface StudioSettingsViewProps {
  onResetDefaults: () => void;
  onToast: (msg: string) => void;
}

export default function StudioSettingsView({
  onResetDefaults,
  onToast
}: StudioSettingsViewProps) {
  const [studioName, setStudioName] = useState('Bojana Estudio');
  const [studioEmail, setStudioEmail] = useState('contacto@bojanaestudio.com');
  const [studioPhone, setStudioPhone] = useState('+54 9 11 4589-2230');
  const [studioCity, setStudioCity] = useState('Buenos Aires, Argentina');

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
