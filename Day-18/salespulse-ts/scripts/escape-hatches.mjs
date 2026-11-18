// Counts the places where TypeScript's checking is switched off or overridden, by reading the real syntax tree
// (not by searching for the word "any"): `any`, type assertions (`x as T`, `<T>x`), non-null assertions (`x!`),
// and the `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` comments. `as const` is not counted: it narrows, it does not override.
//
//   npm run escapes              count in src/ (the app)
//   npm run escapes -- test      count in test/ as well
//
// Exits with an error if the app has any `any` or any @ts- comment, so the claim "no any" is checked, not remembered.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const roots = process.argv.includes('test') ? ['src', 'test'] : ['src'];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts') ? [path] : [];
  });
}

const found = { any: [], assertion: [], nonNull: [], tsComment: [] };

for (const root of roots) {
  for (const file of files(root)) {
    const text = readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const where = (node) => `${relative('.', file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    const visit = (node) => {
      if (node.kind === ts.SyntaxKind.AnyKeyword) found.any.push(where(node));
      else if (ts.isNonNullExpression(node)) found.nonNull.push(where(node));
      else if (ts.isTypeAssertionExpression(node)) found.assertion.push(`${where(node)}  <${node.type.getText()}>`);
      else if (ts.isAsExpression(node)) {
        const target = node.type.getText();
        if (target !== 'const') found.assertion.push(`${where(node)}  as ${target}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    text.split('\n').forEach((line, i) => {
      if (/@ts-(ignore|expect-error|nocheck)/.test(line)) found.tsComment.push(`${relative('.', file)}:${i + 1}`);
    });
  }
}

const scope = roots.join(' + ');
console.log(`Escape hatches in ${scope}:`);
console.log(`  any                    ${found.any.length}`);
console.log(`  type assertions (as T) ${found.assertion.length}`);
console.log(`  non-null assertions (!) ${found.nonNull.length}`);
console.log(`  @ts-ignore / expect-error / nocheck ${found.tsComment.length}`);
for (const [label, list] of [['type assertions', found.assertion], ['non-null assertions', found.nonNull], ['any', found.any], ['@ts- comments', found.tsComment]]) {
  if (list.length) console.log(`\n${label}:\n${list.map((x) => `  ${x}`).join('\n')}`);
}
if (found.any.length || (roots.length === 1 && found.tsComment.length)) process.exit(1);
