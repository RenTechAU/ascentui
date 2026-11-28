"use client";
/**
 * Card: a surface that groups one thing, such as a record summary or a form section.
 * Optional header (title, description, action) and footer. Reads the shared theme (@ascentui/tokens).
 */
import type { HTMLAttributes, ReactNode } from "react";

const css = `@layer asc {
.asc-card{box-sizing:border-box;display:flex;flex-direction:column;gap:var(--asc-space-12);min-width:0;padding:var(--asc-space-12);border-radius:var(--asc-radius-lg);background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-control);font:400 var(--asc-text-sm)/var(--asc-leading-sm) var(--asc-font)}
.asc-card[data-padding="none"]{padding:0;overflow:hidden}
.asc-card[data-padding="lg"]{padding:var(--asc-space-16)}
.asc-card__head{display:flex;align-items:flex-start;gap:var(--asc-space-8)}
.asc-card__titles{flex:1;min-width:0}
.asc-card__title{margin:0;font:500 var(--asc-text-md)/var(--asc-leading-md) var(--asc-font)}
.asc-card__desc{margin:0;color:var(--asc-muted);font-size:var(--asc-text-xs);line-height:var(--asc-leading-xs)}
.asc-card__foot{display:flex;align-items:center;justify-content:flex-end;gap:var(--asc-space-8);margin:0 calc(var(--asc-space-12) * -1) calc(var(--asc-space-12) * -1);padding:var(--asc-space-8) var(--asc-space-12);border-top:1px solid var(--asc-border)}
}`;

export type CardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  /** One control at the top right, such as a menu button */
  action?: ReactNode;
  /** Actions along the bottom, right-aligned */
  footer?: ReactNode;
  /** none for edge-to-edge content such as a table */
  padding?: "none" | "md" | "lg";
  /** section when the card has a title and stands on its own; div otherwise */
  as?: "div" | "section" | "article";
};

export function Card({ title, description, action, footer, padding = "md", as: Tag = "div", className, children, ...rest }: CardProps) {
  const hasHead = title != null || description != null || action != null;
  return (
    <>
      <style href="asc-card" precedence="asc">{css}</style>
      <Tag className={["asc-card", className].filter(Boolean).join(" ")} data-padding={padding} {...rest}>
        {hasHead && (
          <div className="asc-card__head">
            <div className="asc-card__titles">
              {title != null && <h3 className="asc-card__title">{title}</h3>}
              {description != null && <p className="asc-card__desc">{description}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
        {footer != null && <div className="asc-card__foot">{footer}</div>}
      </Tag>
    </>
  );
}
