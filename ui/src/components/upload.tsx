"use client";
/**
 * Upload: choose or drop files, see each one's progress, retry what failed and remove what is not
 * wanted. Wrong types, files over the size limit and too many files are turned away with a plain
 * reason, before anything is sent. Images get a preview, and gallery view shows them as a grid
 * that opens in a lightbox: arrow keys or a swipe move between photos.
 * Nothing is sent from inside: you pass an upload function, it sends the file however your app
 * does and reports progress through onProgress. Removing a file mid-way aborts it through signal.
 * On phones, capture adds a "Take photo" button that opens the camera.
 * Built on the form kit (./field), Button, IconButton and Dialog. Reads the shared theme (@ascentui/tokens).
 */
import {
  useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent,
} from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { Field, type FieldParts } from "./field";
import { IconButton } from "./icon-button";

const css = `@layer asc {
.asc-up{display:flex;flex-direction:column;gap:var(--asc-space-8);min-width:0}
.asc-up__zone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--asc-space-8);box-sizing:border-box;min-height:120px;padding:var(--asc-space-16);border-radius:var(--asc-radius-lg);background:var(--asc-subtle);box-shadow:inset 0 0 0 1px var(--asc-border-strong);color:var(--asc-muted);text-align:center;cursor:pointer;transition:background-color var(--asc-duration),box-shadow var(--asc-duration)}
.asc-up__zone:hover{background:var(--asc-subtle-strong)}
.asc-up__zone[data-dragging]{background:var(--asc-subtle-strong);box-shadow:inset 0 0 0 2px var(--asc-primary);color:var(--asc-ink)}
.asc-up__zone[data-invalid]{box-shadow:inset 0 0 0 1px var(--asc-danger)}
.asc-up__zone[data-disabled]{opacity:.45;cursor:not-allowed}
.asc-up__zone>svg{width:20px;height:20px;color:var(--asc-faint)}
.asc-up__zone-text{margin:0}
.asc-up__zone-text strong{color:var(--asc-ink);font-weight:500}
.asc-up__buttons{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--asc-space-8)}
.asc-up__camera{display:none}
@media (pointer:coarse){.asc-up__camera{display:inline-flex}.asc-up__drop{display:none}}
.asc-up__input{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);border:0;opacity:0}
.asc-up__list{display:flex;flex-direction:column;gap:var(--asc-space-4);margin:0;padding:0;list-style:none}
.asc-up__item{display:flex;align-items:center;gap:var(--asc-space-12);box-sizing:border-box;min-height:calc(var(--asc-control-lg) + var(--asc-space-16));padding:var(--asc-space-8) var(--asc-space-8) var(--asc-space-8) var(--asc-space-8);border-radius:var(--asc-radius);background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-up__item[data-status="rejected"],.asc-up__item[data-status="error"]{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--asc-danger) 45%,transparent)}
.asc-up__thumb{display:grid;place-items:center;flex:none;width:var(--asc-control-lg);height:var(--asc-control-lg);border-radius:var(--asc-radius-sm);background:var(--asc-subtle-strong);color:var(--asc-muted);overflow:hidden}
.asc-up__thumb img{width:100%;height:100%;object-fit:cover}
.asc-up__thumb svg{width:16px;height:16px}
.asc-up__info{display:flex;flex-direction:column;gap:var(--asc-space-2);flex:1;min-width:0}
.asc-up__name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.asc-up__meta{color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs);font-variant-numeric:tabular-nums}
.asc-up__item[data-status="rejected"] .asc-up__meta,.asc-up__item[data-status="error"] .asc-up__meta{color:var(--asc-danger);font-weight:500}
.asc-up__bar{height:4px;border-radius:var(--asc-radius-full);background:var(--asc-subtle-strong);overflow:hidden}
.asc-up__bar>span{display:block;height:100%;width:100%;border-radius:inherit;background:var(--asc-primary);transform-origin:left;transform:scaleX(var(--p,0));transition:transform var(--asc-duration-slow) var(--asc-ease)}
.asc-up__acts{display:flex;align-items:center;gap:var(--asc-space-2);flex:none}
.asc-up__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:var(--asc-space-8);margin:0;padding:0;list-style:none}
.asc-up__tile{position:relative;aspect-ratio:1;border-radius:var(--asc-radius);background:var(--asc-subtle-strong);overflow:hidden;box-shadow:var(--asc-shadow-control)}
.asc-up__tile[data-status="rejected"],.asc-up__tile[data-status="error"]{box-shadow:inset 0 0 0 1px var(--asc-danger)}
.asc-up__open{display:block;width:100%;height:100%;margin:0;padding:0;border:0;background:none;cursor:zoom-in;color:var(--asc-muted)}
.asc-up__open:focus-visible{outline:2px solid var(--asc-focus);outline-offset:-2px}
.asc-up__open img{display:block;width:100%;height:100%;object-fit:cover}
.asc-up__open[data-file]{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--asc-space-4);padding:var(--asc-space-8);cursor:default;font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-up__open[data-file] svg{width:20px;height:20px}
.asc-up__open[data-file] span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asc-up__tile .asc-up__acts{position:absolute;top:var(--asc-space-4);right:var(--asc-space-4)}
.asc-up__tile .asc-up__acts .asc-btn{background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-up__tile-state{position:absolute;left:var(--asc-space-4);right:var(--asc-space-4);bottom:var(--asc-space-4);display:flex;flex-direction:column;gap:var(--asc-space-4);padding:var(--asc-space-4) var(--asc-space-6);border-radius:var(--asc-radius-sm);background:var(--asc-surface);color:var(--asc-ink);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs);pointer-events:none}
.asc-up__tile[data-status="error"] .asc-up__tile-state,.asc-up__tile[data-status="rejected"] .asc-up__tile-state{color:var(--asc-danger);font-weight:500}
.asc-up__box{display:flex;flex-direction:column;gap:var(--asc-space-12)}
.asc-up__stage{position:relative;display:grid;place-items:center;min-height:200px;border-radius:var(--asc-radius);background:var(--asc-subtle-strong);overflow:hidden;touch-action:pan-y pinch-zoom;user-select:none}
.asc-up__stage img{display:block;max-width:100%;max-height:min(64dvh,560px);object-fit:contain;-webkit-user-drag:none;transition:translate var(--asc-duration) var(--asc-ease)}
.asc-up__stage[data-dragging] img{transition:none}
.asc-up__nav{position:absolute;top:50%;transform:translateY(-50%)}
.asc-up__nav[data-side="prev"]{left:var(--asc-space-8)}
.asc-up__nav[data-side="next"]{right:var(--asc-space-8)}
.asc-up__nav .asc-btn{background:var(--asc-surface);box-shadow:var(--asc-shadow-control)}
.asc-up__count{margin:0;color:var(--asc-muted);text-align:center;font-variant-numeric:tabular-nums}
.asc-up__vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
}`;

