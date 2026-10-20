import { useEffect, useMemo, useRef, useState } from "react";
import { calculateNeedProgress, type ProjectData } from "../../types";
import { getProgressFocusTaskId, getProjectStatusLabel } from "../../services/storageService";
import { StatusBadge, StatusBar, type StatusBarSegment, type StatusBarTaskStatusCounts } from "../ui/DesignSystem";

export default function ProjectProgressBar({ project, value }: { project: ProjectData; value: number }) {
  const [granular, setGranular] = useState(false);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const appliedFocusTaskId = useRef<string | null>(null);
  const segments = useMemo<StatusBarSegment[]>(() => {
    const disciplines = (project.disciplinasOperativas || []).map(discipline => ({
      ...discipline,
      necesidades: (discipline.necesidades || []).filter(need => (need.tareas || []).some(task => task.estado !== "Fuera de alcance")),
    })).filter(discipline => discipline.necesidades.length > 0);
    const needs = disciplines.flatMap(discipline => discipline.necesidades.map(need => ({ discipline, need })));
    const totalNeedWeight = needs.reduce((sum, { need }) => sum + (need.pesoPorcentaje || 0), 0);
    return needs.map(({ discipline, need }) => ({
        id: `${discipline.id}-${need.id}`,
        label: need.nombre,
        // Segment widths follow the exact phase weights configured in the editor.
        weight: totalNeedWeight > 0 ? (need.pesoPorcentaje || 0) / totalNeedWeight * 100 : 100 / needs.length,
        progress: calculateNeedProgress({ ...need, publishedProgress: undefined }),
        taskCount: (need.tareas || []).filter(task => task.estado !== "Fuera de alcance").length,
        completedTaskCount: (need.tareas || []).filter(task => task.estado === "Completada").length,
      })).filter(segment => segment.weight > 0);
  }, [project.disciplinasOperativas]);
  const showGranular = granular && segments.length > 0;
  const taskStatusCounts = useMemo<StatusBarTaskStatusCounts>(() => {
    const stateMap = { Pendiente: 'pending', 'En curso': 'in-progress', 'En revisión': 'review', 'Esperando al cliente': 'waiting', 'Requiere ajustes': 'adjustments', Completado: 'completed', Pausada: 'paused', 'Fuera de alcance': 'out-of-scope' } as const;
    return (project.disciplinasOperativas || []).flatMap(discipline => discipline.necesidades.flatMap(need => need.tareas || [])).reduce<StatusBarTaskStatusCounts>((counts, task) => {
      const state = stateMap[task.estado];
      if (state) counts[state] = (counts[state] || 0) + 1;
      return counts;
    }, {});
  }, [project.disciplinasOperativas]);
  const focusTaskId = getProgressFocusTaskId(project);
  const focusSegmentId = useMemo(() => {
    if (!focusTaskId) return null;
    for (const discipline of project.disciplinasOperativas || []) {
      const need = (discipline.necesidades || []).find(item => (item.tareas || []).some(task => task.id === focusTaskId));
      if (need) return `${discipline.id}-${need.id}`;
    }
    return null;
  }, [focusTaskId, project.disciplinasOperativas]);
  useEffect(() => {
    if (!focusTaskId || !focusSegmentId || appliedFocusTaskId.current === focusTaskId) return;
    appliedFocusTaskId.current = focusTaskId;
    setGranular(true);
    setExpandedSegment(focusSegmentId);
    setHoveredSegment(focusSegmentId);
  }, [focusSegmentId, focusTaskId]);
  const status = getProjectStatusLabel(project);
  const statusTone = status === "Completado" ? "active" : status === "Revisión" ? "waiting" : status === "En progreso" ? "info" : "gray";

  return <StatusBar value={value} size="s" mode={showGranular ? "granular" : "completo"} phaseCount={segments.length} taskCount={segments.reduce((total, segment) => total + (segment.taskCount || 0), 0)} completedTaskCount={segments.reduce((total, segment) => total + (segment.completedTaskCount || 0), 0)} taskStatusCounts={taskStatusCounts} segments={segments} activeSegment={hoveredSegment} expandedSegment={expandedSegment} onSegmentHover={setHoveredSegment} onSegmentClick={id => setExpandedSegment(current => current === id ? null : id)} ariaLabel="Progreso del proyecto" projectStatus={<StatusBadge tone={statusTone} size="s">{status}</StatusBadge>} onModeChange={next => { setGranular(next === "granular"); setExpandedSegment(null); setHoveredSegment(null); }} />;
}
