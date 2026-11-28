"use client";
/**
 * Dialog and Drawer: a focused task on top of the page. Dialog sits in the middle; Drawer is a
 * side panel from the right, full screen on phones, for a record or a long form.
 * Built on the browser's own <dialog> opened with showModal(), so it sits above everything, the
 * page behind can't be clicked or tabbed to, Escape closes it, and focus goes back to the button
 * that opened it. The page behind stops scrolling while it is open.
 * ConfirmDialog and useConfirm ask "are you sure?" before something that can't be undone.
 * Reads the shared theme (@ascentui/tokens).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject, type SyntheticEvent } from "react";
import { Button } from "./button";
import { IconButton } from "./icon-button";

const css = `@layer asc {
:root[data-asc-scroll-lock]{overflow:hidden;padding-right:var(--asc-lock-gap,0px)}
.asc-dlg{--w:520px;box-sizing:border-box;width:min(var(--w),calc(100% - var(--asc-space-24)));max-width:none;max-height:calc(100dvh - var(--asc-space-24) * 2);margin:auto;padding:0;border:0;border-radius:var(--asc-radius-lg);background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-pop);overflow:hidden;font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font);text-align:start;overscroll-behavior:contain}
.asc-dlg:not([open]){display:none}
.asc-dlg[data-size="sm"]{--w:400px}
.asc-dlg[data-size="lg"]{--w:720px}
.asc-dlg::backdrop{background:var(--asc-backdrop)}
.asc-dlg[open]{animation:asc-dlg-in var(--asc-duration-slow) var(--asc-ease) both}
.asc-dlg[open]::backdrop{animation:asc-dlg-fade var(--asc-duration-slow) var(--asc-ease) both}
.asc-dlg[data-closing]{animation:asc-dlg-out var(--asc-duration) var(--asc-ease) both}
.asc-dlg[data-closing]::backdrop{animation:asc-dlg-fade var(--asc-duration) var(--asc-ease) reverse both}
.asc-dlg[data-kind="drawer"]{--w:480px;inset:0 0 0 auto;width:min(var(--w),100%);height:100dvh;max-height:none;margin:0;border-radius:var(--asc-radius-lg) 0 0 var(--asc-radius-lg)}
.asc-dlg[data-kind="drawer"][data-size="sm"]{--w:380px}
.asc-dlg[data-kind="drawer"][data-size="lg"]{--w:640px}
.asc-dlg[data-kind="drawer"][open]{animation-name:asc-drawer-in}
.asc-dlg[data-kind="drawer"][data-closing]{animation-name:asc-drawer-out}
.asc-dlg__panel{position:relative;display:flex;flex-direction:column;box-sizing:border-box;max-height:inherit;height:100%}
.asc-dlg:focus-visible{outline:none}
.asc-dlg__head{display:flex;flex-direction:column;gap:var(--asc-space-2);padding:var(--asc-space-16) calc(var(--asc-space-16) + var(--asc-control-sm) + var(--asc-space-8)) var(--asc-space-12) var(--asc-space-16)}
.asc-dlg__title{margin:0;font:500 var(--asc-text-md)/var(--asc-leading-md) var(--asc-font)}
.asc-dlg__title:focus-visible{outline:none}
.asc-dlg__desc{margin:0;color:var(--asc-muted)}
.asc-dlg__body{flex:1;min-height:0;overflow-y:auto;padding:0 var(--asc-space-16) var(--asc-space-16)}
.asc-dlg__body:empty{display:none}
.asc-dlg__foot{display:flex;flex-wrap:wrap-reverse;align-items:center;justify-content:flex-end;gap:var(--asc-space-8);padding:var(--asc-space-12) var(--asc-space-16);border-top:1px solid var(--asc-border);background:var(--asc-subtle)}
.asc-dlg .asc-dlg__close{position:absolute;top:calc(var(--asc-space-16) + (var(--asc-leading-md) - var(--asc-control-sm)) / 2);right:var(--asc-space-12)}
.asc-dlg[data-kind="drawer"] .asc-dlg__head{border-bottom:1px solid var(--asc-border);padding-bottom:var(--asc-space-12);margin-bottom:var(--asc-space-16)}
.asc-dlg[data-kind="drawer"] .asc-dlg__foot{padding-bottom:max(var(--asc-space-12),env(safe-area-inset-bottom))}
@keyframes asc-dlg-in{from{opacity:0;transform:translateY(var(--asc-space-8)) scale(.98)}}
@keyframes asc-dlg-out{to{opacity:0;transform:scale(.98)}}
@keyframes asc-dlg-fade{from{opacity:0}}
@keyframes asc-drawer-in{from{transform:translateX(100%)}}
@keyframes asc-drawer-out{to{transform:translateX(100%)}}
@media (max-width:640px){
  .asc-dlg[data-kind="drawer"]{width:100%;border-radius:0}
  .asc-dlg__foot>*{flex:1 1 auto}
}
}`;

// ---------------------------------------------------------------- page scroll lock

let locks = 0;
function lockScroll() {
  const html = document.documentElement;
  if (locks++ === 0) {
    // Keep the page from shifting sideways when its scrollbar goes away
    html.style.setProperty("--asc-lock-gap", `${Math.max(0, innerWidth - html.clientWidth)}px`);
    html.setAttribute("data-asc-scroll-lock", "");
  }
}
function unlockScroll() {
  if (--locks > 0) return;
  locks = 0;
  const html = document.documentElement;
  html.removeAttribute("data-asc-scroll-lock");
  html.style.removeProperty("--asc-lock-gap");
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const Close = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </svg>
);

// ---------------------------------------------------------------- Dialog

export type DialogProps = {
  /** Whether it is open. You own this state */
  open: boolean;
  /** Called with false when it asks to close: Escape, the close button, a click outside */
  onOpenChange: (open: boolean) => void;
  /** What this is about, in a few words. Read out when it opens */
  title: ReactNode;
  /** One line under the title. Read out with it */
  description?: ReactNode;
  /** The body. It scrolls on its own when it is taller than the screen; the title and footer stay put */
  children?: ReactNode;
  /** Buttons along the bottom, right-aligned. Put the main action last */
  footer?: ReactNode;
  /** Dialog: 400, 520 or 720px wide. Drawer: 380, 480 or 640px. Both fit small screens */
  size?: "sm" | "md" | "lg";
  /** Escape and a click outside close it. Turn off while saving, or for a choice that must be made */
  dismissible?: boolean;
  /** Hide the × button. Then give people another way to close it in the footer */
  hideClose?: boolean;
  /** What gets focus when it opens. By default the first field or button inside */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Called once it has finished closing, after the exit motion */
  onClosed?: () => void;
  /** dialog in the middle, or a drawer from the right. Drawer sets this for you */
  kind?: "dialog" | "drawer";
  /** alertdialog for a question that interrupts, such as a confirm. ConfirmDialog sets this */
  role?: "dialog" | "alertdialog";
  /** The words on the × button, for screen readers */
  closeLabel?: string;
  /** Content at the very top of the panel, above the title, such as a bottom sheet's drag handle */
  before?: ReactNode;
  className?: string;
};

