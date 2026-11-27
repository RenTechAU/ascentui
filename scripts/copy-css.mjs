// Copy every .css file from <src> to <dist>, keeping folders. tsc doesn't copy them.
import { cpSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
const [src, dist] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
for (const f of walk(src).filter((f) => f.endsWith('.css'))) {
  const to = join(dist, f.slice(src.length));
  mkdirSync(dirname(to), { recursive: true });
  cpSync(f, to);
}
