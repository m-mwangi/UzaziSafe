import * as React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg"; 
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition";

    // keep your colors and shadows intact
    const variants = {
      default:
        "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
      outline:
        "border border-indigo-300 text-indigo-700 bg-transparent hover:bg-indigo-50 focus:ring-indigo-500",
      ghost:
        "bg-transparent text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500",
    };

    // size control
    const sizes = {
      sm: "text-sm px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
