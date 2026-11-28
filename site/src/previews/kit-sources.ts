// Every kit component's source, by file name, read at build time. Used for the manual install
// steps (which files to copy) and the design-system Layers page.
const raw = import.meta.glob('../../../ui/src/components/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const KIT: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([path, code]) => [path.split('/').pop()!, code]),
);

/** The kit files a file imports directly, e.g. button.tsx -> ['spinner.tsx']. */
export const importsOf = (file: string): string[] =>
  [...(KIT[file] ?? '').matchAll(/from\s+["']\.\/([a-z0-9-]+)["']/g)].map((m) => `${m[1]}.tsx`);

/** A file and everything it is built from, in install order (dependencies first). */
export function withDependencies(files: string[]): string[] {
  const out: string[] = [];
  const visit = (f: string) => {
    if (out.includes(f)) return;
    for (const d of importsOf(f)) visit(d);
    out.push(f);
  };
  files.forEach(visit);
  return out;
}
