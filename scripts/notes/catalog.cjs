// Read-only TS AST catalog; does not evaluate course modules or import scenes.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function value(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(value);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.text, value(p.initializer)]));
  return node.getText();
}
const stages = [];
for (const filename of fs.readdirSync(path.join(root, 'content/weeks')).filter(f => /^week[1-6]b?\.ts$/.test(f))) {
  const source = ts.createSourceFile(filename, fs.readFileSync(path.join(root, 'content/weeks', filename), 'utf8'), ts.ScriptTarget.Latest, true);
  function walk(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const obj = value(node);
      if (obj.id && obj.beats) stages.push({ week: Number(filename[4]), file: filename, ...obj });
    }
    ts.forEachChild(node, walk);
  }
  walk(source);
}
const source = ts.createSourceFile('notes.ts', fs.readFileSync(path.join(root, 'content/notes.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
let sections;
function walkSections(node) {
  if (ts.isVariableDeclaration(node) && node.name.text === 'NOTES') sections = value(node.initializer);
  ts.forEachChild(node, walkSections);
}
walkSections(source);
process.stdout.write(JSON.stringify({ stages, sections }));
