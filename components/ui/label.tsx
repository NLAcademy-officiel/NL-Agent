import { type LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("mb-2 block text-sm font-medium text-white/80", className)}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";
