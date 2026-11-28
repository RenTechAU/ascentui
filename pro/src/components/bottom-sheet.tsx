"use client";
/**
 * BottomSheet: a panel that slides up from the bottom of a phone screen, for a quick action or a
 * short form without leaving the page. Drag the handle down to dismiss it; a quick flick is
 * enough. Give it snapPoints to let it rest half open and pull up to full height.
 * In a wide space it falls back to a centred dialog, unless mode="sheet". It goes by the width of the
 * space it is placed in, not the window's, like App Shell: inside a narrow panel or a phone frame it is a sheet.
 * It is the kit's Dialog underneath, so the page behind is out of reach, Escape and the ×
 * button close it, and focus goes back to the button that opened it. It keeps clear of the
 * phone's home bar and notch.
 * Built from Dialog. Reads the shared theme (@ascentui/tokens).
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Dialog, type DialogProps } from "@ascentui/ui/components/dialog";

// The sheet rules, written once and used twice: in a narrow space in auto mode, and always in sheet mode
const sheet = (s: string) => `
${s}.asc-dlg{--w:640px;inset:auto 0 0 0;width:min(var(--w),100%);max-height:calc(100dvh - max(var(--asc-space-24),env(safe-area-inset-top)));margin:0 auto;border-radius:var(--asc-radius-lg) var(--asc-radius-lg) 0 0;translate:0 0}
${s}.asc-dlg[open]{animation-name:asc-sheet-in}
${s}.asc-dlg[data-closing]{animation-name:asc-sheet-out}
${s}.asc-dlg:not([data-dragging]){transition:translate var(--asc-duration-slow) var(--asc-ease),height var(--asc-duration-slow) var(--asc-ease)}
${s}.asc-dlg[data-snaps]{height:var(--asc-sheet-h)}
${s} .asc-sheet__grip{display:flex}
${s} .asc-dlg__head{padding-top:var(--asc-space-4)}
${s}.asc-dlg .asc-dlg__close{top:calc(var(--asc-space-16) + var(--asc-space-4) + (var(--asc-leading-md) - var(--asc-control-sm)) / 2)}
${s} .asc-dlg__foot{padding-bottom:max(var(--asc-space-12),env(safe-area-inset-bottom))}
${s} .asc-dlg__foot>*{flex:1 1 auto}
${s} .asc-dlg__panel:not(:has(.asc-dlg__foot)) .asc-dlg__body{padding-bottom:max(var(--asc-space-16),env(safe-area-inset-bottom))}
`;

const css = `@layer asc {
.asc-sheet__grip{display:none;justify-content:center;flex:none;box-sizing:border-box;width:100%;padding:var(--asc-space-8) 0 var(--asc-space-4);margin:0;border:0;background:none;color:inherit;touch-action:none;cursor:grab;-webkit-tap-highlight-color:transparent}
.asc-sheet__grip:active{cursor:grabbing}
.asc-sheet__grip:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px;border-radius:var(--asc-radius)}
.asc-sheet__bar{display:block;width:36px;height:4px;border-radius:var(--asc-radius-full);background:var(--asc-border-strong)}
.asc-sheet .asc-dlg__head{touch-action:none}
${sheet(".asc-sheet--narrow")}
${sheet(".asc-sheet--sheet")}
@keyframes asc-sheet-in{from{transform:translateY(100%)}}
@keyframes asc-sheet-out{to{transform:translateY(100%)}}
}`;

export type BottomSheetProps = Omit<DialogProps, "kind" | "before"> & {
  /** Heights it can rest at, as fractions of the screen's height, smallest first, e.g. [0.5, 0.9].
   *  Leave out to fit its content */
  snapPoints?: number[];
  /** Which snap point it opens at, by index. Defaults to the smallest */
  defaultSnap?: number;
  /** auto: a sheet when the space it is placed in is 640px wide or less, a centred dialog when wider. sheet: always a sheet */
  mode?: "auto" | "sheet";
  /** Words for the handle, when it has snap points */
  expandLabel?: string;
  collapseLabel?: string;
};

/** How fast a finger moves to count as a flick, in px per ms */
const FLICK = 0.5;

