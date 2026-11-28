// Load a plain-data TypeScript file (no imports) from a Node script, using the TypeScript
// compiler the repo already has. Keeps site/src/*.ts as the single source for the scripts.
import { readFileSync } from 'node:fs';
import ts from 'typescript';

export async function loadTs(path) {
  const source = readFileSync(path, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
