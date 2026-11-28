import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    // `?proimports` gives only a Pro file's import lines, so the public site can list what a Pro
    // component builds on without its source ever entering the bundle.
    {
      name: 'ascentui-pro-imports',
      enforce: 'pre',
      async load(id) {
        if (!id.endsWith('?proimports')) return null;
        const code = await readFile(id.slice(0, -'?proimports'.length), 'utf8');
        // Whole import statements, including ones that run over several lines
        const lines = (code.match(/^import\b[^;]*?\bfrom\s+['"][^'"]+['"];?/gm) ?? []).join('\n');
        return `export default ${JSON.stringify(lines)};`;
      },
    },
  ],
  resolve: {
    alias: {
      '@ascentui/ui/components': fileURLToPath(new URL('../ui/src/components', import.meta.url)),
      '@kit': fileURLToPath(new URL('../ui/src/components', import.meta.url)),
      '@pro': fileURLToPath(new URL('../pro/src/components', import.meta.url)),
      '@tokens': fileURLToPath(new URL('../tokens/src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