export function BottomSheet({
  snapPoints, defaultSnap = 0, mode = "auto", className, open, onOpenChange, dismissible = true, initialFocus, onClosed,
  expandLabel = "Expand", collapseLabel = "Collapse", ...rest
}: BottomSheetProps) {
  const grip = useRef<HTMLElement | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const [narrow, setNarrow] = useState(false);

  // Measure the space the sheet is placed in (its parent), not the window
  useLayoutEffect(() => {
    if (mode !== "auto") return;
    const space = anchor.current?.parentElement;
    const measure = () => setNarrow((space?.clientWidth || window.innerWidth) <= 640);
    measure();
    if (!space || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(space);
    return () => ro.disconnect();
  }, [mode]);
  const snaps = snapPoints?.length ? [...snapPoints].sort((a, b) => a - b) : null;
  const [snap, setSnap] = useState(defaultSnap);
  const at = snaps ? Math.min(Math.max(snap, 0), snaps.length - 1) : 0;
  const last = useRef<HTMLDialogElement | null>(null);
  const dialogOf = () => {
    const d = (grip.current?.closest("dialog") as HTMLDialogElement | null) ?? null;
    if (d) last.current = d;
    return d;
  };
  /** Is it showing as a sheet right now, or as the desk dialog? The handle only shows on a sheet */
  const isSheet = () => !!grip.current && getComputedStyle(grip.current).display !== "none";

  useEffect(() => {
    if (open) setSnap(defaultSnap);
  }, [open, defaultSnap]);

  // Snap heights live in a variable on the dialog, so CSS can ease between them
  useLayoutEffect(() => {
    const dlg = dialogOf();
    if (!dlg) return;
    if (snaps) {
      dlg.setAttribute("data-snaps", "");
      dlg.style.setProperty("--asc-sheet-h", `${snaps[at]! * 100}dvh`);
    } else {
      dlg.removeAttribute("data-snaps");
      dlg.style.removeProperty("--asc-sheet-h");
    }
  });

  // Dragging: the handle and the title bar move the sheet. Down far or fast enough closes it;
  // with snap points it settles at the nearest one, judged by where the flick was heading
  const ask = useRef(onOpenChange);
  ask.current = onOpenChange;
  const state = useRef({ snaps, at, dismissible });
  state.current = { snaps, at, dismissible };
  useEffect(() => {
    if (!open) return;
    const dlg = dialogOf();
    if (!dlg) return;
    const zones = [grip.current, dlg.querySelector<HTMLElement>(".asc-dlg__head")].filter((z): z is HTMLElement => !!z);
    let d: { id: number; y0: number; h0: number; dragging: boolean; samples: [number, number][]; moved: number } | null = null;

    const down = (e: PointerEvent) => {
      if (!isSheet() || (e.pointerType === "mouse" && e.button !== 0)) return;
      d = { id: e.pointerId, y0: e.clientY, h0: dlg.getBoundingClientRect().height, dragging: false, samples: [[e.clientY, e.timeStamp]], moved: 0 };
    };
    const move = (e: PointerEvent) => {
      if (!d || e.pointerId !== d.id) return;
      const dy = e.clientY - d.y0;
      if (!d.dragging) {
        if (Math.abs(dy) < 6) return;
        d.dragging = true;
        dlg.setAttribute("data-dragging", "");
        (e.target as Element).setPointerCapture?.(e.pointerId);
      }
      d.samples.push([e.clientY, e.timeStamp]);
      if (d.samples.length > 6) d.samples.shift();
      const { snaps: sp } = state.current;
      if (sp) {
        const vh = innerHeight;
        const minH = sp[0]! * vh;
        const maxH = sp[sp.length - 1]! * vh;
        let h = d.h0 - dy;
        if (h > maxH) h = maxH + (h - maxH) * 0.2;
        if (h >= minH) {
          dlg.style.height = `${h}px`;
          dlg.style.translate = "0 0";
          d.moved = 0;
        } else {
          dlg.style.height = `${minH}px`;
          dlg.style.translate = `0 ${minH - h}px`;
          d.moved = minH - h;
        }
      } else {
        const y = dy > 0 ? dy : dy * 0.2;
        dlg.style.translate = `0 ${y}px`;
        d.moved = Math.max(0, dy);
      }
    };
    const up = (e: PointerEvent) => {
      if (!d || e.pointerId !== d.id) return;
      const drag = d;
      d = null;
      if (!drag.dragging) return;
      dlg.removeAttribute("data-dragging");
      // Swallow the click that ends a drag, so the × button under the finger is not pressed
      const swallow = (c: MouseEvent) => {
        c.stopPropagation();
        c.preventDefault();
      };
      addEventListener("click", swallow, true);
      setTimeout(() => removeEventListener("click", swallow, true), 0);
      const s = drag.samples;
      const [y1, t1] = s[0]!;
      const [y2, t2] = s[s.length - 1]!;
      const v = t2 > t1 ? (y2 - y1) / (t2 - t1) : 0;
      const { snaps: sp, at: idx, dismissible: canClose } = state.current;
      const close = () => {
        ask.current(false);
      };
      if (sp) {
        const vh = innerHeight;
        const h = dlg.getBoundingClientRect().height;
        const minH = sp[0]! * vh;
        const projected = h - v * 180;
        if (canClose && drag.moved > 0 && (v > FLICK || projected < minH * 0.6)) return close();
        dlg.style.height = "";
        dlg.style.translate = "";
        let best = 0;
        sp.forEach((p, i) => {
          if (Math.abs(p * vh - projected) < Math.abs(sp[best]! * vh - projected)) best = i;
        });
        if (best === idx) dlg.style.setProperty("--asc-sheet-h", `${sp[idx]! * 100}dvh`);
        setSnap(best);
      } else {
        if (canClose && (drag.moved > drag.h0 * 0.3 || (v > FLICK && drag.moved > 24))) return close();
        dlg.style.translate = "";
      }
    };
    zones.forEach((z) => z.addEventListener("pointerdown", down));
    dlg.addEventListener("pointermove", move);
    dlg.addEventListener("pointerup", up);
    dlg.addEventListener("pointercancel", up);
    return () => {
      zones.forEach((z) => z.removeEventListener("pointerdown", down));
      dlg.removeEventListener("pointermove", move);
      dlg.removeEventListener("pointerup", up);
      dlg.removeEventListener("pointercancel", up);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start on the title, not a field, so a phone does not open its keyboard straight away
  const titleFocus = useRef<{ readonly current: HTMLElement | null }>({
    get current() {
      return dialogOf()?.querySelector<HTMLElement>(".asc-dlg__title") ?? null;
    },
  }).current as RefObject<HTMLElement | null>;

  const expanded = snaps ? at === snaps.length - 1 : undefined;
  const handle = snaps ? (
    <button
      ref={(n) => {
        grip.current = n;
      }}
      type="button"
      className="asc-sheet__grip"
      aria-label={expanded ? collapseLabel : expandLabel}
      aria-expanded={expanded}
      onClick={() => setSnap(expanded ? 0 : snaps.length - 1)}
    >
      <span className="asc-sheet__bar" aria-hidden />
    </button>
  ) : (
    <div
      ref={(n) => {
        grip.current = n;
      }}
      className="asc-sheet__grip"
      aria-hidden
    >
      <span className="asc-sheet__bar" />
    </div>
  );

  return (
    <>
      <style href="asc-bottom-sheet" precedence="asc">{css}</style>
      <span ref={anchor} hidden />
      <Dialog
        {...rest}
        open={open}
        onOpenChange={onOpenChange}
        dismissible={dismissible}
        initialFocus={initialFocus ?? titleFocus}
        onClosed={() => {
          const dlg = dialogOf() ?? last.current;
          dlg?.style.removeProperty("height");
          dlg?.style.removeProperty("translate");
          onClosed?.();
        }}
        before={handle}
        className={["asc-sheet", `asc-sheet--${mode}`, mode === "auto" && narrow && "asc-sheet--narrow", className].filter(Boolean).join(" ")}
      />
    </>
  );
}
