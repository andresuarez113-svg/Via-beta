import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      suppressHydrationWarning
      className={cn(
        "h-11 w-full rounded-xl bg-surface px-3.5 text-sm text-ink shadow-[var(--shadow-border)] placeholder:text-subtle outline-none focus-visible:ring-2 focus-visible:ring-forest/35",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      suppressHydrationWarning
      className={cn(
        "min-h-24 w-full resize-y rounded-xl bg-surface px-3.5 py-2.5 text-sm text-ink shadow-[var(--shadow-border)] placeholder:text-subtle outline-none focus-visible:ring-2 focus-visible:ring-forest/35",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-xs font-medium tracking-wide text-muted", className)}
      {...props}
    />
  );
}
