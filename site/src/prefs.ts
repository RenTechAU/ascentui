// Small site preferences kept in localStorage: the site theme, the sidebar, the package manager.
// Storage can be blocked (private modes, sandboxed frames), so every read and write is guarded.
import { useCallback, useEffect, useState } from 'react';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not saved; the choice still applies until the page is reloaded.
  }
}

const listeners = new Map<string, Set<(v: string) => void>>();

/** A string preference shared by every component that reads the same key. */
export function usePref<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (v: T) => void] {
  const pick = (v: string | null) => (v != null && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
  const [value, setValue] = useState<T>(() => pick(read(key)));
  useEffect(() => {
    const set = listeners.get(key) ?? new Set();
    const on = (v: string) => setValue(pick(v));
    set.add(on);
    listeners.set(key, set);
    return () => void set.delete(on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (v: T) => {
      write(key, v);
      for (const l of listeners.get(key) ?? []) l(v);
    },
    [key],
  );
  return [value, update];
}

export type SiteTheme = 'dark' | 'light';
export const THEME_KEY = 'asc-site-theme';

/** The site's own light or dark look. Dark is the default; index.html applies a saved choice before paint. */
export function useSiteTheme(): [SiteTheme, (t: SiteTheme) => void] {
  const [theme, setTheme] = usePref<SiteTheme>(THEME_KEY, 'dark', ['dark', 'light']);
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', theme === 'dark');
    html.dataset.site = theme;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0c0c0d' : '#fafafa';
  }, [theme]);
  return [theme, setTheme];
}

export const PMS = ['pnpm', 'npm', 'yarn', 'bun'] as const;
export type Pm = (typeof PMS)[number];
export const usePm = () => usePref<Pm>('asc-site-pm', 'npm', PMS);

/** Copy text to the clipboard, with a fallback for browsers that refuse the async API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Run a shadcn command with the chosen package manager. */
export function shadcn(pm: Pm, args: string): string {
  const run = { pnpm: 'pnpm dlx', npm: 'npx', yarn: 'yarn dlx', bun: 'bunx --bun' }[pm];
  return `${run} shadcn@latest ${args}`;
}
