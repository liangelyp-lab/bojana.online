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
    <div className="max-w-3xl mx-auto space-y-6 py-2 animate-fade-in text-xs font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-950 font-sans tracking-tight">
          Configuración del Estudio
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Datos generales de Bojana Estudio aplicados por defecto a los nuevos portales.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
        
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-gray-950 text-white flex items-center justify-center font-mono font-bold text-lg shadow-sm">
            BE
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-950 font-sans">{studioName}</h3>
            <span className="text-[11px] font-mono text-gray-500">Arquitectura, Construcción, Ingeniería & Diseño</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-gray-500 font-bold block mb-1">Nombre del Estudio</label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 font-bold focus:bg-white"
            />
          </div>

          <div>
            <label className="font-mono text-gray-500 font-bold block mb-1">Email de Contacto Oficial</label>
            <input
              type="email"
              value={studioEmail}
              onChange={(e) => setStudioEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 font-mono focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-gray-500 font-bold block mb-1">Teléfono Principal</label>
            <input
              type="text"
              value={studioPhone}
              onChange={(e) => setStudioPhone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 font-mono focus:bg-white"
            />
          </div>

          <div>
            <label className="font-mono text-gray-500 font-bold block mb-1">Sede / Ciudad</label>
            <input
              type="text"
              value={studioCity}
              onChange={(e) => setStudioCity(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-850 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Cambios</span>
          </button>
        </div>

      </form>

      {/* Demo Reset Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-gray-950 text-xs">Restablecer Datos de Demostración</h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
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
          className="px-3.5 py-1.5 rounded-xl border border-gray-300 hover:bg-white text-gray-700 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
          <span>Restablecer</span>
        </button>
      </div>

    </div>
  );
}
