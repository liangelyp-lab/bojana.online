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
    <div id="quality-calidad-main-view" className="space-y-bojana-block">

      {/* SEGMENT SELECTION PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-bojana-block border-b border-bojana-line pb-3">
        <div className="flex gap-bojana-inside bg-bojana-soft p-1 rounded-bojana-widget self-start border border-bojana-line">
          <button
            onClick={() => setActiveSegment('LAB_HORMIGON')}
            className={`bojana-button bojana-button-text py-1.5 px-3.5 rounded-bojana-widget text-xs font-sans font-medium uppercase transition-all cursor-pointer ${
              activeSegment === "LAB_HORMIGON"
                ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget"
                : "text-bojana-muted hover:text-bojana-ink"
            }`}
          >
            Laboratorio Hormigón (Probetas H30)
          </button>
          <button
            onClick={() => setActiveSegment('CHECKLIST')}
            className={`bojana-button bojana-button-text py-1.5 px-3.5 rounded-bojana-widget text-xs font-sans font-medium uppercase transition-all cursor-pointer ${
              activeSegment === "CHECKLIST"
                ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget"
                : "text-bojana-muted hover:text-bojana-ink"
            }`}
          >
            Checklist de Liberación Civil
          </button>
        </div>
      </div>

      {/* LAB PANEL CONTAINER */}
      {activeSegment === 'LAB_HORMIGON' ? (
        <div className="space-y-bojana-block">
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget">
            <div className="flex justify-between items-center border-b border-bojana-line pb-3 mb-4">
              <div className="flex items-center gap-bojana-inside">
                <FlaskConical className="w-4 h-4 text-bojana-muted" />
                <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink">Ensayos de Rotura de Probetas H30 del Club House</h4>
              </div>
              <span className="text-xs font-sans text-bojana-muted uppercase">Cláusula 14.3 de Pliego</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans min-w-[500px]">
                <thead>
                  <tr className="border-b border-bojana-line text-bojana-muted font-sans text-xs uppercase tracking-normal">
                    <th className="py-2.5">Código Ensayo</th>
                    <th className="py-2.5">Sector Pintado</th>
                    <th className="py-2.5 font-sans text-center">Asentamiento (Slump)</th>
                    <th className="py-2.5 font-sans text-center">Compresión 7d (MPa)</th>
                    <th className="py-2.5 font-sans text-center">Compresión 28d (MPa)</th>
                    <th className="py-2.5 text-right">Dictamen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bojana-line text-bojana-ink">
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-bojana-surface transition">
                      <td className="py-3 font-sans font-medium text-bojana-muted">{test.id}</td>
                      <td className="py-3 font-medium text-bojana-ink">{test.sectorColocacion}</td>
                      <td className="py-3 font-sans text-center text-bojana-muted">{test.asentamientoCm} cm</td>
                      <td className="py-3 font-sans text-center text-bojana-muted">
                        {test.resistencia7dMPa > 0 ? `${test.resistencia7dMPa} MPa` : 'Pte.'}
                      </td>
                      <td className="py-3 font-sans text-center text-bojana-muted">
                        {test.resistencia28dMPa > 0 ? `${test.resistencia28dMPa} MPa` : 'Pte.'}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-bojana-badge text-xs font-sans font-medium uppercase tracking-normal border ${
                          test.estado === "Conforme"
                            ? "bg-bojana-soft text-bojana-success border-bojana-success"
                            : test.estado === "En Cursado"
                              ? "bg-bojana-soft text-bojana-muted border-bojana-line"
                              : "bg-bojana-soft text-bojana-error border-bojana-error"
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
          <div className="bojana-widget bg-bojana-waiting border border-bojana-line rounded-bojana-widget p-4 text-xs space-y-bojana-inside leading-relaxed shadow-bojana-widget">
            <h5 className="bojana-heading-component font-medium text-bojana-ink flex items-center gap-bojana-inside font-sans uppercase tracking-normal text-xs">
              <AlertOctagon className="w-4 h-4 text-bojana-ink" />
              Trazabilidad Nordelta para Roturas Menores a 30 MPa (H30)
            </h5>
            <p className="text-bojana-ink font-sans font-medium">
              Si una probeta de 28 días arroja un valor inferior a 30.0 MPa, se activará de inmediato el protocolo de culpabilidad del pliego. El Contratista deberá costear la extracción de testigos calados ("coras") de la estructura de hormigón en faja de playa para ensayo destructivo complementario supervisado por D.O.
            </p>
          </div>
        </div>
      ) : (
        /* CIVIL CHECKLIST TABLE */
        <div className="space-y-bojana-block">
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 shadow-bojana-widget">
            <div className="flex justify-between items-center border-b border-bojana-line pb-3 mb-4">
              <div className="flex items-center gap-bojana-inside">
                <CheckSquare className="w-4 h-4 text-bojana-muted" />
                <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink">Protocolo de Certificación Civil de Obra</h4>
              </div>
              <span className="text-xs font-sans text-bojana-muted uppercase">Alineación con Pliego</span>
            </div>

            <div className="space-y-3">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className="bojana-widget bg-bojana-surface p-4 rounded-bojana-widget border border-bojana-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-bojana-block text-xs transition duration-500"
                >
                  <div className="space-y-bojana-inside flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-xs text-bojana-muted font-medium">{check.id}</span>
                      <h5 className="bojana-heading-component font-medium text-bojana-ink">{check.item}</h5>
                    </div>
                    <p className="text-bojana-muted">
                      <strong>Sector:</strong> {check.sector} • <strong>Inspector:</strong> {check.verificadoPor}
                    </p>
                    {check.observaciones && (
                      <div className="bg-bojana-surface p-2 rounded-bojana-widget border border-bojana-line text-xs text-bojana-muted mt-1 pb-1.5 italic font-sans font-medium">
                        D.O. Obs: {check.observaciones}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-bojana-inside sm:self-center shrink-0">
                    <span className={`px-2 py-0.5 rounded-bojana-badge text-xs font-sans tracking-normal uppercase font-medium border ${
                      check.resultado === "Aprobado"
                        ? "bg-bojana-soft text-bojana-success border-bojana-success"
                        : check.resultado === "Observado"
                          ? "bg-bojana-soft text-bojana-error border-bojana-error font-medium"
                          : "bg-bojana-soft text-bojana-muted border-bojana-line"
                    }`}>
                      {check.resultado}
                    </span>

                    {check.resultado === 'Observado' && (
                      <button
                        onClick={() => handleResolveCheck(check)}
                        className="bojana-button bojana-button-primary p-1 px-2.5 bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse rounded-bojana-widget font-medium text-xs font-sans transition flex items-center gap-bojana-inside cursor-pointer select-none"
                      >
                        <Check className="w-3 h-3 text-bojana-inverse" />
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
