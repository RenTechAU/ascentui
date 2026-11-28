"use client";
/**
 * Toaster: brief messages that say what just happened, such as "Case archived", with an Undo.
 * Mount <Toaster /> once near the root of the app, then call toast() from anywhere:
 *   toast.success("Case archived", { undo: () => restore(id) })
 *   toast.error("Could not save", { description: "Check your connection and try again." })
 *   toast.promise(save(), { loading: "Saving", success: "Saved", error: "Could not save" })
 * Toasts stack, pause while the pointer or keyboard is on them, close with a button or Escape,
 * and are read out by screen readers (errors straight away, the rest politely).
 * Reads the shared theme (@ascentui/tokens).
 */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Spinner } from "./spinner";

const css = `@layer asc {
.asc-toaster{position:fixed;inset:auto;z-index:2147483000;box-sizing:border-box;display:flex;flex-direction:column;gap:var(--asc-space-8);width:min(392px,100vw);max-height:100dvh;margin:0;padding:var(--asc-space-16);border:0;background:transparent;color:var(--asc-ink);overflow:visible;pointer-events:none;font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-toaster[data-y="bottom"]{bottom:0;padding-bottom:max(var(--asc-space-16),env(safe-area-inset-bottom))}
.asc-toaster[data-y="top"]{top:0;flex-direction:column-reverse;padding-top:max(var(--asc-space-16),env(safe-area-inset-top))}
.asc-toaster[data-x="right"]{right:0}
.asc-toaster[data-x="center"]{left:50%;transform:translateX(-50%)}
.asc-toaster:empty{display:none}
.asc-toaster__list{display:contents;margin:0;padding:0;list-style:none}
.asc-toaster:focus-visible{outline:none}
.asc-toast{--from:var(--asc-space-16);box-sizing:border-box;display:flex;align-items:flex-start;gap:var(--asc-space-8);width:100%;padding:var(--asc-space-12);border-radius:var(--asc-radius-lg);background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-pop);pointer-events:auto;animation:asc-toast-in var(--asc-duration-slow) var(--asc-ease) both}
.asc-toaster[data-y="top"] .asc-toast{--from:calc(var(--asc-space-16) * -1)}
.asc-toast[data-leaving]{animation:asc-toast-out var(--asc-duration-slow) var(--asc-ease) both;pointer-events:none}
.asc-toast:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-toast__icon{display:grid;place-items:center;flex:none;width:20px;height:var(--asc-leading-sm)}
.asc-toast__icon svg{width:16px;height:16px}
.asc-toast[data-tone="success"] .asc-toast__icon{color:var(--asc-success)}
.asc-toast[data-tone="error"] .asc-toast__icon{color:var(--asc-danger)}
.asc-toast[data-tone="info"] .asc-toast__icon{color:var(--asc-info)}
.asc-toast[data-tone="loading"] .asc-toast__icon{color:var(--asc-muted)}
.asc-toast__text{flex:1;min-width:0;padding-top:0;overflow-wrap:anywhere}
.asc-toast__title{margin:0;font-weight:500}
.asc-toast__desc{margin:0;color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-toast__end{display:flex;align-items:center;gap:var(--asc-space-4);flex:none;margin:calc((var(--asc-leading-sm) - var(--asc-control-sm)) / 2) calc(var(--asc-space-4) * -1) 0 0}
.asc-toaster__live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@keyframes asc-toast-in{from{opacity:0;transform:translateY(var(--from)) scale(.98)}}
@keyframes asc-toast-out{to{opacity:0;transform:scale(.96)}}
@media (max-width:480px){.asc-toaster[data-x]{left:0;right:0;width:auto;transform:none;padding-left:var(--asc-space-12);padding-right:var(--asc-space-12)}}
}`;

// ---------------------------------------------------------------- the store

export type ToastTone = "neutral" | "success" | "error" | "info" | "loading";

export type ToastAction = {
  /** One or two words, e.g. "Undo", "View", "Retry" */
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  /** Give the same id to replace a toast in place, e.g. to turn "Saving" into "Saved" */
  id?: string;
  /** A second line with more detail, or what to do next */
  description?: ReactNode;
  /** Reverses what just happened. Adds an "Undo" button and keeps the toast up longer */
  undo?: () => void;
  /** One other action instead of Undo, e.g. { label: "View", onClick } */
  action?: ToastAction;
  /** Milliseconds before it closes on its own. Infinity keeps it until it is dismissed */
  duration?: number;
  /** Called when the toast closes, however it closes */
  onDismiss?: () => void;
};

export type ToastItem = ToastOptions & { id: string; tone: ToastTone; title: ReactNode; leaving?: boolean; version: number };

/** How long each kind stays up, in milliseconds. Errors stay until dismissed, so nobody misses one */
export const TOAST_DURATION = { normal: 5000, withAction: 8000, error: Infinity } as const;

