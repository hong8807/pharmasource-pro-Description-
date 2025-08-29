import React from "react";
import { cn } from "@/lib/utils";

interface BrandCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const BrandCard = React.forwardRef<HTMLDivElement, BrandCardProps>(
  ({ children, className, variant = 'default', padding = 'md', hover = true, ...props }, ref) => {
    const baseClasses = "bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-[var(--border-radius-xl)] transition-[var(--transition-normal)]";
    
    const variantClasses = {
      default: "shadow-[var(--shadow-md)]",
      elevated: "shadow-[var(--shadow-lg)]",
      outlined: "shadow-none border-2"
    };
    
    const paddingClasses = {
      sm: "p-4",
      md: "p-6", 
      lg: "p-8"
    };

    const hoverClasses = hover 
      ? "hover:transform hover:-translate-y-1 hover:shadow-[var(--shadow-xl)] hover:border-[var(--color-primary)]" 
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          hoverClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BrandCard.displayName = "BrandCard";