import { Brand } from '../ui/DesignSystem';
import DriveConnectionSettings from '../storage/DriveConnectionSettings';
import React, { useState } from 'react';
import {
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  Save,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { resetProjectDataToDefault } from '../../services/storageService';

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
    <div className="max-w-3xl mx-auto space-y-bojana-block py-2 animate-fade-in text-xs font-sans">

      {/* Header */}
      <div>
        <h1 className="bojana-heading-page text-2xl font-medium text-bojana-ink font-sans tracking-normal">
          Configuración del Estudio
        </h1>
        <p className="text-xs text-bojana-muted mt-0.5">
          Datos generales de Bojana Estudio aplicados por defecto a los nuevos portales.
        </p>
      </div>

      <form onSubmit={handleSave} className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget space-y-bojana-block">

        <div className="flex items-center gap-bojana-block border-b border-bojana-line pb-5">
          <Brand compact />
          <div>
            <h3 className="bojana-heading-component text-base font-medium text-bojana-ink font-sans">{studioName}</h3>
            <span className="text-xs font-sans text-bojana-muted">Arquitectura, Construcción, Ingeniería & Diseño</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-block">
          <div>
            <label className="font-sans text-bojana-muted font-medium block mb-1">Nombre del Estudio</label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-medium focus:bg-bojana-surface"
            />
          </div>

          <div>
            <label className="font-sans text-bojana-muted font-medium block mb-1">Email de Contacto Oficial</label>
            <input
              type="email"
              value={studioEmail}
              onChange={(e) => setStudioEmail(e.target.value)}
              className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-sans focus:bg-bojana-surface"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-bojana-block">
          <div>
            <label className="font-sans text-bojana-muted font-medium block mb-1">Teléfono Principal</label>
            <input
              type="text"
              value={studioPhone}
              onChange={(e) => setStudioPhone(e.target.value)}
              className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink font-sans focus:bg-bojana-surface"
            />
          </div>

          <div>
            <label className="font-sans text-bojana-muted font-medium block mb-1">Sede / Ciudad</label>
            <input
              type="text"
              value={studioCity}
              onChange={(e) => setStudioCity(e.target.value)}
              className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-bojana-line">
          <button
            type="submit"
            className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse font-sans font-medium text-xs flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Cambios</span>
          </button>
        </div>

      </form>

      <DriveConnectionSettings />

      {/* Demo Reset Card */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 flex items-center justify-between gap-bojana-block">
        <div>
          <h4 className="bojana-heading-component font-medium text-bojana-ink text-xs">Restablecer Datos de Demostración</h4>
          <p className="text-xs text-bojana-muted mt-0.5">
            Restaura el proyecto inicial (Los Alisos) con sus datos de prueba.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('¿Restablecer los proyectos de demostración a su estado inicial?')) {
              onResetDefaults();
            }
          }}
          className="bojana-button bojana-button-secondary px-3.5 py-1.5 rounded-bojana-widget border border-bojana-line hover:bg-bojana-surface text-bojana-ink text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-bojana-muted" />
          <span>Restablecer</span>
        </button>
      </div>

    </div>
  );
}