let items: ToastItem[] = [];
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => items;
const empty: ToastItem[] = [];

function show(tone: ToastTone, title: ReactNode, opts: ToastOptions = {}): string {
  const id = opts.id ?? `asc-toast-${++counter}`;
  const at = items.findIndex((t) => t.id === id);
  const next: ToastItem = { ...opts, id, tone, title, version: (at >= 0 ? items[at]!.version : 0) + 1 };
  items = at >= 0 ? items.map((t, i) => (i === at ? next : t)) : [...items, next];
  emit();
  return id;
}

function dismiss(id?: string) {
  items = items.map((t) => (id == null || t.id === id ? { ...t, leaving: true } : t));
  emit();
}

function remove(id: string) {
  const gone = items.find((t) => t.id === id);
  items = items.filter((t) => t.id !== id);
  emit();
  gone?.onDismiss?.();
}

type Message<V> = ReactNode | ((value: V) => ReactNode);
const say = <V,>(m: Message<V>, v: V) => (typeof m === "function" ? (m as (v: V) => ReactNode)(v) : m);

/** Show a toast. Returns its id, for toast.dismiss(id) or to replace it later */
export const toast = Object.assign((title: ReactNode, opts?: ToastOptions) => show("neutral", title, opts), {
  /** Something worked: saved, sent, archived */
  success: (title: ReactNode, opts?: ToastOptions) => show("success", title, opts),
  /** Something failed. Read out straight away, and stays until dismissed */
  error: (title: ReactNode, opts?: ToastOptions) => show("error", title, opts),
  /** Neutral news, e.g. "Sync finished" */
  info: (title: ReactNode, opts?: ToastOptions) => show("info", title, opts),
  /** Work in progress, with a spinner. It stays until you replace or dismiss it */
  loading: (title: ReactNode, opts?: ToastOptions) => show("loading", title, { duration: Infinity, ...opts }),
  /** Close one toast by id, or all of them */
  dismiss,
  /** Shows "loading" while the promise runs, then success or error in the same toast. Returns the promise */
  promise<V>(
    promise: Promise<V>,
    msg: { loading: ReactNode; success: Message<V>; error: Message<unknown> } & Omit<ToastOptions, "id">,
  ): Promise<V> {
    const { loading, success, error, ...opts } = msg;
    const id = show("loading", loading, { ...opts, duration: Infinity, undo: undefined, action: undefined });
    promise.then(
      (v) => show("success", say(success, v), { ...opts, id }),
      (e) => show("error", say(error, e), { ...opts, id, undo: undefined }),
    );
    return promise;
  },
});

/** The same toast function, for code that prefers a hook */
export const useToast = () => toast;

// ---------------------------------------------------------------- the view

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const ICONS: Partial<Record<ToastTone, ReactNode>> = {
  success: <Icon d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM5.25 8.25l1.9 1.9 3.6-3.9" />,
  error: <Icon d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 4.75v3.75M8 10.9v.1" />,
  info: <Icon d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 7.25v4M8 4.9v.1" />,
  loading: <Spinner size="sm" />,
};
const Close = () => <Icon d="M4.5 4.5l7 7M11.5 4.5l-7 7" />;

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Toast({ t, paused, announce }: { t: ToastItem; paused: boolean; announce: (text: string, urgent: boolean) => void }) {
  const el = useRef<HTMLLIElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const action: ToastAction | undefined = t.undo ? { label: "Undo", onClick: t.undo } : t.action;
  const duration =
    t.duration ?? (t.tone === "error" ? TOAST_DURATION.error : action ? TOAST_DURATION.withAction : TOAST_DURATION.normal);

  // Read it out each time it is shown or replaced (e.g. "Saving" becomes "Saved")
  useEffect(() => {
    const words = text.current?.textContent?.trim();
    if (words) announce(action ? `${words}. ${action.label} is available, press Alt+T to reach it.` : words, t.tone === "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.version]);

  // Close on its own after `duration`, counting only the time it is not paused
  const left = useRef(duration);
  useEffect(() => {
    left.current = duration;
  }, [duration, t.version]);
  useEffect(() => {
    if (paused || t.leaving || !Number.isFinite(left.current)) return;
    const start = Date.now();
    const timer = setTimeout(() => dismiss(t.id), left.current);
    return () => {
      clearTimeout(timer);
      left.current -= Date.now() - start;
    };
  }, [paused, t.leaving, t.id, t.version, duration]);

  // Leave with the exit motion, then go. Straight away when the device asks for less motion
  useEffect(() => {
    if (!t.leaving) return;
    if (reducedMotion()) return remove(t.id);
    const fallback = setTimeout(() => remove(t.id), 600);
    return () => clearTimeout(fallback);
  }, [t.leaving, t.id]);

  return (
    <li
      ref={el}
      className="asc-toast"
      data-id={t.id}
      data-tone={t.tone}
      data-leaving={t.leaving || undefined}
      tabIndex={-1}
      onAnimationEnd={(e) => e.target === el.current && t.leaving && remove(t.id)}
    >
      {ICONS[t.tone] && <span className="asc-toast__icon">{ICONS[t.tone]}</span>}
      <div className="asc-toast__text" ref={text}>
        <p className="asc-toast__title">{t.title}</p>
        {t.description != null && <p className="asc-toast__desc">{t.description}</p>}
      </div>
      <div className="asc-toast__end">
        {action && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              action.onClick();
              dismiss(t.id);
            }}
          >
            {action.label}
          </Button>
        )}
        <IconButton size="sm" icon={<Close />} label="Dismiss" tooltip={false} onClick={() => dismiss(t.id)} />
      </div>
    </li>
  );
}

