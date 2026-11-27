"use client";
/**
 * EmptyState: what a list or page shows when there is nothing in it yet. Says what would be here
 * and offers the one action that fills it. Reads the shared theme (@ascentui/tokens).
 */
import type { HTMLAttributes, ReactNode } from "react";

const css = `@layer asc {
.asc-empty{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:var(--asc-space-8);max-width:360px;margin:0 auto;padding:var(--asc-space-24) var(--asc-space-16);text-align:center;font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font);color:var(--asc-ink)}
.asc-empty[data-size="sm"]{padding:var(--asc-space-12);gap:var(--asc-space-4)}
.asc-empty__icon{display:grid;place-items:center;width:40px;height:40px;border-radius:var(--asc-radius-lg);background:var(--asc-subtle-strong);color:var(--asc-faint);margin-bottom:var(--asc-space-4)}
.asc-empty__icon svg{width:20px;height:20px}
.asc-empty__title{margin:0;font:500 var(--asc-text-md)/var(--asc-leading-md) var(--asc-font)}
.asc-empty__desc{margin:0;color:var(--asc-muted)}
.asc-empty__action{margin-top:var(--asc-space-8);display:flex;gap:var(--asc-space-8);flex-wrap:wrap;justify-content:center}
}`;

export type EmptyStateProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  icon?: ReactNode;
  /** What would be here: "No cases yet" */
  title: ReactNode;
  /** Why, or what happens next: "New cases appear here when a customer books a visit." */
  description?: ReactNode;
  /** Usually one button that fills the space */
  action?: ReactNode;
  /** sm inside a card or table; md for a whole page */
  size?: "sm" | "md";
};

export function EmptyState({ icon, title, description, action, size = "md", className, ...rest }: EmptyStateProps) {
  return (
    <>
      <style href="asc-empty-state" precedence="asc">{css}</style>
      <div className={["asc-empty", className].filter(Boolean).join(" ")} data-size={size} {...rest}>
        {icon && (
          <span className="asc-empty__icon" aria-hidden>
            {icon}
          </span>
        )}
        <p className="asc-empty__title">{title}</p>
        {description != null && <p className="asc-empty__desc">{description}</p>}
        {action != null && <div className="asc-empty__action">{action}</div>}
      </div>
    </>
  );
}
