// Apply an explicitly reviewed alignment JSON, preserving all other TS source.
// Usage: node scripts/notes/apply.cjs path/to/reviewed.json
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const alignment = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const filename of fs.readdirSync(path.join(root, 'content/weeks')).filter(f => /^week[1-6]b?\.ts$/.test(f))) {
  const file = path.join(root, 'content/weeks', filename);
  let text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  const edits = [];
  function walk(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find(p => ts.isPropertyAssignment(p) && p.name.text === 'id')?.initializer?.text;
      const beats = node.properties.find(p => ts.isPropertyAssignment(p) && p.name.text === 'beats')?.initializer;
      const key = `${filename[4]}/${id}`;
      if (beats && ts.isArrayLiteralExpression(beats) && alignment[key]) {
        if (beats.elements.length !== alignment[key].length) throw Error(`Beat count mismatch: ${key}`);
        beats.elements.forEach((beat, i) => {
          const notes = beat.properties.find(p => ts.isPropertyAssignment(p) && p.name.text === 'notes');
          const refs = alignment[key][i];
          const value = `[${refs.map(id => `'${id}'`).join(', ')}]`;
          if (notes) edits.push({ start: notes.initializer.getStart(source), end: notes.initializer.end, text: value });
          else {
            const at = beat.properties.find(p => ts.isPropertyAssignment(p) && p.name.text === 'at');
            edits.push({ start: at.end, end: at.end, text: `, notes: ${value}` });
          }
        });
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(source);
  for (const edit of edits.sort((a, b) => b.start - a.start)) text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  if (edits.length) fs.writeFileSync(file, text);
}
