import { MediaComparison } from '../ui/Media';
import React, { useState } from 'react';
import {
  ProjectData,
  DecisionItem,
  DecisionStatus,
  DecisionOption,
  DecisionComment
} from '../../types';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Plus,
  Trash2,
  Send,
  ArrowRight,
  Check,
  X,
  FileText,
  CornerDownRight,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

interface DecisionesModuleProps {
  project: ProjectData;
  isAdmin: boolean;
  onUpdateDecisiones: (decisiones: DecisionItem[]) => void;
  onToast: (msg: string) => void;
}

export default function DecisionesModule({
  project,
  isAdmin,
  onUpdateDecisiones,
  onToast
}: DecisionesModuleProps) {
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Comment input per decision
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // New Decision Form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'decision_diseno' | 'revision_tecnica'>('decision_diseno');
  const [newDesc, setNewDesc] = useState('');
  const [optATitle, setOptATitle] = useState('Roble natural con cantos ABS');
  const [optADesc, setOptADesc] = useState('Tono cálido, textura de veta suave y acabado mate.');
  const [optBTitle, setOptBTitle] = useState('Roble oscuro tintado al aceite');
  const [optBDesc, setOptBDesc] = useState('Contraste contemporáneo con herrajes negro mate.');

  const decisiones = project.decisiones || [];

  const filteredDecisiones = decisiones.filter(d => {
    if (filterStatus === 'todos') return true;
    return d.estado === filterStatus;
  });

  const getStatusBadge = (status: DecisionStatus) => {
    switch (status) {
      case 'Aprobado':
        return "bg-bojana-soft text-bojana-success border-bojana-success";
      case 'Requiere cambios':
        return "bg-bojana-waiting text-bojana-ink border-bojana-line";
      case 'Pendiente':
      default:
        return "bg-bojana-soft text-bojana-error border-bojana-error";
    }
  };

  // Client or Admin approves an option
  const handleApproveOption = (decisionId: string, optionId: string, optionTitle: string) => {
    const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const authorName = isAdmin ? 'Bojana Estudio' : (project.cliente.nombre || 'Cliente');

    const updated = decisiones.map(d => {
      if (d.id === decisionId) {
        const approvalComment: DecisionComment = {
          id: `c-${Date.now()}`,
          autor: authorName,
          rol: isAdmin ? 'admin' : 'cliente',
          fecha: new Date().toLocaleDateString('es-AR'),
          texto: `Aprobado por ${authorName} (${optionTitle}).`
        };

        return {
          ...d,
          estado: 'Aprobado' as DecisionStatus,
          fechaDecision: today,
          opcionAprobadaId: optionId,
          comentarios: [...d.comentarios, approvalComment]
        };
      }
      return d;
    });

    onUpdateDecisiones(updated);
    onToast(`Opción "${optionTitle}" aprobada y registrada en el portal.`);
  };

  // Request changes
  const handleRequestChanges = (decisionId: string) => {
    const commentText = commentInputs[decisionId]?.trim();
    if (!commentText) {
      onToast('Por favor ingrese un comentario explicando qué cambios solicita.');
      return;
    }

    const authorName = isAdmin ? 'Bojana Estudio' : (project.cliente.nombre || 'Cliente');

    const updated = decisiones.map(d => {
      if (d.id === decisionId) {
        const changeComment: DecisionComment = {
          id: `c-${Date.now()}`,
          autor: authorName,
          rol: isAdmin ? 'admin' : 'cliente',
          fecha: new Date().toLocaleDateString('es-AR'),
          texto: commentText
        };

        return {
          ...d,
          estado: 'Requiere cambios' as DecisionStatus,
          comentarios: [...d.comentarios, changeComment]
        };
      }
      return d;
    });

    onUpdateDecisiones(updated);
    setCommentInputs(prev => ({ ...prev, [decisionId]: '' }));
    onToast('Solicitud de cambios registrada con feedback para el equipo.');
  };

  // Add simple comment
  const handleAddComment = (decisionId: string) => {
    const text = commentInputs[decisionId]?.trim();
    if (!text) return;

    const authorName = isAdmin ? 'Bojana Estudio' : (project.cliente.nombre || 'Cliente');

    const updated = decisiones.map(d => {
      if (d.id === decisionId) {
        const newCom: DecisionComment = {
          id: `c-${Date.now()}`,
          autor: authorName,
          rol: isAdmin ? 'admin' : 'cliente',
          fecha: new Date().toLocaleDateString('es-AR'),
          texto: text
        };
        return {
          ...d,
          comentarios: [...d.comentarios, newCom]
        };
      }
      return d;
    });

    onUpdateDecisiones(updated);
    setCommentInputs(prev => ({ ...prev, [decisionId]: '' }));
    onToast('Comentario enviado.');
  };

  // Direct status update for technical reviews
  const handleSetStatus = (decisionId: string, status: DecisionStatus) => {
    const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const updated = decisiones.map(d => {
      if (d.id === decisionId) {
        return {
          ...d,
          estado: status,
          fechaDecision: status === 'Aprobado' ? today : d.fechaDecision
        };
      }
      return d;
    });

    onUpdateDecisiones(updated);
    onToast(`Estado de revisión actualizado a: ${status}`);
  };

  const handleDeleteDecision = (decisionId: string) => {
    if (window.confirm('¿Eliminar este ítem de decisiones?')) {
      const updated = decisiones.filter(d => d.id !== decisionId);
      onUpdateDecisiones(updated);
      onToast('Ítem eliminado.');
    }
  };

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const opciones: DecisionOption[] | undefined = newType === 'decision_diseno' ? [
      {
        id: `opt-a-${Date.now()}`,
        letra: 'Opción A',
        titulo: optATitle.trim() || 'Opción A',
        descripcion: optADesc.trim(),
        imagenUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        costoEstimado: 'Incluido en pliego base'
      },
      {
        id: `opt-b-${Date.now()}`,
        letra: 'Opción B',
        titulo: optBTitle.trim() || 'Opción B',
        descripcion: optBDesc.trim(),
        imagenUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80',
        costoEstimado: 'Alternativa propuesta'
      }
    ] : undefined;

    const newDec: DecisionItem = {
      id: `dec-${Date.now()}`,
      titulo: newTitle.trim(),
      tipo: newType,
      descripcion: newDesc.trim() || 'Propuesta de Bojana Estudio para convalidación del comitente.',
      fechaCreacion: new Date().toLocaleDateString('es-AR'),
      estado: 'Pendiente',
      opciones,
      comentarios: [
        {
          id: `c-init-${Date.now()}`,
          autor: 'Bojana Estudio',
          rol: 'admin',
          fecha: new Date().toLocaleDateString('es-AR'),
          texto: 'Propuesta enviada para su revisión. Aguardamos su confirmación.'
        }
      ]
    };

    const updated = [newDec, ...decisiones];
    onUpdateDecisiones(updated);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    onToast(`"${newDec.titulo}" agregada a Decisiones.`);
  };

  return (
    <div className="space-y-bojana-block max-w-bojana-reading mx-auto pb-8">

      {/* 1. TOP HEADER */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-6 shadow-bojana-widget flex flex-col md:flex-row md:items-center justify-between gap-bojana-block">
        <div>
          <div className="flex items-center gap-bojana-inside">
            <span className="text-xs font-sans uppercase tracking-normal text-bojana-error font-medium">
              Módulo de Decisiones & Revisiones
            </span>
            <span className="text-xs font-sans text-bojana-muted">&bull;</span>
            <span className="text-xs font-sans text-bojana-muted">Convalidación & Registro</span>
          </div>
          <h2 className="bojana-heading-section text-xl font-medium text-bojana-ink font-sans tracking-normal mt-0.5">
            Aprobación de Opciones & Revisiones Técnicas
          </h2>
          <p className="text-xs text-bojana-muted mt-1">
            Espacio interactivo para que el cliente convalide alternativas de terminaciones y revise planos de ingeniería.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bojana-button bojana-button-primary px-4 py-2 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-ink text-bojana-inverse text-xs font-sans font-medium flex items-center gap-bojana-inside transition cursor-pointer shadow-bojana-widget shrink-0"
          >
            <Plus className="w-4 h-4 text-bojana-error" />
            <span>+ Nueva Solicitud</span>
          </button>
        )}
      </div>

      {/* 2. FILTER TABS */}
      <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-3 shadow-bojana-widget flex items-center justify-between gap-3">
        <div className="flex items-center gap-bojana-inside overflow-x-auto">
          {['todos', 'Pendiente', 'Aprobado', 'Requiere cambios'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget text-xs font-sans font-medium transition cursor-pointer ${
                filterStatus === st
                  ? "bg-bojana-ink text-bojana-inverse shadow-bojana-widget"
                  : "bg-bojana-soft text-bojana-muted hover:text-bojana-ink"
              }`}
            >
              {st === 'todos' ? 'Todas las Decisiones' : st}
            </button>
          ))}
        </div>

        <span className="text-xs font-sans text-bojana-muted">
          {filteredDecisiones.length} solicitudes registradas
        </span>
      </div>

      {/* 3. DECISIONS FEED */}
      <div className="space-y-bojana-block">
        {filteredDecisiones.length === 0 ? (
          <div className="bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget p-12 text-center space-y-3">
            <CheckSquare className="w-10 h-10 text-bojana-line mx-auto" />
            <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink">No hay decisiones en este estado</h4>
            <p className="text-xs text-bojana-muted">
              Todas las consultas han sido procesadas o no hay solicitudes pendientes.
            </p>
          </div>
        ) : (
          filteredDecisiones.map((item) => {
            const isApproved = item.estado === 'Aprobado';
            const requiresChanges = item.estado === 'Requiere cambios';
            const isPending = item.estado === 'Pendiente';

            return (
              <div
                key={item.id}
                className="bg-bojana-surface border border-bojana-line rounded-bojana-widget shadow-bojana-widget overflow-hidden transition hover:border-bojana-line"
              >
                {/* Decision Header */}
                <div className="p-5 sm:p-6 border-b border-bojana-line flex flex-col sm:flex-row sm:items-start justify-between gap-bojana-block">
                  <div className="space-y-bojana-inside">
                    <div className="flex flex-wrap items-center gap-bojana-inside">
                      <span className={`text-xs font-sans uppercase px-2.5 py-0.5 rounded-bojana-badge font-medium border ${getStatusBadge(item.estado)}`}>
                        {item.estado}
                      </span>
                      <span className="text-xs font-sans text-bojana-muted bg-bojana-soft px-2 py-0.5 rounded-bojana-badge border border-bojana-line">
                        {item.tipo === 'decision_diseno' ? 'Decisión de Diseño' : 'Revisión Técnica de Ingeniería'}
                      </span>
                      <span className="text-xs font-sans text-bojana-muted">
                        Creada el {item.fechaCreacion}
                      </span>
                    </div>

                    <h3 className="bojana-heading-component text-base sm:text-lg font-medium text-bojana-ink font-sans tracking-normal pt-1">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-bojana-muted leading-relaxed font-sans">
                      {item.descripcion}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDecision(item.id)}
                      className="bojana-icon-button p-1.5 rounded-bojana-widget text-bojana-muted hover:text-bojana-error transition self-end sm:self-start"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Stamped Approval Notice if already decided */}
                {isApproved && (
                  <div className="bg-bojana-soft/80 border-b border-bojana-success px-6 py-3 flex items-center justify-between gap-bojana-block text-xs font-sans text-bojana-success">
                    <div className="flex items-center gap-bojana-inside font-medium">
                      <CheckCircle2 className="w-4 h-4 text-bojana-success shrink-0" />
                      <span>
                        Aprobado por el comitente &bull; {item.fechaDecision || 'Convalidado'}
                      </span>
                      {item.opcionAprobadaId && item.opciones && (
                        <span className="text-bojana-success font-sans font-medium">
                          ({item.opciones.find(o => o.id === item.opcionAprobadaId)?.letra}: {item.opciones.find(o => o.id === item.opcionAprobadaId)?.titulo})
                        </span>
                      )}
                    </div>
                    <span className="text-xs uppercase font-medium bg-bojana-soft/80 text-bojana-success px-2 py-0.5 rounded-bojana-badge">
                      Registro Oficial
                    </span>
                  </div>
                )}

                {/* CASE A: DESIGN DECISION WITH PROPOSED OPTIONS (Opción A vs Opción B) */}
                {item.opciones && item.opciones.length > 0 && (
                  <div className="p-5 sm:p-6 bg-bojana-surface/60 border-b border-bojana-line space-y-bojana-block">
                    <span className="text-xs font-sans uppercase tracking-normal text-bojana-muted font-medium block">
                      Alternativas Propuestas por Bojana Estudio
                    </span>

                    <MediaComparison items={item.opciones.filter(opt => opt.imagenUrl).map(opt => ({ id: opt.id, title: `${opt.letra || ''} ${opt.titulo}`, src: opt.imagenUrl! }))} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-bojana-block">
                      {item.opciones.map((opt) => {
                        const isThisOptApproved = item.opcionAprobadaId === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`bojana-widget rounded-bojana-widget border p-4 transition flex flex-col justify-between space-y-3 ${
                              isThisOptApproved
                                ? "bg-bojana-soft/80 border-bojana-success ring-2 ring-bojana-success shadow-bojana-widget"
                                : "bg-bojana-surface border-bojana-line hover:border-bojana-line"
                            }`}
                          >
                            <div className="space-y-bojana-inside">
                              {opt.imagenUrl && item.opciones.filter(o => o.imagenUrl).length < 2 && (
                                <div className="aspect-16/10 rounded-bojana-widget overflow-hidden bg-bojana-soft border border-bojana-line">
                                  <img
                                    src={opt.imagenUrl}
                                    alt={opt.titulo}
                                    className="bojana-media w-full h-full object-contain"
                                  />
                                </div>
                              )}

                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-sans font-medium uppercase tracking-normal text-bojana-ink bg-bojana-soft px-2 py-0.5 rounded-bojana-badge">
                                    {opt.letra}
                                  </span>
                                  {isThisOptApproved && (
                                    <span className="text-xs font-sans font-medium text-bojana-success bg-bojana-soft px-2 py-0.5 rounded-bojana-badge flex items-center gap-bojana-inside">
                                      <Check className="w-3 h-3 text-bojana-success" />
                                      <span>Opción Seleccionada</span>
                                    </span>
                                  )}
                                </div>

                                <h4 className="bojana-heading-component text-sm font-medium text-bojana-ink mt-1">{opt.titulo}</h4>
                                {opt.descripcion && (
                                  <p className="text-xs text-bojana-muted mt-1 leading-normal">
                                    {opt.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="border-t border-bojana-line pt-3 flex items-center justify-between text-xs">
                              {opt.costoEstimado && (
                                <span className="text-xs font-sans text-bojana-muted">
                                  {opt.costoEstimado}
                                </span>
                              )}

                              {/* Action buttons if not yet approved */}
                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveOption(item.id, opt.id, `${opt.letra}: ${opt.titulo}`)}
                                  className="bojana-button bojana-button-primary px-3 py-1.5 rounded-bojana-widget bg-bojana-ink hover:bg-bojana-success text-bojana-inverse font-sans text-xs font-medium transition cursor-pointer flex items-center gap-bojana-inside shadow-bojana-widget"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aprobar {opt.letra}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CASE B: TECHNICAL ENGINEERING REVIEW (Direct 3-State Controls) */}
                {item.tipo === 'revision_tecnica' && (
                  <div className="p-4 sm:p-5 bg-bojana-surface/60 border-b border-bojana-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-xs font-sans text-bojana-muted font-medium">
                      Control de Convalidación Técnica:
                    </span>

                    <div className="flex items-center gap-bojana-inside">
                      {(['Pendiente', 'Aprobado', 'Requiere cambios'] as DecisionStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleSetStatus(item.id, st)}
                          className={`bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget font-sans text-xs font-medium transition border cursor-pointer ${
                            item.estado === st
                              ? getStatusBadge(st) + "shadow-bojana-widget"
                              : "bg-bojana-surface text-bojana-muted border-bojana-line hover:bg-bojana-soft"
                          }`}
                        >
                          {st === 'Aprobado' && <Check className="w-3 h-3 inline mr-1" />}
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. COMMENTS & FEEDBACK THREAD */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-bojana-inside text-xs font-sans text-bojana-muted font-medium uppercase tracking-normal">
                    <MessageSquare className="w-3.5 h-3.5 text-bojana-muted" />
                    <span>Registro de Comentarios & Observaciones ({item.comentarios.length})</span>
                  </div>

                  {item.comentarios.length > 0 && (
                    <div className="space-y-bojana-inside pl-2 border-l-2 border-bojana-line">
                      {item.comentarios.map((c) => (
                        <div key={c.id} className="text-xs space-y-0.5">
                          <div className="flex items-center gap-bojana-inside">
                            <strong className="text-bojana-ink font-medium">{c.autor}</strong>
                            <span className="text-xs font-sans text-bojana-muted">{c.fecha}</span>
                          </div>
                          <p className="text-bojana-ink bg-bojana-surface p-2.5 rounded-bojana-widget border border-bojana-line inline-block font-sans max-w-2xl leading-normal">
                            {c.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input for new comment or requesting changes */}
                  <div className="pt-2">
                    <div className="flex items-center gap-bojana-inside">
                      <input
                        type="text"
                        placeholder="Escribir un comentario o aclaración..."
                        value={commentInputs[item.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(item.id);
                        }}
                        className="bojana-field flex-1 bg-bojana-surface border border-bojana-line rounded-bojana-widget px-3 py-2 text-xs text-bojana-ink focus:bg-bojana-surface focus:outline-hidden focus:border-bojana-line"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(item.id)}
                        className="bojana-button bojana-button-text px-3 py-2 rounded-bojana-widget bg-bojana-soft hover:bg-bojana-soft text-bojana-ink text-xs font-sans font-medium transition cursor-pointer"
                      >
                        Enviar
                      </button>

                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => handleRequestChanges(item.id)}
                          className="bojana-button bojana-button-text px-3 py-2 rounded-bojana-widget bg-bojana-waiting hover:bg-bojana-waiting text-bojana-ink text-xs font-sans font-medium transition cursor-pointer whitespace-nowrap"
                        >
                          Solicitar Cambios
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL: NUEVA SOLICITUD DE DECISIÓN (ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bojana-modal bojana-widget bg-bojana-surface border border-bojana-line rounded-bojana-widget max-w-bojana-modal w-full p-6 shadow-bojana-widget space-y-bojana-block animate-scale-up">
            <div className="flex items-center justify-between border-b border-bojana-line pb-3">
              <h3 className="bojana-heading-component text-sm font-medium text-bojana-ink font-sans">
                Crear Solicitud de Decisión o Revisión
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="bojana-button bojana-button-text text-bojana-muted hover:text-bojana-ink">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-bojana-block text-xs">
              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Tipo de Solicitud</label>
                <div className="grid grid-cols-2 gap-bojana-inside font-sans">
                  <button
                    type="button"
                    onClick={() => setNewType('decision_diseno')}
                    className={`bojana-button bojana-button-primary p-2 rounded-bojana-widget border font-medium text-left ${
                      newType === "decision_diseno"
                        ? "bg-bojana-ink text-bojana-inverse border-bojana-line"
                        : "bg-bojana-surface text-bojana-ink border-bojana-line"
                    }`}
                  >
                    <span>Decisión con Opciones (A / B)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('revision_tecnica')}
                    className={`bojana-button bojana-button-primary p-2 rounded-bojana-widget border font-medium text-left ${
                      newType === "revision_tecnica"
                        ? "bg-bojana-ink text-bojana-inverse border-bojana-line"
                        : "bg-bojana-surface text-bojana-ink border-bojana-line"
                    }`}
                  >
                    <span>Revisión Técnica / Plano</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Título</label>
                <input
                  type="text"
                  required
                  placeholder={newType === 'decision_diseno' ? 'ej: Terminación de cocina' : 'ej: Plano eléctrico — Rev. 02'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2.5 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              <div>
                <label className="font-sans text-bojana-muted font-medium block mb-1">Descripción / Alcance</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre lo que se somete a convalidación del comitente..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs text-bojana-ink focus:bg-bojana-surface"
                />
              </div>

              {/* Options fields if design decision */}
              {newType === 'decision_diseno' && (
                <div className="space-y-3 border-t border-bojana-line pt-3">
                  <span className="text-xs font-sans uppercase text-bojana-muted font-medium block">
                    Alternativas para el Cliente
                  </span>

                  <div className="bojana-widget bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line space-y-bojana-inside">
                    <span className="text-xs font-sans font-medium text-bojana-ink">Opción A:</span>
                    <input
                      type="text"
                      placeholder="Título Opción A (ej: Roble natural)"
                      value={optATitle}
                      onChange={(e) => setOptATitle(e.target.value)}
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Descripción breve Opción A"
                      value={optADesc}
                      onChange={(e) => setOptADesc(e.target.value)}
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                    />
                  </div>

                  <div className="bojana-widget bg-bojana-surface p-3 rounded-bojana-widget border border-bojana-line space-y-bojana-inside">
                    <span className="text-xs font-sans font-medium text-bojana-ink">Opción B:</span>
                    <input
                      type="text"
                      placeholder="Título Opción B (ej: Roble oscuro)"
                      value={optBTitle}
                      onChange={(e) => setOptBTitle(e.target.value)}
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Descripción breve Opción B"
                      value={optBDesc}
                      onChange={(e) => setOptBDesc(e.target.value)}
                      className="bojana-field w-full bg-bojana-surface border border-bojana-line rounded-bojana-widget p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-bojana-inside pt-3 border-t border-bojana-line">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bojana-button bojana-button-secondary px-3 py-1.5 rounded-bojana-widget border border-bojana-line text-bojana-ink font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bojana-button bojana-button-primary px-4 py-1.5 rounded-bojana-widget bg-bojana-ink text-bojana-inverse font-sans font-medium"
                >
                  Publicar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
