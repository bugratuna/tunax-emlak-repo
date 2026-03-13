import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// ── Variant styles ─────────────────────────────────────────────────────────
// Each variant owns its own color palette (bg, text, hover, active, ring).
// Font-weight is variant-specific: primary/destructive are semibold (CTAs),
// secondary/ghost are medium (supporting actions).
const variantCls: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white font-semibold hover:bg-zinc-700 active:bg-zinc-800 focus-visible:ring-zinc-500",
  secondary:
    "border border-zinc-200 bg-white text-zinc-700 font-medium hover:bg-zinc-50 active:bg-zinc-100 focus-visible:ring-zinc-400",
  destructive:
    "bg-red-600 text-white font-semibold hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500",
  ghost:
    "text-zinc-600 font-medium hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-400",
};

// ── Size styles ────────────────────────────────────────────────────────────
// sm  → xs text, compact padding (inline chip-like actions)
// md  → sm text, standard padding with rounded-md (most form/modal buttons)
// lg  → sm text, taller padding with rounded-lg (full-width auth CTAs)
const sizeCls: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-4 py-2.5 text-sm rounded-lg",
};

// ── Component ──────────────────────────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Layout
          "inline-flex items-center justify-center select-none",
          // Smooth transition for color + scale
          "transition-all",
          // Tactile press feedback — suppressed when disabled so the button
          // does not scale while showing cursor-not-allowed
          "active:scale-[0.98]",
          // Keyboard focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          // Disabled state: remove press feedback, block pointer
          disabled
            ? "cursor-not-allowed opacity-50 active:scale-100"
            : "cursor-pointer",
          variantCls[variant],
          sizeCls[size],
          className,
        )}
        {...props}
      />
    );
  },
);
