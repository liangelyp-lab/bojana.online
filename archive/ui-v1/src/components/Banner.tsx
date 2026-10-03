import React from 'react';
import { Eye, ShieldAlert } from 'lucide-react';

export default function Banner() {
  return (
    <div 
      id="test-environment-banner" 
      className="bg-gray-800 text-gray-300 text-[10px] py-1 px-4 flex justify-between items-center shrink-0 tracking-wide font-mono select-none border-b border-gray-750"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="font-medium tracking-widest uppercase">Entorno de Pruebas - Solo Visualización</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-gray-700 px-2 py-0.5 rounded border border-gray-600 text-[9px] uppercase font-bold tracking-tighter">
          Versión 1.0.4 - Licencia Licitación
        </span>
      </div>
    </div>
  );
}
