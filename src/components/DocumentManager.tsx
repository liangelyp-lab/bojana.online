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
      case 'Borrador': return "bg-bojana-soft text-bojana-muted border-bojana-line";
      case 'Emitida': return "bg-bojana-soft text-bojana-error border-bojana-error";
      case 'Respondida': return "bg-bojana-waiting text-bojana-ink border-bojana-line";
      case 'Cerrada': return "bg-bojana-soft text-bojana-success border-bojana-success";
      default: return "bg-bojana-surface text-bojana-ink border-bojana-line";
    }
  };

  return (
    <div id="document-manager-main" className="space-y-bojana-block">

      {/* SECTION TABS FOR DOCUMENT TYPE */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-bojana-block border-b border-bojana-line pb-3">
        <div className="flex gap-bojana-inside bg-bojana-soft p-1 rounded-bojana-widget self-start border border-bojana-line">
          <button
            onClick={() => { setActiveSubTab('O.S.'); setStatusFilter('TODOS'); }}
            className={`bojana-button bojana-button-text py-1.5 px-3.5 rounded-bojana-widget text-xs font-sans font-medium uppercase transition-all cursor-pointer ${
              activeSubTab === "O.S."
                ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget"
                : "text-bojana-muted hover:text-bojana-ink"
            }`}
          >
            Órdenes de Servicio (O.S.)
          </button>
          <button
            onClick={() => { setActiveSubTab('N.P.'); setStatusFilter('TODOS'); }}
            className={`bojana-button bojana-button-text py-1.5 px-3.5 rounded-bojana-widget text-xs font-sans font-medium uppercase transition-all cursor-pointer ${
              activeSubTab === "N.P."
                ? "bg-bojana-surface text-bojana-ink shadow-bojana-widget"
                : "text-bojana-muted hover:text-bojana-ink"
            }`}
          >
            Notas de Pedido (N.P.)
          </button>
        </div>
      </div>

      {/* MANAGER DESKTOP LAYOUT WITH TWO RELEVANT COLUMN PANELS */}
      <div id="documents-grid-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-bojana-block">

        {/* LEFT COLUMN: DOCUMENT LIST & FILTERS (5 COLS) */}
        <div id="documents-left-list" className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-4 lg:col-span-5 space-y-bojana-block shadow-bojana-widget">

          {/* SEARCH & FILTERS INGREDIENTS */}
          <div className="space-y-bojana-inside">
            <div className="relative">
              <Search className="w-4 h-4 text-bojana-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Buscar ${activeSubTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget py-1.5 pl-9 pr-3 text-xs text-bojana-ink focus:outline-hidden focus:border-bojana-line focus:bg-bojana-surface font-sans"
              />
            </div>

            {/* Status filters buttons list */}
            <div className="flex gap-bojana-inside overflow-x-auto text-xs uppercase font-sans tracking-normal scrollbar-none">
              {(['TODOS', 'Emitida', 'Respondida', 'Cerrada'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`bojana-button bojana-button-primary px-2 py-1 rounded-bojana-widget border whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === filter
                      ? "bg-bojana-ink text-bojana-inverse border-bojana-line font-medium"
                      : "bg-bojana-surface text-bojana-muted border-bojana-line hover:text-bojana-ink"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTION TIMELINE LIST */}
          <div className="space-y-bojana-inside max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-10 text-bojana-muted text-xs font-sans">
                No se encontraron {activeSubTab} coincidentes.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setShowPrintMode(false); }}
                    className={`bojana-widget p-3 rounded-bojana-widget border cursor-pointer transition select-none ${
                      isSelected
                        ? "bg-bojana-surface border-bojana-line shadow-bojana-widget"
                        : "bg-bojana-surface border-bojana-line hover:bg-bojana-surface hover:border-bojana-line"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-bojana-inside pb-1">
                      <span className="font-sans text-xs font-medium text-bojana-ink">{doc.correlativo}</span>
                      <span className={`px-1.5 py-0.5 rounded-bojana-badge text-xs font-sans tracking-normal uppercase font-medium border ${getStatusBadge(doc.estado)}`}>
                        {doc.estado}
                      </span>
                    </div>
                    <h6 className="bojana-heading-component text-xs font-medium text-bojana-ink line-clamp-1">{doc.asunto}</h6>
                    <div className="flex justify-between text-xs font-sans text-bojana-muted mt-2">
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
        <div id="documents-right-detail" className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-5 lg:col-span-7 flex flex-col justify-between min-h-[460px] shadow-bojana-widget">

          {selectedDoc ? (
            <div className="space-y-bojana-block">

              {/* DETAILS TOP HEADER BAR */}
              <div className="flex items-center justify-between border-b border-bojana-line pb-2 flex-wrap gap-bojana-inside">
                <div className="flex items-center gap-bojana-inside">
                  <FileText className="w-4 h-4 text-bojana-muted" />
                  <span className="font-sans text-xs font-medium text-bojana-ink">{selectedDoc.correlativo}</span>
                  <span className={`px-1.5 py-0.5 rounded-bojana-badge text-xs font-sans border ${getStatusBadge(selectedDoc.estado)}`}>
                    {selectedDoc.estado}
                  </span>
                </div>

                <div className="flex items-center gap-bojana-inside text-xs">
                  <button
                    onClick={() => setShowPrintMode(!showPrintMode)}
                    className="bojana-button bojana-button-secondary p-1 px-2 hover:bg-bojana-soft rounded-bojana-widget border border-bojana-line font-sans text-xs text-bojana-muted hover:text-bojana-ink flex items-center gap-bojana-inside cursor-pointer"
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
                  className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 text-bojana-ink font-sans space-y-bojana-block shadow-bojana-widget"
                >
                  <div className="border-b-2 border-bojana-line pb-2 text-center">
                    <h5 className="bojana-heading-component text-xs font-sans font-medium tracking-normal text-bojana-muted uppercase">COPIA DE EXPEDIENTE LEGAL - OBRA VIRAZÓN</h5>
                    <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans uppercase tracking-normal mt-1">LIBRO OFICIAL DE INSPECCIÓN Y COMUNICACIONES</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-bojana-block text-xs font-sans border-b border-bojana-line pb-3">
                    <div>
                      <span className="text-bojana-muted block">PROYECTO:</span>
                      <strong className="text-bojana-ink">CLUB HOUSE VIRAZÓN NORDELTA</strong>
                    </div>
                    <div>
                      <span className="text-bojana-muted block">N° DOCUMENTO:</span>
                      <strong className="text-bojana-ink">{selectedDoc.correlativo}</strong>
                    </div>
                    <div>
                      <span className="text-bojana-muted block">FECHA EMISIÓN:</span>
                      <strong className="text-bojana-ink">{selectedDoc.fechaEmision}</strong>
                    </div>
                    <div>
                      <span className="text-bojana-muted block">ESTADO LEGAL:</span>
                      <strong className="text-bojana-ink uppercase">[ {selectedDoc.estado} ]</strong>
                    </div>
                  </div>

                  <div className="text-xs leading-relaxed">
                    <span className="text-bojana-muted font-sans text-xs block">CUESTIÓN PLANTEADA:</span>
                    <h4 className="bojana-heading-component font-medium text-bojana-ink text-xs mb-1.5">{selectedDoc.asunto}</h4>
                    <p className="text-bojana-ink block whitespace-pre-wrap font-sans italic p-3 bg-bojana-surface rounded-bojana-widget border border-bojana-line">
                      "{selectedDoc.descripcion}"
                    </p>
                  </div>

                  <div>
                    <span className="text-bojana-muted font-sans text-xs block">EMISIÓN / EMITIDO POR:</span>
                    <p className="text-xs font-medium text-bojana-ink font-sans">{selectedDoc.emisor}</p>
                  </div>

                  {/* ANSWER RECORD BLOCK IN PRINT */}
                  {selectedDoc.respuesta ? (
                    <div className="border-t border-dashed border-bojana-line pt-3 space-y-bojana-inside mt-4 text-xs leading-relaxed">
                      <span className="text-bojana-muted font-sans text-xs block">CONTESTACIÓN Y DETALLES DEL HECHO:</span>
                      <p className="text-bojana-ink bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line font-sans whitespace-pre-wrap">
                        "{selectedDoc.respuesta}"
                      </p>

                      <div className="flex justify-between items-center pt-2 text-xs font-sans text-bojana-muted">
                        <span>FIRMADO DIGITAL CONTRACTUAL:</span>
                        <strong className="text-bojana-ink underline bg-bojana-soft px-1.5 py-0.5 rounded-bojana-widget">
                          {selectedDoc.firmaVisual} - {selectedDoc.fechaFirma}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-bojana-line pt-4 mt-4 text-center text-xs text-bojana-muted font-sans italic">
                      --- PENDIENTE DE RESOLUCIÓN & FIRMA RECEPTOR ---
                    </div>
                  )}

                  <div className="border-t-2 border-bojana-line pt-3 text-xs text-bojana-muted font-sans block text-center uppercase tracking-normal">
                    CONFORME A PLIEGOS TÉCNICOS VIRAZÓN. NO PERMITE ENMIENDAS FÍSICAS AL MARGEN.
                  </div>
                </div>
              ) : (
                /* IF IN TRADITIONAL APP FORMAT WRAP */
                <div className="space-y-bojana-block text-xs">

                  {/* METADATA SUMMARY HEADER PANEL */}
                  <div className="bojana-widget bg-bojana-surface p-3.5 rounded-bojana-widget border border-bojana-line grid grid-cols-2 gap-3 leading-relaxed">
                    <div>
                      <span className="text-xs font-sans text-bojana-muted block uppercase">Emisor Autor</span>
                      <span className="font-medium text-bojana-ink block">{selectedDoc.emisor}</span>
                    </div>
                    <div>
                      <span className="text-xs font-sans text-bojana-muted block uppercase">Sujeto Destinatario</span>
                      <span className="font-medium text-bojana-ink block">{selectedDoc.receptor}</span>
                    </div>
                    <div>
                      <span className="text-xs font-sans text-bojana-muted block uppercase">Fecha Emisión</span>
                      <span className="font-sans text-bojana-ink font-medium">{selectedDoc.fechaEmision}</span>
                    </div>
                    <div>
                      <span className="text-xs font-sans text-bojana-muted block uppercase">Plazo Máximo Gestión</span>
                      <span className="font-sans text-bojana-error font-medium">{selectedDoc.fechaLimiteRespuesta || 'No aplica'}</span>
                    </div>
                  </div>

                  {/* DOCUMENT DETAILED TEXT */}
                  <div className="space-y-bojana-inside">
                    <span className="text-xs font-sans text-bojana-muted uppercase tracking-normal block">Asunto & Cuestión Técnica</span>
                    <h5 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans tracking-normal">{selectedDoc.asunto}</h5>
                    <p className="text-bojana-ink font-sans leading-relaxed text-[12px] bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line whitespace-pre-wrap">
                      {selectedDoc.descripcion}
                    </p>
                  </div>

                  {/* RESPONSE PRESENTATION BLOCK */}
                  {selectedDoc.respuesta ? (
                    <div className="space-y-bojana-inside border-t border-bojana-line pt-4">
                      <span className="text-xs font-sans text-bojana-ink uppercase tracking-normal block">Contestación de Expediente</span>
                      <p className="text-bojana-ink font-sans leading-relaxed text-[12px] bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line whitespace-pre-wrap">
                        {selectedDoc.respuesta}
                      </p>

                      <div className="flex justify-between items-center text-xs font-sans text-bojana-muted pt-1">
                        <span>Firma del Remitente:</span>
                        <span className="text-bojana-ink font-medium bg-bojana-soft px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                          👤 {selectedDoc.firmaVisual} ({selectedDoc.fechaFirma})
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* RESPONSE FILLABLE FORM */
                    selectedDoc.estado === 'Emitida' && (
                      <form onSubmit={handleAnswerSubmit} className="space-y-bojana-inside border-t border-bojana-line pt-4">
                        <div className="flex items-center gap-bojana-inside text-xs font-sans text-bojana-ink uppercase tracking-normal">
                          <FileSignature className="w-4 h-4" />
                          <span>Asignar Respuesta Oficial Con Tracto Legal</span>
                        </div>

                        <div className="space-y-bojana-inside">
                          <textarea
                            rows={3}
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="bojana-field w-full bg-bojana-soft border border-bojana-line rounded-bojana-widget p-2 text-bojana-ink text-xs focus:outline-hidden focus:border-bojana-line focus:bg-bojana-surface leading-relaxed font-sans"
                            placeholder="Ingrese las cláusulas de corrección de la anomalía, el detalle técnico de planos referenciados, aditivos aplicados..."
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="space-y-bojana-inside">
                            <input
                              type="text"
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              className="bojana-field w-full bg-bojana-soft border border-bojana-line rounded-bojana-widget p-1.5 text-xs text-bojana-ink font-sans text-center focus:outline-hidden focus:border-bojana-line focus:bg-bojana-surface"
                              placeholder="Firma Electrónica Corriente"
                              required
                            />
                            <span className="text-xs font-sans text-bojana-muted text-center block">Identidad civil habilitada</span>
                          </div>

                          <button
                            type="submit"
                            className="bojana-button bojana-button-primary w-full py-1.5 font-medium font-sans rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse transition-all font-sans cursor-pointer select-none"
                          >
                            Firmar electrónicamente
                          </button>
                        </div>
                      </form>
                    )
                  )}

                  {/* BOTTOM ADMIN ACTIONS (such as close document) */}
                  {selectedDoc.estado === 'Respondida' && activeSubTab === 'O.S.' && (
                    <div className="bojana-widget p-3 bg-bojana-surface rounded-bojana-widget border border-bojana-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 text-xs">
                      <span className="text-bojana-muted">
                        Inspección Dirección de Obra debe validar la solución presentada y proceder al <strong>Cierre de Actuaciones</strong> de obra.
                      </span>
                      <button
                        onClick={handleCloseDocument}
                        className="bojana-button bojana-button-primary py-1 px-3 bg-bojana-success hover:bg-bojana-success rounded-bojana-widget text-bojana-inverse font-medium tracking-normal font-sans shrink-0 uppercase tracking-normal cursor-pointer"
                      >
                        Autorizar Cierre
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-bojana-muted text-xs font-sans">
              Seleccione un documento del panel izquierdo para auditar e imprimir.
            </div>
          )}

          <div className="text-xs font-sans text-bojana-muted border-t border-bojana-line pt-2.5 mt-3 text-center">
            Plataforma Oficial de Seguimiento Técnico • Bojana Estudio
          </div>
        </div>
      </div>
    </div>
  );
}