export function Dialog({
  open, onOpenChange, title, description, children, footer, size = "md", dismissible = true, hideClose = false,
  initialFocus, onClosed, kind = "dialog", role, closeLabel = "Close", before, className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const downOnBackdrop = useRef(false);
  const [mounted, setMounted] = useState(open);
  const id = useId();
  const ask = useRef(onOpenChange);
  ask.current = onOpenChange;
  const wanted = useRef(open);
  wanted.current = open;
  const locked = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  if (open && !mounted) setMounted(true);

  // Open: into the top layer, page locked. Close: play the exit, then close for real
  useLayoutEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dlg.removeAttribute("data-closing");
      dlg.showModal();
      if (!locked.current) lockScroll();
      locked.current = true;
      // A drawer shows a record: start on its title, so a phone does not open its keyboard for the first field
      if (initialFocus?.current) initialFocus.current.focus();
      else if (kind === "drawer") titleRef.current?.focus();
      // Tells the Toaster, so toasts stay usable above the dialog
      document.dispatchEvent(new Event("asc:layer"));
    } else if (open && dlg.hasAttribute("data-closing")) {
      // Opened again during the exit motion
      dlg.removeAttribute("data-closing");
    } else if (!open && dlg.open && !dlg.hasAttribute("data-closing")) {
      if (reducedMotion()) return dlg.close();
      dlg.setAttribute("data-closing", "");
      const done = () => dlg.hasAttribute("data-closing") && dlg.close();
      const timer = setTimeout(done, 400);
      dlg.addEventListener("animationend", (e) => e.target === dlg && done(), { once: true });
      return () => clearTimeout(timer);
    }
  }, [open, mounted, initialFocus, kind]);

  // Closing for any reason (our exit, the browser, a form with method="dialog") ends the same way
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const closed = () => {
      dlg.removeAttribute("data-closing");
      if (locked.current) unlockScroll();
      locked.current = false;
      const back = opener.current;
      if (back?.isConnected && (document.activeElement === document.body || dlg.contains(document.activeElement))) back.focus();
      setMounted(false);
      document.dispatchEvent(new Event("asc:layer"));
      onClosed?.();
      // Closed by the browser while still meant to be open: tell the owner
      if (wanted.current) ask.current(false);
    };
    dlg.addEventListener("close", closed);
    return () => dlg.removeEventListener("close", closed);
  }, [onClosed]);

  // Unmounting while open still gives the page back
  useEffect(() => () => {
    if (locked.current) unlockScroll();
    locked.current = false;
    if (ref.current?.open) ref.current.close();
  }, []);

  const onCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    if (dismissible) onOpenChange(false);
  };

  // Tab and Shift+Tab go round inside, instead of out to the browser's address bar
  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const all = [...e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (!all.length) return;
    const first = all[0]!;
    const last = all[all.length - 1]!;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === e.currentTarget)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <style href="asc-dialog" precedence="asc">{css}</style>
      <dialog
        ref={ref}
        role={role === "alertdialog" ? "alertdialog" : undefined}
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description != null ? `${id}-desc` : undefined}
        className={["asc-dlg", className].filter(Boolean).join(" ")}
        data-kind={kind}
        data-size={size}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
        onClick={(e) => {
          // The dialog box itself is only hit outside the panel: that is the backdrop
          if (e.target === e.currentTarget && downOnBackdrop.current && dismissible) onOpenChange(false);
        }}
      >
        {mounted && (
          <div className="asc-dlg__panel">
            {before}
            <div className="asc-dlg__head">
              <h2 className="asc-dlg__title" id={`${id}-title`} ref={titleRef} tabIndex={-1}>{title}</h2>
              {description != null && <p className="asc-dlg__desc" id={`${id}-desc`}>{description}</p>}
            </div>
            <div className="asc-dlg__body">{children}</div>
            {footer != null && <div className="asc-dlg__foot">{footer}</div>}
            {!hideClose && (
              <IconButton className="asc-dlg__close" size="sm" icon={<Close />} label={closeLabel} tooltip={false} onClick={() => onOpenChange(false)} />
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

export type DrawerProps = Omit<DialogProps, "kind">;

/** A side panel from the right, for a record or a long form. Full screen on phones */
export function Drawer(props: DrawerProps) {
  return <Dialog {...props} kind="drawer" />;
}

// ---------------------------------------------------------------- Confirm

export type ConfirmOptions = {
  /** The question, e.g. "Delete 3 cases?" */
  title: ReactNode;
  /** What happens, in plain words: "Their visits and notes are deleted too. This can't be undone." */
  description?: ReactNode;
  /** Say what it does: "Delete cases", not "OK" */
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger makes the confirm button red and puts focus on Cancel, so Enter can't destroy by accident */
  tone?: "danger" | "neutral";
};

export type ConfirmDialogProps = ConfirmOptions & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs on confirm. Return a promise to keep the dialog open, with a spinner, until it settles. If it rejects, the dialog stays open */
  onConfirm: () => void | Promise<unknown>;
  onCancel?: () => void;
};

export function ConfirmDialog({
  open, onOpenChange, onConfirm, onCancel, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "danger",
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancel = () => {
    onCancel?.();
    onOpenChange(false);
  };
  const confirm = async () => {
    const result = onConfirm();
    if (!(result instanceof Promise)) return onOpenChange(false);
    setBusy(true);
    try {
      await result;
      onOpenChange(false);
    } catch {
      /* stays open: the caller says what went wrong, e.g. with a toast */
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : !busy && cancel())}
      role="alertdialog"
      size="sm"
      title={title}
      description={description}
      dismissible={!busy}
      hideClose
      initialFocus={tone === "danger" ? cancelRef : confirmRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={cancel} disabled={busy}>{cancelLabel}</Button>
          <Button ref={confirmRef} variant={tone === "danger" ? "danger" : "primary"} loading={busy} onClick={confirm}>{confirmLabel}</Button>
        </>
      }
    />
  );
}

/**
 * Ask before something destructive, in one line: if (await confirm({ title: "Delete case?" })) …
 * Returns the confirm function and the dialog element to render once in your component.
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const settle = useRef<((ok: boolean) => void) | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => {
    settle.current?.(false);
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      settle.current = resolve;
    });
  }, []);
  const finish = (ok: boolean) => {
    settle.current?.(ok);
    settle.current = null;
    setState((s) => (s ? { ...s, open: false } : s));
  };
  const element = state ? (
    <ConfirmDialog
      {...state}
      onOpenChange={(o) => !o && finish(false)}
      onConfirm={() => finish(true)}
    />
  ) : null;
  return [confirm, element];
}
