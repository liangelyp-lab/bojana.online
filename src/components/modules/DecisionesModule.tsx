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
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Requiere cambios':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Pendiente':
      default:
        return 'bg-rose-50 text-rose-800 border-rose-300';
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
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      
      {/* 1. TOP HEADER */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-bold">
              Módulo de Decisiones & Revisiones
            </span>
            <span className="text-[10px] font-mono text-gray-400">&bull;</span>
            <span className="text-[10px] font-mono text-gray-500">Convalidación & Registro</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 font-sans tracking-tight mt-0.5">
            Aprobación de Opciones & Revisiones Técnicas
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Espacio interactivo para que el cliente convalide alternativas de terminaciones y revise planos de ingeniería.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <span>+ Nueva Solicitud</span>
          </button>
        )}
      </div>

      {/* 2. FILTER TABS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['todos', 'Pendiente', 'Aprobado', 'Requiere cambios'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                filterStatus === st 
                  ? 'bg-gray-950 text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {st === 'todos' ? 'Todas las Decisiones' : st}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono text-gray-400">
          {filteredDecisiones.length} solicitudes registradas
        </span>
      </div>

      {/* 3. DECISIONS FEED */}
      <div className="space-y-6">
        {filteredDecisiones.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
            <CheckSquare className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">No hay decisiones en este estado</h4>
            <p className="text-xs text-gray-500">
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
                className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition hover:border-gray-300"
              >
                {/* Decision Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(item.estado)}`}>
                        {item.estado}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {item.tipo === 'decision_diseno' ? 'Decisión de Diseño' : 'Revisión Técnica de Ingeniería'}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">
                        Creada el {item.fechaCreacion}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-950 font-sans tracking-tight pt-1">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      {item.descripcion}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDecision(item.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-rose-600 transition self-end sm:self-start"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Stamped Approval Notice if already decided */}
                {isApproved && (
                  <div className="bg-emerald-50/80 border-b border-emerald-100 px-6 py-3 flex items-center justify-between gap-4 text-xs font-mono text-emerald-900">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        Aprobado por el comitente &bull; {item.fechaDecision || 'Convalidado'}
                      </span>
                      {item.opcionAprobadaId && item.opciones && (
                        <span className="text-emerald-800 font-sans font-semibold">
                          ({item.opciones.find(o => o.id === item.opcionAprobadaId)?.letra}: {item.opciones.find(o => o.id === item.opcionAprobadaId)?.titulo})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded">
                      Registro Oficial
                    </span>
                  </div>
                )}

                {/* CASE A: DESIGN DECISION WITH PROPOSED OPTIONS (Opción A vs Opción B) */}
                {item.opciones && item.opciones.length > 0 && (
                  <div className="p-5 sm:p-6 bg-gray-50/60 border-b border-gray-100 space-y-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">
                      Alternativas Propuestas por Bojana Estudio
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.opciones.map((opt) => {
                        const isThisOptApproved = item.opcionAprobadaId === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`rounded-xl border p-4 transition flex flex-col justify-between space-y-3 ${
                              isThisOptApproved
                                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="space-y-2">
                              {opt.imagenUrl && (
                                <div className="aspect-16/9 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  <img 
                                    src={opt.imagenUrl} 
                                    alt={opt.titulo}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                    {opt.letra}
                                  </span>
                                  {isThisOptApproved && (
                                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-700" />
                                      <span>Opción Seleccionada</span>
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm font-bold text-gray-950 mt-1">{opt.titulo}</h4>
                                {opt.descripcion && (
                                  <p className="text-xs text-gray-600 mt-1 leading-normal">
                                    {opt.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                              {opt.costoEstimado && (
                                <span className="text-[11px] font-mono text-gray-400">
                                  {opt.costoEstimado}
                                </span>
                              )}

                              {/* Action buttons if not yet approved */}
                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveOption(item.id, opt.id, `${opt.letra}: ${opt.titulo}`)}
                                  className="px-3 py-1.5 rounded-lg bg-gray-950 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
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
                  <div className="p-4 sm:p-5 bg-gray-50/60 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] font-mono text-gray-500 font-semibold">
                      Control de Convalidación Técnica:
                    </span>

                    <div className="flex items-center gap-2">
                      {(['Pendiente', 'Aprobado', 'Requiere cambios'] as DecisionStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleSetStatus(item.id, st)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition border cursor-pointer ${
                            item.estado === st 
                              ? getStatusBadge(st) + ' shadow-xs' 
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
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
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-500 font-bold uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    <span>Registro de Comentarios & Observaciones ({item.comentarios.length})</span>
                  </div>

                  {item.comentarios.length > 0 && (
                    <div className="space-y-2.5 pl-2 border-l-2 border-gray-100">
                      {item.comentarios.map((c) => (
                        <div key={c.id} className="text-xs space-y-0.5">
                          <div className="flex items-center gap-2">
                            <strong className="text-gray-900 font-semibold">{c.autor}</strong>
                            <span className="text-[10px] font-mono text-gray-400">{c.fecha}</span>
                          </div>
                          <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-150 inline-block font-sans max-w-2xl leading-normal">
                            {c.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input for new comment or requesting changes */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Escribir un comentario o aclaración..."
                        value={commentInputs[item.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(item.id);
                        }}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:bg-white focus:outline-hidden focus:border-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(item.id)}
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-mono font-bold transition cursor-pointer"
                      >
                        Enviar
                      </button>
                      
                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => handleRequestChanges(item.id)}
                          className="px-3 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-mono font-bold transition cursor-pointer whitespace-nowrap"
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
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-950 font-sans">
                Crear Solicitud de Decisión o Revisión
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Tipo de Solicitud</label>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setNewType('decision_diseno')}
                    className={`p-2 rounded-lg border font-bold text-left ${
                      newType === 'decision_diseno' 
                        ? 'bg-gray-950 text-white border-gray-950' 
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span>Decisión con Opciones (A / B)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('revision_tecnica')}
                    className={`p-2 rounded-lg border font-bold text-left ${
                      newType === 'revision_tecnica' 
                        ? 'bg-gray-950 text-white border-gray-950' 
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span>Revisión Técnica / Plano</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Título</label>
                <input
                  type="text"
                  required
                  placeholder={newType === 'decision_diseno' ? 'ej: Terminación de cocina' : 'ej: Plano eléctrico — Rev. 02'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-mono text-gray-500 font-bold block mb-1">Descripción / Alcance</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre lo que se somete a convalidación del comitente..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:bg-white"
                />
              </div>

              {/* Options fields if design decision */}
              {newType === 'decision_diseno' && (
                <div className="space-y-3 border-t border-gray-100 pt-3">
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                    Alternativas para el Cliente
                  </span>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                    <span className="text-xs font-mono font-bold text-gray-800">Opción A:</span>
                    <input
                      type="text"
                      placeholder="Título Opción A (ej: Roble natural)"
                      value={optATitle}
                      onChange={(e) => setOptATitle(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Descripción breve Opción A"
                      value={optADesc}
                      onChange={(e) => setOptADesc(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                    <span className="text-xs font-mono font-bold text-gray-800">Opción B:</span>
                    <input
                      type="text"
                      placeholder="Título Opción B (ej: Roble oscuro)"
                      value={optBTitle}
                      onChange={(e) => setOptBTitle(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Descripción breve Opción B"
                      value={optBDesc}
                      onChange={(e) => setOptBDesc(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-950 text-white font-mono font-bold"
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
