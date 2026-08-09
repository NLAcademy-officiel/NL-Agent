import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-soft",
  secondary: "bg-surface text-white border border-line hover:border-brand-400/60",
  ghost: "bg-transparent text-white hover:bg-white/5",
  outline: "bg-transparent text-brand-500 border border-brand-500 hover:bg-brand-500/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
