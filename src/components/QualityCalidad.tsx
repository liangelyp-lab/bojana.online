import React, { useState } from 'react';
import { QualityCheck, ConcreteTest } from '../types';
import { 
  CheckSquare, 
  Layers, 
  FlaskConical, 
  PlusCircle, 
  AlertOctagon, 
  Check, 
  Inbox,
  ShieldCheck
} from 'lucide-react';

interface QualityCalidadProps {
  checks: QualityCheck[];
  tests: ConcreteTest[];
  onUpdateCheck: (updatedCheck: QualityCheck) => void;
}

export default function QualityCalidad({ 
  checks, 
  tests, 
  onUpdateCheck 
}: QualityCalidadProps) {
  
  const [activeSegment, setActiveSegment] = useState<'CHECKLIST' | 'LAB_HORMIGON'>('LAB_HORMIGON');

  const handleResolveCheck = (check: QualityCheck) => {
    const updated: QualityCheck = {
      ...check,
      resultado: 'Aprobado',
      observaciones: `Re-inspeccionado en obra el 09-06-2026. Se rectificaron los desvíos criticados oportunamente. Conforme Dirección de Obra.`
    };
    onUpdateCheck(updated);
  };

  return (
    <div id="quality-calidad-main-view" className="space-y-6">
      
      {/* SEGMENT SELECTION PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-gray-200 pb-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start border border-gray-200">
          <button
            onClick={() => setActiveSegment('LAB_HORMIGON')}
            className={`py-1.5 px-3.5 rounded-md text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSegment === 'LAB_HORMIGON'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Laboratorio Hormigón (Probetas H30)
          </button>
          <button
            onClick={() => setActiveSegment('CHECKLIST')}
            className={`py-1.5 px-3.5 rounded-md text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSegment === 'CHECKLIST'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-550 hover:text-gray-850'
            }`}
          >
            Checklist de Liberación Civil
          </button>
        </div>
      </div>

      {/* LAB PANEL CONTAINER */}
      {activeSegment === 'LAB_HORMIGON' ? (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-gray-550" />
                <h4 className="text-sm font-bold text-gray-900">Ensayos de Rotura de Probetas H30 del Club House</h4>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">Cláusula 14.3 de Pliego</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-450 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5">Código Ensayo</th>
                    <th className="py-2.5">Sector Pintado</th>
                    <th className="py-2.5 font-mono text-center">Asentamiento (Slump)</th>
                    <th className="py-2.5 font-mono text-center">Compresión 7d (MPa)</th>
                    <th className="py-2.5 font-mono text-center">Compresión 28d (MPa)</th>
                    <th className="py-2.5 text-right">Dictamen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 font-mono font-bold text-gray-400">{test.id}</td>
                      <td className="py-3 font-semibold text-gray-900">{test.sectorColocacion}</td>
                      <td className="py-3 font-mono text-center text-gray-650">{test.asentamientoCm} cm</td>
                      <td className="py-3 font-mono text-center text-gray-650">
                        {test.resistencia7dMPa > 0 ? `${test.resistencia7dMPa} MPa` : 'Pte.'}
                      </td>
                      <td className="py-3 font-mono text-center text-gray-650">
                        {test.resistencia28dMPa > 0 ? `${test.resistencia28dMPa} MPa` : 'Pte.'}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          test.estado === 'Conforme'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : test.estado === 'En Cursado'
                              ? 'bg-gray-100 text-gray-650 border-gray-250'
                              : 'bg-rose-50 text-rose-700 border-rose-220'
                        }`}>
                          {test.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CALIBRATION / PLIEGO WARNING SHEET */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2 leading-relaxed shadow-2xs">
            <h5 className="font-bold text-amber-900 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px]">
              <AlertOctagon className="w-4 h-4 text-amber-600" />
              Trazabilidad Nordelta para Roturas Menores a 30 MPa (H30)
            </h5>
            <p className="text-amber-800 font-sans font-medium">
              Si una probeta de 28 días arroja un valor inferior a 30.0 MPa, se activará de inmediato el protocolo de culpabilidad del pliego. El Contratista deberá costear la extracción de testigos calados ("coras") de la estructura de hormigón en faja de playa para ensayo destructivo complementario supervisado por D.O.
            </p>
          </div>
        </div>
      ) : (
        /* CIVIL CHECKLIST TABLE */
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-gray-550" />
                <h4 className="text-sm font-bold text-gray-900">Protocolo de Certificación Civil de Obra</h4>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">Alineación con Pliego</span>
            </div>

            <div className="space-y-3">
              {checks.map((check) => (
                <div 
                  key={check.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs transition duration-150"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-gray-400 font-bold">{check.id}</span>
                      <h5 className="font-bold text-gray-900">{check.item}</h5>
                    </div>
                    <p className="text-gray-500">
                      <strong>Sector:</strong> {check.sector} • <strong>Inspector:</strong> {check.verificadoPor}
                    </p>
                    {check.observaciones && (
                      <div className="bg-white p-2 rounded border border-gray-200 text-[10px] text-gray-550 mt-1 pb-1.5 italic font-mono font-medium">
                        D.O. Obs: {check.observaciones}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono tracking-wider uppercase font-semibold border ${
                      check.resultado === 'Aprobado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : check.resultado === 'Observado'
                          ? 'bg-rose-50 text-rose-700 border-rose-220 font-bold'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {check.resultado}
                    </span>

                    {check.resultado === 'Observado' && (
                      <button
                        onClick={() => handleResolveCheck(check)}
                        className="p-1 px-2.5 bg-gray-950 hover:bg-gray-900 text-white rounded font-bold text-[10px] font-mono transition flex items-center gap-1 cursor-pointer select-none"
                      >
                        <Check className="w-3 h-3 text-white" />
                        Re-inspeccionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
