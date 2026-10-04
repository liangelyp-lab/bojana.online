import React from 'react';
import { Eye, ShieldAlert } from 'lucide-react';

export default function Banner() {
  return (
    <div
      id="test-environment-banner"
      className="bg-bojana-ink text-bojana-line text-xs py-1 px-4 flex justify-between items-center shrink-0 tracking-normal font-sans select-none border-b border-bojana-line"
    >
      <div className="flex items-center gap-bojana-inside">
        <span className="inline-flex h-1.5 w-1.5 rounded-bojana-badge bg-bojana-success animate-pulse" />
        <span className="font-medium tracking-normal uppercase">Entorno de Pruebas - Solo Visualización</span>
      </div>
      <div className="flex items-center gap-bojana-inside">
        <span className="bg-bojana-ink px-2 py-0.5 rounded-bojana-badge border border-bojana-line text-xs uppercase font-medium tracking-normal">
          Versión 1.0.4 - Licencia Licitación
        </span>
      </div>
    </div>
  );
}
