"use client";
/**
 * Avatar: a person's photo, or their initials on a soft colour picked from their name, so the same
 * person always gets the same colour. AvatarGroup stacks several with a "+3" for the rest.
 * Reads the shared theme (@ascentui/tokens).
 */
import { useState, type HTMLAttributes } from "react";

const css = `@layer asc {
.asc-av{--s:32px;position:relative;display:inline-grid;place-items:center;flex:none;width:var(--s);height:var(--s);border-radius:var(--asc-radius-full);overflow:hidden;background:color-mix(in srgb,var(--hue) 22%,var(--asc-surface));color:var(--asc-ink);font:500 calc(var(--s) * .38)/1 var(--asc-font);letter-spacing:-.01em;user-select:none}
.asc-av[data-size="sm"]{--s:24px}.asc-av[data-size="lg"]{--s:40px}
.asc-av img{width:100%;height:100%;object-fit:cover}
.asc-avs{display:inline-flex;align-items:center}
.asc-avs>*+*{margin-left:calc(var(--s,32px) * -.2)}
.asc-avs .asc-av{box-shadow:0 0 0 2px var(--asc-surface)}
.asc-av[data-more]{background:var(--asc-subtle-strong);color:var(--asc-muted)}
}`;

const HUES = ["blue", "green", "amber", "red", "purple"];
const hueOf = (name: string) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `var(--asc-hue-${HUES[h % HUES.length]})`;
};
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Full name: used for the initials, the colour and the image's alt text */
  name: string;
  /** Photo. If it fails to load, the initials show instead */
  src?: string;
  /** 24, 32 or 40px */
  size?: "sm" | "md" | "lg";
};

export function Avatar({ name, src, size = "md", className, style, ...rest }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  return (
    <>
      <style href="asc-avatar" precedence="asc">{css}</style>
      <span
        className={["asc-av", className].filter(Boolean).join(" ")}
        data-size={size}
        role="img"
        aria-label={name}
        style={{ ["--hue" as string]: hueOf(name), ...style }}
        {...rest}
      >
        {showImage ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span aria-hidden>{initialsOf(name)}</span>}
      </span>
    </>
  );
}

export type AvatarGroupProps = {
  people: { name: string; src?: string }[];
  /** How many to show before "+N" */
  max?: number;
  size?: AvatarProps["size"];
};

export function AvatarGroup({ people, max = 4, size = "md" }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const s = size === "sm" ? "24px" : size === "lg" ? "40px" : "32px";
  return (
    <span className="asc-avs" style={{ ["--s" as string]: s }}>
      {shown.map((p) => (
        <Avatar key={p.name} name={p.name} src={p.src} size={size} />
      ))}
      {rest > 0 && (
        <span className="asc-av" data-size={size} data-more role="img" aria-label={`${rest} more`}>
          <span aria-hidden>+{rest}</span>
        </span>
      )}
    </span>
  );
}