export type ToasterProps = {
  /** Where toasts appear on a desk. On phones they always span the bottom of the screen */
  position?: "bottom-right" | "bottom-center" | "top-right" | "top-center";
  /** How many show at once. When another arrives the oldest closes */
  max?: number;
  /** Name of the region for screen readers */
  label?: string;
  className?: string;
};

export function Toaster({ position = "bottom-right", max = 3, label = "Notifications", className }: ToasterProps) {
  const all = useSyncExternalStore(subscribe, snapshot, () => empty);
  const region = useRef<HTMLElement>(null);
  const polite = useRef<HTMLDivElement>(null);
  const urgent = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [y, x] = position.split("-") as ["top" | "bottom", "right" | "center"];

  // Over the limit: the oldest close, so the newest is always in view
  const live = all.filter((t) => !t.leaving);
  useEffect(() => {
    if (live.length > max) live.slice(0, live.length - max).forEach((t) => dismiss(t.id));
  }, [live, max]);

  // Sit above everything, dialogs included: the browser's top layer. A dialog opened later sits
  // above it, so it is raised again when a toast arrives while a dialog is open
  const newest = all[all.length - 1];
  useLayoutEffect(() => {
    const el = region.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      const open = el.matches(":popover-open");
      if (!all.length) return void (open && el.hidePopover());
      if (open && document.querySelector("dialog:modal")) el.hidePopover();
      if (!el.matches(":popover-open")) el.showPopover();
    } catch {
      /* not in the page yet, or popovers unsupported: it still shows, as a fixed layer */
    }
  }, [newest?.id, newest?.version, all.length]);

  // Alt+T moves focus to the newest toast, so keyboard users can reach Undo. Escape closes the newest
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const items = region.current?.querySelectorAll<HTMLElement>(".asc-toast:not([data-leaving])");
      if (!items?.length) return;
      if (e.altKey && e.code === "KeyT") {
        e.preventDefault();
        const last = items[items.length - 1]!;
        (last.querySelector<HTMLElement>("button") ?? last).focus();
        return;
      }
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const inside = !!region.current?.contains(document.activeElement);
      // Outside the toaster, Escape belongs to whatever has focus first: a dialog, an open list or a field
      const busy =
        document.querySelector("dialog:modal, [role='combobox'][aria-expanded='true'], [role='menu']") ||
        (e.target as HTMLElement).closest?.("input, textarea, select, [contenteditable='true']");
      if (!inside && busy) return;
      const pick = (inside && (document.activeElement?.closest(".asc-toast") as HTMLElement | null)) || items[items.length - 1]!;
      const id = pick.dataset.id;
      if (!id) return;
      e.preventDefault();
      dismiss(id);
      if (inside) {
        // Keep focus in the toaster, on the next toast, or let it go back to the page
        const rest = [...items].filter((n) => n !== pick);
        const next = rest[rest.length - 1];
        if (next) (next.querySelector<HTMLElement>("button") ?? next).focus();
        else (document.activeElement as HTMLElement | null)?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Live regions stay in the page and only their text changes: the most reliable way to be read out
  const announce = (text: string, isUrgent: boolean) => {
    const target = (isUrgent ? urgent : polite).current;
    if (!target) return;
    target.textContent = "";
    setTimeout(() => {
      target.textContent = text;
    }, 50);
  };

  return (
    <>
      <style href="asc-toaster" precedence="asc">{css}</style>
      <div className="asc-toaster__live" role="status" aria-live="polite" aria-atomic="true" ref={polite} />
      <div className="asc-toaster__live" role="alert" aria-live="assertive" aria-atomic="true" ref={urgent} />
      <section
        ref={region}
        popover="manual"
        aria-label={`${label} (Alt+T)`}
        tabIndex={-1}
        className={["asc-toaster", className].filter(Boolean).join(" ")}
        data-x={x}
        data-y={y}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
      >
        {all.length > 0 && (
          <ol className="asc-toaster__list">
            {all.map((t) => (
              <Toast key={t.id} t={t} paused={hovered || focused} announce={announce} />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
