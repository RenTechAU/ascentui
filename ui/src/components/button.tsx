"use client";
/**
 * Button: the main way to act. Primary, secondary, ghost and danger, in three sizes.
 * Reads the shared theme (@ascentui/tokens): sizes grow to 44px on touch screens, and motion
 * stops when the device asks for less, without anything in this file.
 */
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { Spinner } from "./spinner";

const css = `@layer asc {
.asc-btn{--h:var(--asc-control-md);--icon:16px;position:relative;display:inline-flex;align-items:center;justify-content:center;gap:var(--asc-space-6);box-sizing:border-box;height:var(--h);min-width:0;max-width:100%;padding:0 calc(var(--h) * .36);margin:0;border:0;border-radius:var(--asc-radius);font:500 var(--asc-control-text)/1 var(--asc-font);white-space:nowrap;text-decoration:none;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-control);transition:background-color var(--asc-duration),box-shadow var(--asc-duration),opacity var(--asc-duration),transform var(--asc-duration-slow) var(--asc-ease)}
.asc-btn[data-size="sm"]{--h:var(--asc-control-sm);--icon:14px;gap:var(--asc-space-4);border-radius:var(--asc-radius-sm)}
.asc-btn[data-size="lg"]{--h:var(--asc-control-lg)}
.asc-btn[data-icon-only]{width:var(--h);padding:0}
.asc-btn svg{width:var(--icon);height:var(--icon);flex:none}
.asc-btn:hover{box-shadow:var(--asc-shadow-control-hover)}
.asc-btn:active:not(:disabled){transform:scale(.97)}
.asc-btn:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-btn[data-variant="primary"]{background:var(--asc-primary);color:var(--asc-on-primary);box-shadow:none}
.asc-btn[data-variant="primary"]:hover{background:color-mix(in srgb,var(--asc-primary) 86%,var(--asc-surface))}
.asc-btn[data-variant="ghost"]{background:transparent;box-shadow:none}
.asc-btn[data-variant="ghost"]:hover{background:var(--asc-subtle-strong)}
.asc-btn[data-variant="danger"]{background:var(--asc-danger-soft);color:var(--asc-danger);box-shadow:none}
.asc-btn[data-variant="danger"]:hover{background:color-mix(in srgb,var(--asc-danger) 16%,transparent)}
.asc-btn:disabled{opacity:.45;cursor:not-allowed}
.asc-btn[aria-busy="true"]{cursor:progress}
}`;

export type ButtonProps = ComponentProps<"button"> & {
  /** primary for the one main action on a screen; secondary for the rest; ghost in toolbars; danger to delete */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** 24, 28 or 32px high on a desk; 36 or 44px on touch screens */
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and ignores clicks, but stays focusable and announces that it is busy */
  loading?: boolean;
  /** Icon before the label. With no label the button becomes square: give it an aria-label */
  icon?: ReactNode;
  /** Icon after the label */
  iconRight?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  children,
  className,
  type = "button",
  onClick,
  ...rest
}: ButtonProps) {
  const iconOnly = children == null || children === false;
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading) return e.preventDefault();
    onClick?.(e);
  };
  return (
    <>
      <style href="asc-button" precedence="asc">{css}</style>
      <button
        type={type}
        className={["asc-btn", className].filter(Boolean).join(" ")}
        data-variant={variant}
        data-size={size}
        data-icon-only={iconOnly || undefined}
        aria-busy={loading || undefined}
        onClick={handleClick}
        {...rest}
      >
        {loading ? <Spinner size={size === "sm" ? "sm" : "md"} /> : icon}
        {children}
        {!iconOnly && iconRight}
      </button>
    </>
  );
}
