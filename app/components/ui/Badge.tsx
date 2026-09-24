"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "error" | "info" | "neutral" | "brand";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  success:
    "bg-[color-mix(in_srgb,var(--ds-success)_15%,var(--ds-surface))] text-[var(--ds-success)]",
  warning:
    "bg-[color-mix(in_srgb,var(--ds-warning)_15%,var(--ds-surface))] text-[var(--ds-warning)]",
  error:
    "bg-[color-mix(in_srgb,var(--ds-error)_15%,var(--ds-surface))] text-[var(--ds-error)]",
  info:
    "bg-[color-mix(in_srgb,var(--ds-info)_15%,var(--ds-surface))] text-[var(--ds-info)]",
  neutral:
    "bg-[color-mix(in_srgb,var(--ds-ink-muted)_15%,var(--ds-surface))] text-[var(--ds-ink-muted)]",
  brand:
    "bg-[color-mix(in_srgb,var(--ds-brand)_10%,var(--ds-surface))] text-[var(--ds-brand)]",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex w-max items-center rounded-[var(--ds-radius-full)] px-2 py-1 text-xs font-semibold capitalize",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
);
Badge.displayName = "Badge";

export { Badge as UIBadge };
