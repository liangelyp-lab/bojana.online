import React, { useState } from 'react';
import { DailyLog, Contractor } from '../types';
import {
  Calendar,
  CloudSun,
  Users,
  FilePlus2,
  MapPin,
  CheckCircle,
  Image as ImageIcon,
  Thermometer,
  HardHat,
  Layers,
  Sparkles,
  X,
  Check,
  FolderOpen
} from 'lucide-react';

interface BitacoraProps {
  logs: DailyLog[];
  onAddLog?: (newLog: DailyLog) => void;
  isAdmin?: boolean;
}

export default function Bitacora({ logs, onAddLog, isAdmin }: BitacoraProps) {
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Form states (clean initial inputs)
  const [newFecha, setNewFecha] = useState(new Date().toLocaleDateString('es-AR'));
  const [newClima, setNewClima] = useState<DailyLog['clima']>('Despejado');
  const [newTemp, setNewTemp] = useState('20°C');
  const [newPersonal, setNewPersonal] = useState(15);
  const [newTareas, setNewTareas] = useState('');
  const [newNovedades, setNewNovedades] = useState('');
  const [newFoto, setNewFoto] = useState('');

  const getClimaLabelColor = (clima: DailyLog['clima']) => {
    switch (clima) {
      case 'Despejado': return "bg-bojana-waiting text-bojana-ink border-bojana-line";
      case 'Lluvia': return "bg-bojana-soft text-bojana-error border-bojana-error";
      case 'Nublado': return "bg-bojana-soft text-bojana-ink border-bojana-line";
      case 'Viento Fuerte': return "bg-bojana-waiting text-bojana-ink border-bojana-line";
      default: return "bg-bojana-surface text-bojana-ink border-bojana-line";
    }
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddLog) return;

    const taskList = newTareas
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const logToAdd: DailyLog = {
      id: `L-${(logs.length + 1).toString().padStart(3, '0')}`,
      fecha: newFecha,
      clima: newClima,
      temperatura: newTemp,
      personalActivo: Number(newPersonal) || 10,
      contratistas: [
        { nombre: 'Contratista de Obra', especialidad: 'Obras Civiles', personal: Number(newPersonal) || 10 }
      ],
      tareasDelDia: taskList.length > 0 ? taskList : ['Fiscalización y control de avances en campo.'],
      novedades: newNovedades.trim() || 'Jornada supervisada por la Dirección de Obra conforme a especificaciones.',
      firmaDO: true,
      evidenciaFoto: newFoto.trim() || undefined
    };

    onAddLog(logToAdd);
    setIsAddingLog(false);
    setNewTareas('');
    setNewNovedades('');
    setNewFoto('');
  };

  return (
    <div id="bitacora-main-view" className="space-y-bojana-block">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-bojana-block border-b border-bojana-line pb-4">
        <div>
          <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink uppercase tracking-normal font-sans">Bitácora Diaria de Seguimiento</h4>
          <p className="text-xs text-bojana-muted mt-1 font-sans">Historial cronológico de tareas de campo, clima y mano de obra fiscalizada.</p>
        </div>

        {onAddLog && (
          <button
            type="button"
            onClick={() => setIsAddingLog(!isAddingLog)}
            className="bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse font-sans text-xs font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>{isAddingLog ? 'Cerrar Formulario' : '+ Registrar Nuevo Parte de Obra'}</span>
          </button>
        )}
      </div>

      {/* INLINE LOG REGISTRATION FORM FOR ADMIN */}
      {isAddingLog && onAddLog && (
        <form onSubmit={handleSaveLog} className="bojana-widget bg-bojana-surface border border-bojana-success/40 rounded-bojana-widget p-5 shadow-bojana-widget space-y-bojana-block animate-fade-in font-sans">
          <div className="flex items-center justify-between border-b border-bojana-line pb-3">
            <div className="flex items-center gap-bojana-inside">
              <span className="w-2.5 h-2.5 rounded-bojana-badge bg-bojana-success animate-pulse" />
              <h5 className="bojana-heading-component font-medium text-sm text-bojana-ink font-sans uppercase tracking-normal">
                Registrar Avance en Bitácora con Firma D.O.
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingLog(false)}
              className="bojana-icon-button text-bojana-muted hover:text-bojana-ink p-1 rounded-bojana-widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-xs font-sans uppercase text-bojana-muted block mb-1 font-medium">Fecha del Parte</label>
              <input
                type="text"
                value={newFecha}
                onChange={(e) => setNewFecha(e.target.value)}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 font-sans text-xs text-bojana-ink"
                required
              />
            </div>

            <div>
              <label className="text-xs font-sans uppercase text-bojana-muted block mb-1 font-medium">Condición Climática</label>
              <select
                value={newClima}
                onChange={(e) => setNewClima(e.target.value as any)}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 text-xs text-bojana-ink"
              >
                <option value="Despejado">Despejado</option>
                <option value="Nublado">Nublado</option>
                <option value="Lluvia">Lluvia</option>
                <option value="Viento Fuerte">Viento Fuerte</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-sans uppercase text-bojana-muted block mb-1 font-medium">Temperatura</label>
              <input
                type="text"
                value={newTemp}
                onChange={(e) => setNewTemp(e.target.value)}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 font-sans text-xs text-bojana-ink"
              />
            </div>

            <div>
              <label className="text-xs font-sans uppercase text-bojana-muted block mb-1 font-medium">Operarios Activos</label>
              <input
                type="number"
                value={newPersonal}
                onChange={(e) => setNewPersonal(Number(e.target.value))}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 font-sans text-xs text-bojana-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-bojana-block text-xs">
            <div>
              <label className="text-xs font-sans uppercase text-bojana-muted block mb-1 font-medium">
                Tareas Fiscalizadas (una por renglón)
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Replanteo de fundaciones&#10;Excavación y nivelación de suelo"
                value={newTareas}
                onChange={(e) => setNewTareas(e.target.value)}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink"
                required
              />
            </div>

            <div>
              <label className="text-xs font-sans uppercase text-bojana-muted block mb-1 font-medium">
                Novedades, Observaciones & Dictamen D.O.
              </label>
              <textarea
                rows={3}
                placeholder="Observaciones técnicas, resultados de inspección..."
                value={newNovedades}
                onChange={(e) => setNewNovedades(e.target.value)}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-sans uppercase text-bojana-muted block mb-1.5 font-medium">
              Foto de Inspección / Evidencia (Opcional - URL o Enlace de Imagen)
            </label>
            <input
              type="text"
              placeholder="https://... o ruta de foto de obra"
              value={newFoto}
              onChange={(e) => setNewFoto(e.target.value)}
              className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget px-2.5 py-1.5 text-xs text-bojana-ink font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-bojana-line">
            <span className="text-xs font-sans text-bojana-success font-medium flex items-center gap-bojana-inside">
              <CheckCircle className="w-3.5 h-3.5 text-bojana-success" />
              Se publicará con Firma Digital de Dirección de Obra
            </span>

            <div className="flex items-center gap-bojana-inside">
              <button
                type="button"
                onClick={() => setIsAddingLog(false)}
                className="bojana-button bojana-button-text px-3 py-1.5 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft text-bojana-ink text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-success hover:bg-bojana-success text-bojana-inverse text-xs font-medium flex items-center gap-bojana-inside shadow-bojana-widget"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar y Publicar en Bitácora</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* CHRONOLOGICAL LOGS TIMELINE */}
      <div id="bitacora-list" className="space-y-bojana-block">
        {logs.length === 0 && (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-10 text-center space-y-bojana-inside shadow-bojana-widget">
            <div className="w-10 h-10 rounded-bojana-widget bg-bojana-soft text-bojana-muted flex items-center justify-center mx-auto">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h5 className="bojana-heading-component font-medium text-sm text-bojana-ink">Bitácora sin partes registrados</h5>
            <p className="text-xs text-bojana-muted font-sans max-w-md mx-auto">
              Aún no se han emitido partes diarios en esta obra. Pulse <strong>"+ Registrar Nuevo Parte de Obra"</strong> arriba para registrar la primera jornada.
            </p>
          </div>
        )}

        {logs.map((log) => {
          return (
            <div
              key={log.id}
              className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 hover:border-bojana-line hover:shadow-bojana-widget transition"
            >
              {/* Card top banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-bojana-line pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-bojana-soft border border-bojana-line p-2 rounded-bojana-widget text-bojana-ink font-sans font-medium text-xs select-none">
                    {log.id}
                  </div>
                  <div>
                    <h5 className="bojana-heading-component font-medium text-bojana-ink text-sm tracking-normal">{log.fecha}</h5>
                    <div className="flex items-center gap-bojana-inside mt-0.5 text-xs font-sans text-bojana-muted">
                      <MapPin className="w-3 h-3 text-bojana-muted" />
                      <span>Inspección Técnica de Obra</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-bojana-inside">
                  <span className={`px-2 py-0.5 rounded-bojana-badge text-xs font-sans border ${getClimaLabelColor(log.clima)}`}>
                    Clima: {log.clima} ({log.temperatura})
                  </span>
                  <span className="bg-bojana-surface border border-bojana-line px-2.5 py-0.5 rounded-bojana-badge text-xs font-sans text-bojana-muted">
                    {log.personalActivo} operarios activos
                  </span>
                </div>
              </div>

              {/* Main content body splits into text description and visual photo */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-bojana-block leading-relaxed text-xs">

                {/* Descr & Contractors column */}
                <div className={` ${log.evidenciaFoto ? "md:col-span-8" : "md:col-span-12"} space-y-bojana-block`}>

                  {/* Contractors Headcount details pills */}
                  <div className="flex flex-wrap gap-bojana-inside">
                    {log.contratistas.map((cont, ci) => (
                      <span
                        key={ci}
                        className="bg-bojana-surface border border-bojana-line text-bojana-muted text-xs px-2 py-1 rounded-bojana-badge shadow-bojana-widget"
                      >
                        {cont.nombre}: <strong className="text-bojana-ink font-sans">{cont.personal} op.</strong>
                      </span>
                    ))}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-bojana-inside">
                    <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted block">Tareas Controladas:</span>
                    <ul className="list-disc list-inside space-y-bojana-inside text-bojana-ink font-sans">
                      {log.tareasDelDia.map((task, ti) => (
                        <li key={ti} className="pl-1 text-[12px]">{task}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Comments/Incidents */}
                  <div className="space-y-bojana-inside">
                    <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted block">Novedades e Incidencias:</span>
                    <p className="text-bojana-muted font-sans text-[12px]">
                      {log.novedades}
                    </p>
                  </div>

                  {/* Digital Signature */}
                  <div className="pt-2 border-t border-bojana-line flex items-center gap-bojana-inside text-bojana-success font-sans text-xs uppercase font-medium tracking-normal">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Fiscalizado y Aprobado por Dirección de Obra</span>
                  </div>
                </div>

                {/* Optional Photo col */}
                {log.evidenciaFoto && (
                  <div className="md:col-span-4 space-y-bojana-inside">
                    <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted block">Registro Fotográfico</span>
                    <div className="relative border border-bojana-line rounded-bojana-widget overflow-hidden group">
                      <img
                        src={log.evidenciaFoto}
                        alt={`Evidencia obra del ${log.fecha}`}
                        referrerPolicy="no-referrer"
                        className="bojana-media w-full h-32 sm:h-36 object-contain opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
