import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full " +
  "transition-all duration-200 ease-out select-none " +
  "active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus-visible:outline-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[color:var(--primary)] text-white shadow-soft " +
    "hover:bg-[color:var(--primary-hover)] hover:-translate-y-px hover:shadow-soft-lg " +
    "active:shadow-none",
  ghost:
    "text-[color:var(--text)] hover:bg-[color:var(--surface-2)] " +
    "hover:text-[color:var(--primary)]",
  outline:
    "border border-[color:var(--border)] text-[color:var(--text)] " +
    "hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] " +
    "hover:-translate-y-px",
  danger:
    "border border-[color:var(--alarm)] text-[color:var(--alarm)] " +
    "hover:bg-[color:var(--alarm)]/10 hover:-translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  )
);
Button.displayName = "Button";

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
}