// ---------------------------------------------------------------- types

export type UploadStatus = "queued" | "uploading" | "done" | "error" | "rejected";

export type UploadItem = {
  id: string;
  name: string;
  /** In bytes */
  size: number;
  /** The file's type, e.g. "image/jpeg" */
  type: string;
  status: UploadStatus;
  /** 0 to 1 while uploading */
  progress: number;
  /** Why it was turned away or failed, in plain words */
  error?: string;
  /** The file chosen, for new files */
  file?: File;
  /** A preview address: a local one for a new image, or your URL for a file already uploaded */
  preview?: string;
  /** What your upload function resolved with, such as the stored file's id or URL */
  result?: unknown;
};

/** Sends one file. Call onProgress with 0 to 1 as it goes; stop when signal aborts. Resolve when stored, reject to fail */
export type UploadFn = (file: File, ctx: { onProgress: (fraction: number) => void; signal: AbortSignal }) => Promise<unknown>;

export type ExistingFile = { id: string; name: string; size?: number; type?: string; url?: string };

export type UploadProps = FieldParts & {
  /** Sends a file. No fetch happens inside Upload */
  upload: UploadFn;
  /** What it takes, as for a file input: "image/*,.pdf" */
  accept?: string;
  /** The largest file, in bytes */
  maxSize?: number;
  /** The most files in total, counting ones already there */
  maxFiles?: number;
  /** Take more than one file. On by default */
  multiple?: boolean;
  /** On phones, add a Take photo button that opens this camera */
  capture?: "environment" | "user";
  /** Files already uploaded, e.g. when editing a record */
  defaultFiles?: ExistingFile[];
  /** Called whenever the list changes. Done files carry what upload resolved with in result */
  onChange?: (items: UploadItem[]) => void;
  /** Called when someone removes a file, e.g. to delete it on your server */
  onRemove?: (item: UploadItem) => void;
  /** list for documents; gallery for photos, as a grid of tiles with a lightbox */
  view?: "list" | "gallery";
  /** How many files upload at once */
  concurrency?: number;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The words on the zone, for other languages */
  labels?: Partial<UploadLabels>;
};

