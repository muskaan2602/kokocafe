import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A2A] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-[#E86A2A] text-white hover:bg-[#C94F16] active:scale-[0.98] shadow-sm hover:shadow-md",
    secondary:
      "bg-[#2B1B14] text-white hover:bg-[#5C3D2E] active:scale-[0.98]",
    outline:
      "border-2 border-[#E86A2A] text-[#E86A2A] hover:bg-[#E86A2A] hover:text-white active:scale-[0.98]",
    ghost:
      "text-[#2B1B14] hover:bg-[#F5EBDD] active:scale-[0.98]",
    danger:
      "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
