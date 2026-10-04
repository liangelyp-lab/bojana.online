import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url);
const contract=JSON.parse(readFileSync(new URL('docs/DESIGN_DECISIONS.json',root),'utf8'));
if(contract.completed!==119 || Object.keys(contract.choices).length!==119) throw Error('Se requieren las 119 decisiones completas.');
const choices=contract.choices;
const value=key=>choices[key].value;
const primary=value('color-primary');
const colors=Object.entries(choices).filter(([k])=>k.startsWith('color-') && k!=='color-gradient').map(([k,c])=>`  --color-bojana-${k.slice(6)}: ${k==='color-primary' && !primary.startsWith('oklch(')?`oklch(${primary})`:c.value};`);
const radii=Object.entries(choices).filter(([k])=>k.startsWith('radius-')).map(([k,c])=>`  --radius-bojana-${k.slice(7)}: ${c.value};`);
const result=`/* Generado por npm run design:tokens desde docs/DESIGN_DECISIONS.json. */\n@theme {\n${[...colors,...radii].join('\n')}\n  --radius-bojana-control: var(--radius-bojana-input);\n  --font-sans: ${value('font-ui')};\n  --font-mono: ${value('font-ui')};\n  --font-serif: ${value('font-titles')};\n  --shadow-bojana-base: ${value('shadow-base')};\n  --shadow-bojana-widget: ${value('shadow-widget')};\n  --shadow-bojana-overlay: ${value('shadow-overlay')};\n  --spacing-bojana-block: ${value('space-between')};\n  --spacing-bojana-inside: ${value('space-inside')};\n  --container-bojana-shell: ${value('layout-shell')};\n  --container-bojana-reading: ${value('layout-reading')};\n  --container-bojana-modal: ${value('layout-modal')};\n}\n:root { --bojana-gradient: ${value('color-gradient')}; }\n`;
const path=new URL('src/design/tokens.css',root);
if(process.argv.includes('--check')) { if(readFileSync(path,'utf8')!==result) throw Error('Tokens desactualizados. Ejecutá npm run design:tokens.'); console.log('Las 119 decisiones están completas y los tokens coinciden.'); }
else { writeFileSync(path,result);console.log(fileURLToPath(path)); }