export type UploadLabels = {
  choose: string;
  camera: string;
  drop: string;
  retry: string;
  remove: string;
  open: string;
  previous: string;
  next: string;
  uploading: string;
  done: string;
  queued: string;
  /** "Up to 10 MB each" */
  limit: (size: string) => string;
  type: (name: string) => string;
  tooBig: (name: string, size: string, max: string) => string;
  tooMany: (name: string, max: number) => string;
  failed: string;
  of: (n: number, total: number) => string;
};

const LABELS: UploadLabels = {
  choose: "Choose files",
  camera: "Take photo",
  drop: "Drop files here or",
  retry: "Retry",
  remove: "Remove",
  open: "Open",
  previous: "Previous photo",
  next: "Next photo",
  uploading: "Uploading",
  done: "Uploaded",
  queued: "Waiting",
  limit: (size) => `Up to ${size} each`,
  type: (name) => `${name} is not a type of file this takes.`,
  tooBig: (name, size, max) => `${name} is ${size}. The limit is ${max}.`,
  tooMany: (name, max) => `${name} was left out: the limit is ${max} ${max === 1 ? "file" : "files"}.`,
  failed: "Could not upload. Check your connection and try again.",
  of: (n, total) => `${n} of ${total}`,
};

// ---------------------------------------------------------------- helpers

const units = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;
/** 2.4 MB, 380 kB: in the reader's own number format */
export function formatBytes(bytes: number): string {
  let u = 0;
  let n = bytes;
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000;
    u++;
  }
  return new Intl.NumberFormat(undefined, { style: "unit", unit: units[u], unitDisplay: "short", maximumFractionDigits: u < 2 ? 0 : 1 }).format(n);
}

/** Does a file fit an accept string such as "image/*,.pdf,application/zip"? */
export function accepts(file: { name: string; type: string }, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean).some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.endsWith("/*")) return type.startsWith(a.slice(0, -1));
    return type === a;
  });
}

const isImage = (i: { type: string; name: string }) => i.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|avif|heic)$/i.test(i.name);

let seq = 0;
const newId = () => `asc-up-${Date.now().toString(36)}-${++seq}`;

const Svg = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const I = {
  up: "M8 10.5V2.5M4.75 5.75 8 2.5l3.25 3.25M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2",
  file: "M9 1.75H4.5a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.25zM9 1.75v3.5h3.5",
  x: "M4.5 4.5l7 7M11.5 4.5l-7 7",
  retry: "M13.25 8A5.25 5.25 0 1 1 11.5 4.1M13.25 2.5v3h-3",
  camera: "M2.5 5.5a1 1 0 0 1 1-1h1.75l1-1.5h3.5l1 1.5h1.75a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1zM8 11a2.25 2.25 0 1 0 0-4.5A2.25 2.25 0 0 0 8 11z",
  prev: "M10 3.5 5.5 8l4.5 4.5",
  next: "M6 3.5 10.5 8 6 12.5",
};

// ---------------------------------------------------------------- the component

