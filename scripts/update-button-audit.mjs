import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const storyPath = 'src/components/ui/ButtonAudit.stories.tsx';
const story = fs.readFileSync(storyPath, 'utf8');
const recordsText = story.split('const instances: readonly AuditInstance[] = [')[1].split('];')[0];
const previous = JSON.parse(`[${recordsText.replace(/,\s*$/, '')}]`);
const clean = (text) => text.replace(/\\([{}\x60])/g, '$1').replace(/\s+/g, ' ').trim();
const used = new Set();
const records = [];
function visitDirectory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { visitDirectory(file); continue; }
    if (!file.endsWith('.tsx') || file.includes('.stories.') || file === 'src/components/ui/DesignSystem.tsx') continue;
    const source = fs.readFileSync(file, 'utf8');
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function walk(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === 'button') {
        const opening = clean(node.openingElement.getText(tree));
        const line = tree.getLineAndCharacterOfPosition(node.openingElement.getStart(tree)).line + 1;
        const snippet = clean(node.getText(tree)).slice(0, 240);
        const candidates = previous.filter(item => item.id.startsWith(`${file}:`) && !used.has(item.id) && clean(item.snippet).includes(opening.slice(0, Math.min(opening.length, 55))));
        candidates.sort((a, b) => Math.abs(a.line - line) - Math.abs(b.line - line));
        const old = candidates[0];
        if (old) used.add(old.id);
        const text = node.children.map(child => ts.isJsxText(child) ? child.text.trim() : '').filter(Boolean).join(' ');
        const aria = opening.match(/aria-label="([^"]+)"/)?.[1];
        const label = aria || text || 'Dynamic action';
        let kind = old?.kind || 'Native / custom';
        let variant = old?.variant || 'secondary';
        records.push({ id: old?.id || `${file}:${line}:${node.getStart(tree)}`, file: file.replace(/^src\//, ''), line, kind, variant, snippet, label });
      }
      ts.forEachChild(node, walk);
    }
    walk(tree);
  }
}
visitDirectory('src');
records.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.id.localeCompare(b.id));
const updated = story.replace(/const instances: readonly AuditInstance\[\] = \[[\s\S]*?\];/, `const instances: readonly AuditInstance[] = [\n${records.map(item => `  ${JSON.stringify(item)},`).join('\n')}\n];`);
fs.writeFileSync(storyPath, updated);
console.log(`Updated audit: ${records.length} native button instances.`);
