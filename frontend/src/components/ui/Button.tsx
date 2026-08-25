import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[0_2px_8px_rgba(0,61,122,0.2)] hover:bg-primary-hover hover:shadow-[0_4px_12px_rgba(0,61,122,0.3)] hover:-translate-y-px",
  secondary: "bg-surface text-text-1 border border-border hover:bg-surface-2 hover:border-border-strong",
  ghost: "bg-transparent text-text-2 border border-border hover:bg-surface-2 hover:text-text-1",
  danger: "bg-danger text-white hover:bg-red-700",
  success: "bg-success text-white hover:bg-emerald-700",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-sm",
  md: "px-4 py-2 text-sm rounded",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-primary focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
