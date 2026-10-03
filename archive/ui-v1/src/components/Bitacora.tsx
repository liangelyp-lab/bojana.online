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
      case 'Despejado': return 'bg-amber-50 text-amber-800 border-amber-205';
      case 'Lluvia': return 'bg-rose-50 text-rose-700 border-rose-150';
      case 'Nublado': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Viento Fuerte': return 'bg-orange-50 text-orange-800 border-orange-150';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
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
    <div id="bitacora-main-view" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">Bitácora Diaria de Seguimiento</h4>
          <p className="text-xs text-gray-405 mt-1 font-sans">Historial cronológico de tareas de campo, clima y mano de obra fiscalizada.</p>
        </div>

        {onAddLog && (
          <button
            type="button"
            onClick={() => setIsAddingLog(!isAddingLog)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>{isAddingLog ? 'Cerrar Formulario' : '+ Registrar Nuevo Parte de Obra'}</span>
          </button>
        )}
      </div>

      {/* INLINE LOG REGISTRATION FORM FOR ADMIN */}
      {isAddingLog && onAddLog && (
        <form onSubmit={handleSaveLog} className="bg-white border-2 border-emerald-500/40 rounded-xl p-5 shadow-md space-y-4 animate-fade-in font-sans">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h5 className="font-bold text-sm text-gray-950 font-mono uppercase tracking-tight">
                Registrar Avance en Bitácora con Firma D.O.
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingLog(false)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1 font-bold">Fecha del Parte</label>
              <input
                type="text"
                value={newFecha}
                onChange={(e) => setNewFecha(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 font-mono text-xs text-gray-900"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1 font-bold">Condición Climática</label>
              <select
                value={newClima}
                onChange={(e) => setNewClima(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900"
              >
                <option value="Despejado">Despejado</option>
                <option value="Nublado">Nublado</option>
                <option value="Lluvia">Lluvia</option>
                <option value="Viento Fuerte">Viento Fuerte</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1 font-bold">Temperatura</label>
              <input
                type="text"
                value={newTemp}
                onChange={(e) => setNewTemp(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 font-mono text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1 font-bold">Operarios Activos</label>
              <input
                type="number"
                value={newPersonal}
                onChange={(e) => setNewPersonal(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 font-mono text-xs text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1 font-bold">
                Tareas Fiscalizadas (una por renglón)
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Replanteo de fundaciones&#10;Excavación y nivelación de suelo"
                value={newTareas}
                onChange={(e) => setNewTareas(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs text-gray-900"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1 font-bold">
                Novedades, Observaciones & Dictamen D.O.
              </label>
              <textarea
                rows={3}
                placeholder="Observaciones técnicas, resultados de inspección..."
                value={newNovedades}
                onChange={(e) => setNewNovedades(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-xs text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1.5 font-bold">
              Foto de Inspección / Evidencia (Opcional - URL o Enlace de Imagen)
            </label>
            <input
              type="text"
              placeholder="https://... o ruta de foto de obra"
              value={newFoto}
              onChange={(e) => setNewFoto(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Se publicará con Firma Digital de Dirección de Obra
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingLog(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar y Publicar en Bitácora</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* CHRONOLOGICAL LOGS TIMELINE */}
      <div id="bitacora-list" className="space-y-5">
        {logs.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h5 className="font-bold text-sm text-gray-900">Bitácora sin partes registrados</h5>
            <p className="text-xs text-gray-500 font-sans max-w-md mx-auto">
              Aún no se han emitido partes diarios en esta obra. Pulse <strong>"+ Registrar Nuevo Parte de Obra"</strong> arriba para registrar la primera jornada.
            </p>
          </div>
        )}

        {logs.map((log) => {
          return (
            <div 
              key={log.id} 
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-xs transition"
            >
              {/* Card top banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 border border-gray-200 p-2 rounded-lg text-gray-700 font-mono font-bold text-xs select-none">
                    {log.id}
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-950 text-sm tracking-tight">{log.fecha}</h5>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-gray-400">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>Inspección Técnica de Obra</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getClimaLabelColor(log.clima)}`}>
                    Clima: {log.clima} ({log.temperatura})
                  </span>
                  <span className="bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded text-[10px] font-mono text-gray-600">
                    {log.personalActivo} operarios activos
                  </span>
                </div>
              </div>

              {/* Main content body splits into text description and visual photo */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 leading-relaxed text-xs">
                
                {/* Descr & Contractors column */}
                <div className={`${log.evidenciaFoto ? 'md:col-span-8' : 'md:col-span-12'} space-y-4`}>
                  
                  {/* Contractors Headcount details pills */}
                  <div className="flex flex-wrap gap-2">
                    {log.contratistas.map((cont, ci) => (
                      <span 
                        key={ci} 
                        className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded shadow-2xs"
                      >
                        {cont.nombre}: <strong className="text-gray-800 font-mono">{cont.personal} op.</strong>
                      </span>
                    ))}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Tareas Controladas:</span>
                    <ul className="list-disc list-inside space-y-1 text-gray-750 font-sans">
                      {log.tareasDelDia.map((task, ti) => (
                        <li key={ti} className="pl-1 text-[12px]">{task}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Comments/Incidents */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Novedades e Incidencias:</span>
                    <p className="text-gray-600 font-sans text-[12px]">
                      {log.novedades}
                    </p>
                  </div>

                  {/* Digital Signature */}
                  <div className="pt-2 border-t border-gray-200 flex items-center gap-1.5 text-emerald-600 font-mono text-[10px] uppercase font-bold tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Fiscalizado y Aprobado por Dirección de Obra</span>
                  </div>
                </div>

                {/* Optional Photo col */}
                {log.evidenciaFoto && (
                  <div className="md:col-span-4 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Registro Fotográfico</span>
                    <div className="relative border border-gray-200 rounded-lg overflow-hidden group">
                      <img 
                        src={log.evidenciaFoto} 
                        alt={`Evidencia obra del ${log.fecha}`}
                        referrerPolicy="no-referrer" 
                        className="w-full h-32 sm:h-36 object-cover opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
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
