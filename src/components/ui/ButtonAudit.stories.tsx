import React, { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './DesignSystem';
const meta = { title: 'Bojana/Audits/Button audit', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
type AuditInstance = { id: string; file: string; line: number; kind: string; variant: string; snippet: string; label: string };
const instances: readonly AuditInstance[] = [

];
const options = ['Button', 'Icon Button', 'Tertiary', 'Link / Action', 'Keep native'] as const;
const defaultReplacement = (kind: string) => kind.includes('Icon') ? 'Icon Button' : kind.includes('Tertiary') ? 'Tertiary' : kind.includes('Native') ? 'Keep native' : 'Button';
export const AllNativeButtonInstances: Story = {
  render: () => {
    const [selections, setSelections] = useState<Record<string, string>>(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem('bojana.buttonAudit.selections') || '{}');
        return Object.fromEntries(instances.map(item => {
          const legacyId = item.id.split(':').slice(0, 2).join(':');
          const uniqueLine = instances.filter(other => other.file === item.file && other.line === item.line).length === 1;
          return [item.id, saved[item.id] || (uniqueLine ? saved[legacyId] : undefined) || defaultReplacement(item.kind)];
        }));
      } catch { return Object.fromEntries(instances.map(item => [item.id, defaultReplacement(item.kind)])); }
    });
    const [shownId, setShownId] = useState<string | null>(null);
    const [appliedCount, setAppliedCount] = useState(0);
    const updateSelection = (id: string, value: string) => setSelections(prev => {
      const next = { ...prev, [id]: value };
      window.localStorage.setItem('bojana.buttonAudit.selections', JSON.stringify(next));
      return next;
    });
    const grouped = useMemo(() => instances.reduce<Record<string, AuditInstance[]>>((acc, item) => { (acc[item.file] ||= []).push(item); return acc; }, {}), []);
    return <div className="max-w-6xl space-y-8"><header className="space-y-2"><h1 className="text-xl font-semibold text-ink">Button audit</h1><p className="text-sm text-ink-muted">Only native buttons currently present in the source are listed. The preview is illustrative; check the source for the exact appearance. Choices are saved in this browser and are not applied automatically.</p><div className="flex flex-wrap items-center gap-3"><p className="text-xs text-ink-faint">{instances.length} native instances · {instances.filter(item => selections[item.id]).length} choices shown.</p><Button size="s" disabled={instances.length === 0} onClick={() => setAppliedCount(instances.filter(item => selections[item.id]).length)}>Confirm selections</Button>{appliedCount > 0 && <span className="text-xs font-semibold text-forest">{appliedCount} selections ready for implementation.</span>}</div>{shownId && <p className="rounded-lg bg-stone px-3 py-2 text-xs font-semibold text-forest">Selected instance: {shownId}. Switch to the portal tab to locate it.</p>}</header>{instances.length === 0 && <p className="rounded-lg bg-stone px-4 py-3 text-sm text-ink-muted">No native button instances found in the portal.</p>}{Object.entries(grouped).map(([file, rows]) => <section key={file} className="space-y-3 border-b border-line pb-6"><h2 className="font-semibold text-ink">{file}</h2><div className="overflow-hidden rounded-xl border border-line">{rows.map(item => <div key={item.id} className={`grid gap-4 border-b border-line px-4 py-4 last:border-0 lg:grid-cols-[minmax(0,1fr)_150px_170px_190px] ${shownId === item.id ? 'bg-stone' : ''}`}><div className="min-w-0"><div className="text-sm font-semibold text-ink">{item.label} <span className="ml-2 text-xs font-normal text-ink-faint">line {item.line}</span></div><code className="mt-1 block break-words text-[11px] leading-4 text-ink-muted">{item.snippet}</code></div><div className="flex items-center gap-2"><Button variant={item.variant as any} ariaLabel={item.label}>{item.variant === 'icon' ? '×' : item.label}</Button><Button variant="tertiary" size="s" onClick={() => setShownId(item.id)}>Mostrar</Button></div><fieldset className="space-y-1 text-xs text-ink-muted"><legend className="mb-1 font-semibold text-ink">Replacement</legend>{options.map(option => <label key={option} className="flex items-center gap-2"><input type="radio" name={`replacement-${item.id}`} value={option} checked={selections[item.id] === option} onChange={() => updateSelection(item.id, option)} />{option}</label>)}</fieldset></div>)}</div></section>)}</div>;
  },
};
