// A small copy button for the site: copies text, shows a tick, and tells screen readers.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { copyText } from '../prefs';

const Icon = ({ done }: { done: boolean }) => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={done ? 'M5 12.5l4.5 4.5L19 7.5' : 'M9 9h10v10H9zM5 15V5h10'} />
  </svg>
);

export function CopyButton({
  text,
  label,
  children,
  className = 'copy-btn',
  title,
  'aria-describedby': describedBy,
}: {
  /** What goes on the clipboard; a function is called at the moment of copying */
  text: string | (() => string);
  /** The accessible name, e.g. "Copy install command for Button" */
  label: string;
  /** Visible words; leave out for an icon-only button */
  children?: ReactNode;
  className?: string;
  title?: string;
  'aria-describedby'?: string;
}) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    const ok = await copyText(typeof text === 'function' ? text() : text);
    setState(ok ? 'done' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1800);
  };
  return (
    <>
    <button type="button" aria-describedby={describedBy} className={className} aria-label={children ? undefined : label} title={title ?? (children ? undefined : label)} onClick={copy} data-state={state}>
      <Icon done={state === 'done'} />
      {children && <span>{state === 'done' ? 'Copied' : children}</span>}
    </button>
    <span className="vh" role="status">{state === 'done' ? 'Copied' : state === 'failed' ? 'Could not copy. Select the text and copy it instead.' : ''}</span>
    </>
  );
}