export function Upload({
  upload, accept, maxSize, maxFiles, multiple = true, capture, defaultFiles, onChange, onRemove, view = "list",
  concurrency = 3, label, description, error, hideLabel, required, disabled, id, className, style, labels: labelsIn,
}: UploadProps) {
  const labels = { ...LABELS, ...labelsIn };
  const [items, setItems] = useState<UploadItem[]>(() =>
    (defaultFiles ?? []).map((f) => ({
      id: f.id, name: f.name, size: f.size ?? 0, type: f.type ?? "", status: "done" as const, progress: 1, preview: f.url, result: f,
    })),
  );
  const [dragging, setDragging] = useState(false);
  const [say, setSay] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const started = useRef(new Set<string>());
  const controllers = useRef(new Map<string, AbortController>());
  const urls = useRef(new Set<string>());
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const uploadRef = useRef(upload);
  uploadRef.current = upload;
  const changed = useRef(onChange);
  changed.current = onChange;
  const first = useRef(true);

  const announce = (text: string) => {
    setSay("");
    setTimeout(() => setSay(text), 50);
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    changed.current?.(items);
  }, [items]);

  // Local previews are let go when their file is removed, and all of them when Upload goes
  useEffect(() => {
    const all = urls.current;
    const ctl = controllers.current;
    return () => {
      all.forEach((u) => URL.revokeObjectURL(u));
      all.clear();
      ctl.forEach((c) => c.abort());
    };
  }, []);

  const patch = (key: string, p: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.id === key ? { ...i, ...p } : i)));

  const run = useCallback((item: UploadItem) => {
    if (!item.file) return;
    started.current.add(item.id);
    const ctl = new AbortController();
    controllers.current.set(item.id, ctl);
    patch(item.id, { status: "uploading", progress: 0, error: undefined });
    let last = 0;
    uploadRef.current(item.file, {
      signal: ctl.signal,
      onProgress: (f) => {
        const p = Math.min(1, Math.max(0, f));
        // Fine-grained progress is smoothed to whole percents, so the page is not redrawn on every byte
        if (ctl.signal.aborted || Math.round(p * 100) === Math.round(last * 100)) return;
        last = p;
        patch(item.id, { progress: p });
      },
    }).then(
      (result) => {
        if (ctl.signal.aborted) return;
        patch(item.id, { status: "done", progress: 1, result });
        announce(`${item.name}: ${labels.done.toLowerCase()}`);
      },
      (e: unknown) => {
        if (ctl.signal.aborted) return;
        const msg = e instanceof Error && e.message ? e.message : labels.failed;
        patch(item.id, { status: "error", error: msg });
        announce(`${item.name}: ${msg}`);
      },
    ).finally(() => {
      controllers.current.delete(item.id);
      started.current.delete(item.id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The queue: a few at a time, oldest first
  useEffect(() => {
    const busy = items.filter((i) => i.status === "uploading").length;
    const waiting = items.filter((i) => i.status === "queued" && !started.current.has(i.id));
    waiting.slice(0, Math.max(0, concurrency - busy)).forEach(run);
  }, [items, concurrency, run]);

  const add = (files: FileList | File[] | null) => {
    if (!files || disabled) return;
    const list = [...files];
    if (!list.length) return;
    const kept = itemsRef.current.filter((i) => i.status !== "rejected").length;
    let room = maxFiles != null ? maxFiles - kept : Infinity;
    const out: UploadItem[] = [];
    const turnedAway: string[] = [];
    for (const file of multiple ? list : list.slice(0, 1)) {
      const base = { id: newId(), name: file.name, size: file.size, type: file.type, progress: 0, file };
      let why: string | undefined;
      if (!accepts(file, accept)) why = labels.type(file.name);
      else if (maxSize != null && file.size > maxSize) why = labels.tooBig(file.name, formatBytes(file.size), formatBytes(maxSize));
      else if (room <= 0) why = labels.tooMany(file.name, maxFiles!);
      if (why) {
        out.push({ ...base, status: "rejected", error: why });
        turnedAway.push(why);
        continue;
      }
      room--;
      let preview: string | undefined;
      if (isImage(file) && typeof URL.createObjectURL === "function") {
        preview = URL.createObjectURL(file);
        urls.current.add(preview);
      }
      out.push({ ...base, status: "queued", preview });
    }
    // A single-file Upload replaces what it had
    if (!multiple) itemsRef.current.forEach(drop);
    setItems((prev) => (multiple ? [...prev.filter((i) => i.status !== "rejected"), ...out] : out));
    if (turnedAway.length) announce(turnedAway.join(" "));
  };

  const drop = (item: UploadItem) => {
    controllers.current.get(item.id)?.abort();
    controllers.current.delete(item.id);
    if (item.preview && urls.current.has(item.preview)) {
      URL.revokeObjectURL(item.preview);
      urls.current.delete(item.preview);
    }
  };

  const remove = (item: UploadItem, from?: HTMLElement | null) => {
    drop(item);
    // Keep the keyboard's place: on to the next file's Remove, or back to the picker
    const row = from?.closest("li");
    const next = (row?.nextElementSibling ?? row?.previousElementSibling)?.querySelector<HTMLElement>("[data-remove]");
    setItems((list) => list.filter((i) => i.id !== item.id));
    if (item.status !== "rejected") onRemove?.(item);
    if (from) setTimeout(() => (next?.isConnected ? next.focus() : zone.current?.querySelector<HTMLElement>("button")?.focus()), 0);
  };

  const retry = (item: UploadItem) => {
    started.current.delete(item.id);
    patch(item.id, { status: "queued", progress: 0, error: undefined });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    add(e.dataTransfer.files);
  };

  const images = items.filter((i) => i.preview && isImage(i) && i.status !== "rejected");
  const meta = (i: UploadItem) =>
    i.status === "rejected" || i.status === "error"
      ? i.error
      : i.status === "uploading"
        ? `${labels.uploading} ${new Intl.NumberFormat(undefined, { style: "percent" }).format(i.progress)}`
        : i.status === "queued"
          ? labels.queued
          : i.size
            ? formatBytes(i.size)
            : labels.done;

  const actions = (i: UploadItem) => (
    <span className="asc-up__acts">
      {i.status === "error" && i.file && (
        <IconButton size="sm" icon={<Svg d={I.retry} />} label={`${labels.retry} ${i.name}`} onClick={() => retry(i)} />
      )}
      <IconButton size="sm" icon={<Svg d={I.x} />} label={`${labels.remove} ${i.name}`} data-remove onClick={(e) => remove(i, e.currentTarget)} />
    </span>
  );

  const bar = (i: UploadItem) =>
    i.status === "uploading" || i.status === "queued" ? (
      <span
        className="asc-up__bar"
        role="progressbar"
        aria-label={`${labels.uploading} ${i.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={i.status === "queued" ? undefined : Math.round(i.progress * 100)}
      >
        <span style={{ ["--p" as string]: i.progress }} />
      </span>
    ) : null;

  const hint = maxSize != null ? labels.limit(formatBytes(maxSize)) : null;

  return (
    <Field
      label={label}
      description={description ?? hint}
      error={error}
      hideLabel={hideLabel}
      required={required}
      id={id}
      group
      className={className}
      style={style}
    >
      {(c) => (
        <div className="asc-up">
          <style href="asc-upload" precedence="asc">{css}</style>
          <div
            ref={zone}
            id={c.id}
            role="group"
            aria-labelledby={c["aria-labelledby"]}
            aria-describedby={c["aria-describedby"]}
            className="asc-up__zone"
            data-dragging={dragging || undefined}
            data-invalid={c["aria-invalid"] || undefined}
            data-disabled={disabled || undefined}
            onClick={(e) => {
              if (disabled || (e.target as HTMLElement).closest("button")) return;
              picker.current?.click();
            }}
            onDragEnter={(e) => {
              if (disabled || !e.dataTransfer.types.includes("Files")) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              if (disabled || !e.dataTransfer.types.includes("Files")) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
            }}
            onDrop={onDrop}
          >
            <Svg d={I.up} />
            <p className="asc-up__zone-text"><span className="asc-up__drop">{labels.drop}</span></p>
            <span className="asc-up__buttons">
              {capture && (
                <Button className="asc-up__camera" variant="secondary" size="sm" icon={<Svg d={I.camera} />} disabled={disabled} onClick={() => camera.current?.click()}>
                  {labels.camera}
                </Button>
              )}
              <Button variant="secondary" size="sm" disabled={disabled} aria-describedby={c["aria-describedby"]} onClick={() => picker.current?.click()}>
                {labels.choose}
              </Button>
            </span>
            <input
              ref={picker}
              className="asc-up__input"
              type="file"
              tabIndex={-1}
              aria-hidden
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />
            {capture && (
              <input
                ref={camera}
                className="asc-up__input"
                type="file"
                tabIndex={-1}
                aria-hidden
                accept={accept && /image\//.test(accept) ? accept : "image/*"}
                capture={capture}
                disabled={disabled}
                onChange={(e) => {
                  add(e.target.files);
                  e.target.value = "";
                }}
              />
            )}
          </div>

          {items.length > 0 && view === "list" && (
            <ul className="asc-up__list" aria-label={typeof label === "string" ? label : undefined}>
              {items.map((i) => (
                <li key={i.id} className="asc-up__item" data-status={i.status}>
                  <span className="asc-up__thumb" aria-hidden>
                    {i.preview && isImage(i) ? <img src={i.preview} alt="" /> : <Svg d={I.file} />}
                  </span>
                  <span className="asc-up__info">
                    <span className="asc-up__name">{i.name}</span>
                    {bar(i)}
                    <span className="asc-up__meta">{meta(i)}</span>
                  </span>
                  {actions(i)}
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && view === "gallery" && (
            <ul className="asc-up__grid" aria-label={typeof label === "string" ? label : undefined}>
              {items.map((i) => {
                const pic = i.preview && isImage(i) && i.status !== "rejected";
                return (
                  <li key={i.id} className="asc-up__tile" data-status={i.status}>
                    {pic ? (
                      <button type="button" className="asc-up__open" aria-label={`${labels.open} ${i.name}`} aria-haspopup="dialog" onClick={() => setViewing(i.id)}>
                        <img src={i.preview} alt="" />
                      </button>
                    ) : (
                      <span className="asc-up__open" data-file>
                        <Svg d={I.file} />
                        <span>{i.name}</span>
                      </span>
                    )}
                    {i.status !== "done" && (
                      <span className="asc-up__tile-state">
                        {bar(i)}
                        <span>{meta(i)}</span>
                      </span>
                    )}
                    {actions(i)}
                  </li>
                );
              })}
            </ul>
          )}

          <span className="asc-up__vh" role="status">{say}</span>

          <Lightbox
            images={images}
            current={viewing}
            onChange={setViewing}
            labels={labels}
          />
        </div>
      )}
    </Field>
  );
}

// ---------------------------------------------------------------- lightbox

function Lightbox({ images, current, onChange, labels }: {
  images: UploadItem[]; current: string | null; onChange: (id: string | null) => void; labels: UploadLabels;
}) {
  const at = images.findIndex((i) => i.id === current);
  const shown = at >= 0 ? images[at] : undefined;
  const [last, setLast] = useState<UploadItem | undefined>(shown);
  if (shown && shown !== last) setLast(shown);
  const pic = shown ?? last;
  const n = images.length;
  const go = (by: number) => {
    if (at < 0 || n < 2) return;
    onChange(images[(at + by + n) % n]!.id);
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Arrow keys move between photos while it is open
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        goRef.current(e.key === "ArrowLeft" ? -1 : 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [!!shown]); // eslint-disable-line react-hooks/exhaustive-deps

  // A sideways swipe moves too; the photo follows the finger and springs back if it was a short one
  const drag = useRef<{ x: number; y: number; id: number; dx: number } | null>(null);
  const [dx, setDx] = useState(0);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || n < 2) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dx: 0 };
  };
  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const x = e.clientX - d.x;
    if (Math.abs(x) < 8 && !d.dx) return;
    if (!d.dx && Math.abs(e.clientY - d.y) > Math.abs(x)) {
      drag.current = null;
      return;
    }
    d.dx = x;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDx(x);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const w = e.currentTarget.clientWidth || 1;
    setDx(0);
    if (Math.abs(d.dx) > Math.min(80, w * 0.2)) go(d.dx < 0 ? 1 : -1);
  };

  return (
    <Dialog
      open={!!shown}
      onOpenChange={(o) => !o && onChange(null)}
      title={pic?.name ?? ""}
      description={n > 1 && at >= 0 ? labels.of(at + 1, n) : undefined}
      size="lg"
      onClosed={() => setLast(undefined)}
    >
      {pic && (
        <div className="asc-up__box">
          <div
            className="asc-up__stage"
            data-dragging={dx !== 0 || undefined}
            onPointerDown={down}
            onPointerMove={moveDrag}
            onPointerUp={up}
            onPointerCancel={up}
          >
            <img src={pic.preview} alt={pic.name} draggable={false} style={{ translate: `${dx}px 0` }} />
            {n > 1 && (
              <>
                <span className="asc-up__nav" data-side="prev">
                  <IconButton variant="secondary" icon={<Svg d={I.prev} />} label={labels.previous} onClick={() => go(-1)} />
                </span>
                <span className="asc-up__nav" data-side="next">
                  <IconButton variant="secondary" icon={<Svg d={I.next} />} label={labels.next} onClick={() => go(1)} />
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

/** Pretends to send a file, for demos and tests: reports progress over about a second and a half */
export function mockUpload(opts: { failEvery?: number; duration?: number } = {}): UploadFn {
  let count = 0;
  return (file, { onProgress, signal }) =>
    new Promise((resolve, reject) => {
      const n = ++count;
      const total = opts.duration ?? 1500;
      const start = Date.now();
      const timer = setInterval(() => {
        const p = Math.min(1, (Date.now() - start) / total);
        onProgress(p);
        if (opts.failEvery && n % opts.failEvery === 0 && p > 0.6) {
          clearInterval(timer);
          reject(new Error("The connection dropped. Try again."));
        } else if (p >= 1) {
          clearInterval(timer);
          resolve({ id: `file-${n}`, name: file.name });
        }
      }, 100);
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
}
