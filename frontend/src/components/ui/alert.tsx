import * as React from "react";
import { cn } from "../../lib/utils";

export function Alert({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border p-4 flex items-start gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({
  children,
  className,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <h4 className={cn("font-semibold text-gray-900", className)}>{children}</h4>
  );
}

export function AlertDescription({
  children,
  className,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-gray-700", className)}>{children}</p>
  );
}
