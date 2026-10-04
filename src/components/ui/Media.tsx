import React, { useLayoutEffect, useRef, useState } from 'react';

/** Pins and editor clicks use the image rectangle, never the letterboxed viewport. */
export function AnnotatedMedia({ src, alt, children, canvasRef, onCanvasClick }: { src: string; alt: string; children: React.ReactNode; canvasRef?: React.RefObject<HTMLDivElement | null>; onCanvasClick?: (event: React.MouseEvent<HTMLDivElement>) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(1.6);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const width = frame.current?.clientWidth || 0;
      const height = frame.current?.clientHeight || 0;
      const imageWidth = Math.min(width, height * ratio);
      setSize({ width: imageWidth, height: imageWidth / ratio });
    };
    const observer = new ResizeObserver(measure);
    if (frame.current) observer.observe(frame.current);
    measure();
    return () => observer.disconnect();
  }, [ratio]);
  return <div ref={frame} className="bojana-annotated-media">
    <div ref={canvasRef} onClick={onCanvasClick} className="relative" style={{ width: size.width || '100%', height: size.height || '100%' }}>
      <img src={src} alt={alt} className="w-full h-full object-contain select-none" onLoad={e => { const img=e.currentTarget; if (img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight); }} />{children}
    </div>
  </div>;
}
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
