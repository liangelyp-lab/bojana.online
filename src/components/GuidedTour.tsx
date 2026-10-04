import React, { useState } from 'react';
import { HelpCircle, ArrowRight, ArrowLeft, X, Check } from 'lucide-react';

interface GuidedTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export default function GuidedTour({ onComplete, isOpen }: GuidedTourProps) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "📋 Tablero Ejecutivo y Curva S de Obra",
      description: "Aquí supervisas el avance físico y financiero real de la obra Virazón frente a la curva teórica (Planificada: 53.0% vs Real: 48.2%). El panel izquierdo delinea las Alertas Tempranas para mitigar desvíos proactivamente.",
      target: "Dashboard Ejecutivo"
    },
    {
      title: "🛡️ Trazabilidad Documental Legal (O.S. y N.P.)",
      description: "Operabilidad total de las Órdenes de Servicio (O.S.) de la Dirección de Obra y Notas de Pedido (N.P.) de las Contratistas. Cada documento cuenta con estados claros, respuestas rastreables y firmas digitales con validez contractual.",
      target: "Biblioteca & Órdenes"
    },
    {
      title: "🧱 Bitácora de Campo y Calidad de Hormigones",
      description: "Monitorea el parte diario físico (clima, personal activo, remito de Loma Negra) junto con el laboratorio de probetas H30 para control estricto de resistencia hidráulica a 7 y 28 días, cumpliendo rigurosamente el pliego Nordelta.",
      target: "Bitácora & Calidad"
    }
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-bojana-ink/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        id="guided-tour-container"
        className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full shadow-bojana-widget p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-bojana-inside text-bojana-muted">
            <HelpCircle className="w-5 h-5 text-bojana-muted" />
            <span className="text-xs uppercase tracking-normal font-medium font-sans">Guía de Plataforma</span>
          </div>
          <button
            onClick={onComplete}
            aria-label="Cerrar guía"
            className="bojana-icon-button text-bojana-muted hover:text-bojana-ink transition-colors p-1 rounded-bojana-widget hover:bg-bojana-soft cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="bojana-heading-component text-md font-medium text-bojana-ink font-sans tracking-normal">
              {steps[step - 1].title}
            </h3>
            <span className="text-xs text-bojana-muted font-sans">
              Paso {step} de {steps.length}
            </span>
          </div>

          <p className="text-bojana-muted text-xs leading-relaxed font-sans">
            {steps[step - 1].description}
          </p>

          <div className="bojana-widget bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line mt-4">
            <span className="text-xs font-sans text-bojana-muted block mb-1 uppercase tracking-normal">Sección Relacionada:</span>
            <span className="text-xs text-bojana-ink font-medium font-sans">• {steps[step - 1].target}</span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-bojana-line">
          <div className="flex gap-bojana-inside">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-bojana-badge transition-all duration-500 ${
                  idx + 1 === step ? "w-6 bg-bojana-ink" : "w-2 bg-bojana-soft"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-bojana-inside">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="bojana-button bojana-button-text px-3 py-1.5 text-xs text-bojana-muted hover:text-bojana-ink bg-bojana-soft hover:bg-bojana-soft rounded-bojana-widget transition-all flex items-center gap-bojana-inside cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-bojana-muted" />
                Atrás
              </button>
            )}
            <button
              onClick={handleNext}
              className="bojana-button bojana-button-primary px-4 py-1.5 text-xs font-medium text-bojana-inverse bg-bojana-ink hover:bg-bojana-ink rounded-bojana-widget transition-all flex items-center gap-bojana-inside cursor-pointer"
            >
              {step === steps.length ? (
                <>
                  Listo
                  <Check className="w-3.5 h-3.5 text-bojana-inverse" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-3.5 h-3.5 text-bojana-inverse" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
