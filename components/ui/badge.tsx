import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  neutral: "bg-white/5 text-white/60 border-line",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
