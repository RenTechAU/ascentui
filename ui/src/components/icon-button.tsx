"use client";
/**
 * IconButton: a square button with only an icon. Its label is required: it is read out by
 * screen readers and shown as a tooltip, so nobody has to guess what an icon means.
 * Built from Button and Tooltip.
 */
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { Tooltip } from "./tooltip";

export type IconButtonProps = Omit<ButtonProps, "children" | "icon" | "iconRight"> & {
  /** The icon, as an inline svg */
  icon: ReactNode;
  /** What the button does, e.g. "Delete case". Required */
  label: string;
  /** Show the label as a tooltip on hover and focus. On by default */
  tooltip?: boolean;
};

export function IconButton({ icon, label, tooltip = true, variant = "ghost", ...rest }: IconButtonProps) {
  const button = <Button variant={variant} icon={icon} aria-label={label} {...rest} />;
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
}
