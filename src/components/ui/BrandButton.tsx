import React from "react";
import { cn } from "@/lib/utils";

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
}

export const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', shimmer = false, ...props }, ref) => {
    const baseClasses = "btn-base focus-ring";
    
    const variantClasses = {
      primary: "btn-primary",
      secondary: "btn-secondary", 
      ghost: "btn-ghost"
    };
    
    const sizeClasses = {
      sm: "px-3 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base"
    };

    // 회사 브랜드 색상으로 커스터마이즈된 shimmer 효과
    if (shimmer && variant === 'primary') {
      return (
        <button
          ref={ref}
          className={cn(
            baseClasses,
            "relative overflow-hidden",
            sizeClasses[size],
            "bg-[var(--color-primary)] text-[var(--color-text-light)] border-[var(--color-primary)]",
            "before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full",
            "before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
            "before:transition-all before:duration-700 hover:before:left-[100%]",
            "hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)]",
            className
          )}
          {...props}
        >
          <span className="relative z-10">{children}</span>
        </button>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BrandButton.displayName = "BrandButton";