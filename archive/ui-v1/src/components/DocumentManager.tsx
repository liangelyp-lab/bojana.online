import React, { useState } from 'react';
import { Document } from '../types';
import { 
  FileText, 
  Search, 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  FileCheck2, 
  ArrowRightLeft, 
  ExternalLink,
  Printer,
  FileSignature
} from 'lucide-react';

interface DocumentManagerProps {
  documents: Document[];
  onUpdateDocument: (updatedDoc: Document) => void;
}

export default function DocumentManager({ 
  documents, 
  onUpdateDocument 
}: DocumentManagerProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'O.S.' | 'N.P.'>('O.S.');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'Emitida' | 'Respondida' | 'Cerrada'>('TODOS');
  
  // Selected Doc for reading/answering
  const [selectedDocId, setSelectedDocId] = useState<string>('OS-012'); // default
  const [showPrintMode, setShowPrintMode] = useState(false);

  // Answer states
  const [answerText, setAnswerText] = useState('');
  const [signatureName, setSignatureName] = useState('');

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  // Submit response/answer
  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    const updated: Document = {
      ...selectedDoc,
      estado: 'Respondida',
      respuesta: answerText,
      firmaVisual: signatureName || 'Arq. Rossi - TecnoLagos S.A.',
      fechaFirma: '09-06-2026'
    };

    onUpdateDocument(updated);
    setAnswerText('');
    setSignatureName('');
  };

  // Close document state
  const handleCloseDocument = () => {
    if (!selectedDoc) return;
    const updated: Document = {
      ...selectedDoc,
      estado: 'Cerrada'
    };
    onUpdateDocument(updated);
  };

  // Filtered lists
  const filteredDocs = documents.filter(doc => {
    const matchesTab = doc.tipo === activeSubTab;
    const matchesSearch = doc.asunto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || doc.estado === statusFilter;
    
    return matchesTab && matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Document['estado']) => {
    switch (status) {
      case 'Borrador': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'Emitida': return 'bg-rose-50 text-rose-700 border-rose-150';
      case 'Respondida': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'Cerrada': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      default: return 'bg-gray-50 text-gray-750 border-gray-200';
    }
  };

  return (
    <div id="document-manager-main" className="space-y-6">
      
      {/* SECTION TABS FOR DOCUMENT TYPE */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-gray-205 pb-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start border border-gray-200">
          <button
            onClick={() => { setActiveSubTab('O.S.'); setStatusFilter('TODOS'); }}
            className={`py-1.5 px-3.5 rounded-md text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'O.S.'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-550 hover:text-gray-800'
            }`}
          >
            Órdenes de Servicio (O.S.)
          </button>
          <button
            onClick={() => { setActiveSubTab('N.P.'); setStatusFilter('TODOS'); }}
            className={`py-1.5 px-3.5 rounded-md text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'N.P.'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-550 hover:text-gray-800'
            }`}
          >
            Notas de Pedido (N.P.)
          </button>
        </div>
      </div>

      {/* MANAGER DESKTOP LAYOUT WITH TWO RELEVANT COLUMN PANELS */}
      <div id="documents-grid-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: DOCUMENT LIST & FILTERS (5 COLS) */}
        <div id="documents-left-list" className="bg-white border border-gray-200 rounded-xl p-4 lg:col-span-5 space-y-4 shadow-xs">
          
          {/* SEARCH & FILTERS INGREDIENTS */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Buscar ${activeSubTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-md py-1.5 pl-9 pr-3 text-xs text-gray-900 focus:outline-hidden focus:border-gray-400 focus:bg-white font-sans"
              />
            </div>

            {/* Status filters buttons list */}
            <div className="flex gap-1 overflow-x-auto text-[10px] uppercase font-mono tracking-wider scrollbar-none">
              {(['TODOS', 'Emitida', 'Respondida', 'Cerrada'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2 py-1 rounded border whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-gray-800 text-white border-gray-900 font-bold'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-855'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTION TIMELINE LIST */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs font-sans">
                No se encontraron {activeSubTab} coincidentes.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setShowPrintMode(false); }}
                    className={`p-3 rounded-lg border cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-gray-50 border-gray-400 shadow-2xs'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1 pb-1">
                      <span className="font-mono text-xs font-bold text-gray-900">{doc.correlativo}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase font-semibold border ${getStatusBadge(doc.estado)}`}>
                        {doc.estado}
                      </span>
                    </div>
                    <h6 className="text-[11px] font-bold text-gray-805 line-clamp-1">{doc.asunto}</h6>
                    <div className="flex justify-between text-[9px] font-mono text-gray-400 mt-2">
                      <span>Pliego: {activeSubTab === 'O.S.' ? 'D.O. Benítez' : 'Contratistas'}</span>
                      <span>{doc.fechaEmision}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL VIEW, DIGITAL ACTIONS & PRINT Dossier (7 COLS) */}
        <div id="documents-right-detail" className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-7 flex flex-col justify-between min-h-[460px] shadow-xs">
          
          {selectedDoc ? (
            <div className="space-y-5">
              
              {/* DETAILS TOP HEADER BAR */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-mono text-xs font-bold text-gray-900">{selectedDoc.correlativo}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${getStatusBadge(selectedDoc.estado)}`}>
                    {selectedDoc.estado}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setShowPrintMode(!showPrintMode)}
                    className="p-1 px-2 hover:bg-gray-100 rounded border border-gray-200 font-mono text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    {showPrintMode ? 'Cerrar Impreso' : 'Dossier Imprimible'}
                  </button>
                </div>
              </div>

              {/* IF IN PRINT DOSSIER MODE (Highly professional inspection visual mock) */}
              {showPrintMode ? (
                <div 
                  id="print-ready-dossier" 
                  className="bg-gray-50 border border-gray-250 rounded-md p-6 text-gray-900 font-sans space-y-4 shadow-xs"
                >
                  <div className="border-b-2 border-gray-300 pb-2 text-center">
                    <h5 className="text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase">COPIA DE EXPEDIENTE LEGAL - OBRA VIRAZÓN</h5>
                    <h3 className="text-sm font-bold text-gray-800 font-mono uppercase tracking-wide mt-1">LIBRO OFICIAL DE INSPECCIÓN Y COMUNICACIONES</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-b border-gray-200 pb-3">
                    <div>
                      <span className="text-gray-400 block">PROYECTO:</span>
                      <strong className="text-gray-800">CLUB HOUSE VIRAZÓN NORDELTA</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">N° DOCUMENTO:</span>
                      <strong className="text-gray-800">{selectedDoc.correlativo}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">FECHA EMISIÓN:</span>
                      <strong className="text-gray-800">{selectedDoc.fechaEmision}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">ESTADO LEGAL:</span>
                      <strong className="text-gray-800 uppercase">[ {selectedDoc.estado} ]</strong>
                    </div>
                  </div>

                  <div className="text-[11px] leading-relaxed">
                    <span className="text-gray-400 font-mono text-[9px] block">CUESTIÓN PLANTEADA:</span>
                    <h4 className="font-bold text-gray-850 text-xs mb-1.5">{selectedDoc.asunto}</h4>
                    <p className="text-gray-700 block whitespace-pre-wrap font-serif italic p-3 bg-white rounded border border-gray-200">
                      "{selectedDoc.descripcion}"
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400 font-mono text-[9px] block">EMISIÓN / EMITIDO POR:</span>
                    <p className="text-[11px] font-semibold text-gray-800 font-mono">{selectedDoc.emisor}</p>
                  </div>

                  {/* ANSWER RECORD BLOCK IN PRINT */}
                  {selectedDoc.respuesta ? (
                    <div className="border-t border-dashed border-gray-300 pt-3 space-y-2 mt-4 text-[11px] leading-relaxed">
                      <span className="text-gray-400 font-mono text-[9px] block">CONTESTACIÓN Y DETALLES DEL HECHO:</span>
                      <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 font-serif whitespace-pre-wrap">
                        "{selectedDoc.respuesta}"
                      </p>
                      
                      <div className="flex justify-between items-center pt-2 text-[10px] font-mono text-gray-500">
                        <span>FIRMADO DIGITAL CONTRACTUAL:</span>
                        <strong className="text-gray-900 underline bg-gray-200 px-1.5 py-0.5 rounded">
                          {selectedDoc.firmaVisual} - {selectedDoc.fechaFirma}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-gray-300 pt-4 mt-4 text-center text-[10px] text-gray-400 font-mono italic">
                      --- PENDIENTE DE RESOLUCIÓN & FIRMA RECEPTOR ---
                    </div>
                  )}

                  <div className="border-t-2 border-gray-300 pt-3 text-[9px] text-gray-400 font-mono block text-center uppercase tracking-wide">
                    CONFORME A PLIEGOS TÉCNICOS VIRAZÓN. NO PERMITE ENMIENDAS FÍSICAS AL MARGEN.
                  </div>
                </div>
              ) : (
                /* IF IN TRADITIONAL APP FORMAT WRAP */
                <div className="space-y-4 text-xs">
                  
                  {/* METADATA SUMMARY HEADER PANEL */}
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 grid grid-cols-2 gap-3 leading-relaxed">
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase">Emisor Autor</span>
                      <span className="font-semibold text-gray-800 block">{selectedDoc.emisor}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase">Sujeto Destinatario</span>
                      <span className="font-semibold text-gray-800 block">{selectedDoc.receptor}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase">Fecha Emisión</span>
                      <span className="font-mono text-gray-750 font-semibold">{selectedDoc.fechaEmision}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block uppercase">Plazo Máximo Gestión</span>
                      <span className="font-mono text-rose-700 font-semibold">{selectedDoc.fechaLimiteRespuesta || 'No aplica'}</span>
                    </div>
                  </div>

                  {/* DOCUMENT DETAILED TEXT */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Asunto & Cuestión Técnica</span>
                    <h5 className="text-sm font-bold text-gray-950 font-sans tracking-tight">{selectedDoc.asunto}</h5>
                    <p className="text-gray-700 font-sans leading-relaxed text-[12px] bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                      {selectedDoc.descripcion}
                    </p>
                  </div>

                  {/* RESPONSE PRESENTATION BLOCK */}
                  {selectedDoc.respuesta ? (
                    <div className="space-y-1.5 border-t border-gray-200 pt-4">
                      <span className="text-[10px] font-mono text-amber-600 uppercase tracking-widest block">Contestación de Expediente</span>
                      <p className="text-gray-700 font-sans leading-relaxed text-[12px] bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                        {selectedDoc.respuesta}
                      </p>
                      
                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-405 pt-1">
                        <span>Firma del Remitente:</span>
                        <span className="text-gray-800 font-bold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          👤 {selectedDoc.firmaVisual} ({selectedDoc.fechaFirma})
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* RESPONSE FILLABLE FORM */
                    selectedDoc.estado === 'Emitida' && (
                      <form onSubmit={handleAnswerSubmit} className="space-y-3.5 border-t border-gray-200 pt-4">
                        <div className="flex items-center gap-1 text-[10px] font-mono text-amber-600 uppercase tracking-wider">
                          <FileSignature className="w-4 h-4" />
                          <span>Asignar Respuesta Oficial Con Tracto Legal</span>
                        </div>

                        <div className="space-y-1.5">
                          <textarea
                            rows={3}
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="w-full bg-gray-55 border border-gray-200 rounded p-2 text-gray-900 text-xs focus:outline-hidden focus:border-gray-400 focus:bg-white leading-relaxed font-sans"
                            placeholder="Ingrese las cláusulas de corrección de la anomalía, el detalle técnico de planos referenciados, aditivos aplicados..."
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              className="w-full bg-gray-55 border border-gray-200 rounded p-1.5 text-xs text-gray-900 font-mono text-center focus:outline-hidden focus:border-gray-400 focus:bg-white"
                              placeholder="Firma Electrónica Corriente"
                              required
                            />
                            <span className="text-[9px] font-mono text-gray-400 text-center block">Identidad civil habilitada</span>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-1.5 font-bold font-sans rounded bg-gray-900 hover:bg-gray-800 text-white transition-all font-mono cursor-pointer select-none"
                          >
                            Firmar electrónicamente
                          </button>
                        </div>
                      </form>
                    )
                  )}

                  {/* BOTTOM ADMIN ACTIONS (such as close document) */}
                  {selectedDoc.estado === 'Respondida' && activeSubTab === 'O.S.' && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 text-[11px]">
                      <span className="text-gray-550">
                        Inspección Dirección de Obra debe validar la solución presentada y proceder al <strong>Cierre de Actuaciones</strong> de obra.
                      </span>
                      <button
                        onClick={handleCloseDocument}
                        className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold tracking-wide font-sans shrink-0 uppercase tracking-wider cursor-pointer"
                      >
                        Autorizar Cierre
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs font-sans">
              Seleccione un documento del panel izquierdo para auditar e imprimir.
            </div>
          )}
          
          <div className="text-[10px] font-mono text-gray-400 border-t border-gray-200 pt-2.5 mt-3 text-center">
            Plataforma Oficial de Seguimiento Técnico • Bojana Estudio
          </div>
        </div>
      </div>
    </div>
  );
}
