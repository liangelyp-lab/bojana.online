import { useRef, useState } from 'react';
export function MediaComparison({ items }: { items: { id: string; title: string; src: string; caption?: string }[] }) {
  const [zoom, setZoom] = useState(1);
  const views = useRef<(HTMLDivElement|null)[]>([]);
  const syncing = useRef(false);
  if (items.length < 2) return null;
  return <section className="space-y-2" aria-label="Comparar alternativas">
    <label className="block"><span className="bojana-label">Zoom compartido · {Math.round(zoom * 100)}%</span><input type="range" min={1} max={3} step={.25} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full" /></label>
    <div className="bojana-comparison">{items.map((item,i) => <figure key={item.id}>
      <figcaption className="text-xs mb-2">{item.title}{item.caption && ` · ${item.caption}`}</figcaption>
      <div ref={el => { views.current[i]=el; }} className="bojana-comparison-viewport" onScroll={e => {
        if (syncing.current) return;
        syncing.current=true; const source=e.currentTarget;
        const x=source.scrollLeft / Math.max(1, source.scrollWidth-source.clientWidth);
        const y=source.scrollTop / Math.max(1, source.scrollHeight-source.clientHeight);
        views.current.forEach(view=>{ if (view && view!==source) { view.scrollLeft=x*(view.scrollWidth-view.clientWidth); view.scrollTop=y*(view.scrollHeight-view.clientHeight); } });
        requestAnimationFrame(()=>{ syncing.current=false; });
      }}><div style={{ width:`${zoom*100}%`,height:`${zoom*100}%` }}><img src={item.src} alt={item.title} style={{width:'100%',height:'100%',objectFit:'contain'}} /></div></div>
    </figure>)}</div>
  </section>;
}
