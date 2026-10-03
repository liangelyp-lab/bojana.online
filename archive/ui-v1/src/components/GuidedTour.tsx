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
    <div className="fixed inset-0 bg-gray-950/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div 
        id="guided-tour-container"
        className="bg-white border border-gray-205 rounded-xl max-w-md w-full shadow-2xl p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-500">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            <span className="text-xs uppercase tracking-widest font-semibold font-mono">Guía de Plataforma</span>
          </div>
          <button 
            onClick={onComplete}
            aria-label="Cerrar guía"
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-gray-900 font-sans tracking-tight">
              {steps[step - 1].title}
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Paso {step} de {steps.length}
            </span>
          </div>

          <p className="text-gray-600 text-xs leading-relaxed font-sans">
            {steps[step - 1].description}
          </p>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
            <span className="text-[10px] font-mono text-gray-400 block mb-1 uppercase tracking-wider">Sección Relacionada:</span>
            <span className="text-xs text-gray-850 font-bold font-sans">• {steps[step - 1].target}</span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx + 1 === step ? 'w-6 bg-gray-900' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 1 && (
              <button 
                onClick={handlePrev}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-250 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-gray-600" />
                Atrás
              </button>
            )}
            <button 
              onClick={handleNext}
              className="px-4 py-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {step === steps.length ? (
                <>
                  Listo
                  <Check className="w-3.5 h-3.5 text-white" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
