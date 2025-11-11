import * as React from "react";

export const Dialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => (
  <div>{open && children}</div>
);

export const DialogContent = ({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white rounded-lg shadow-lg p-6 ${className || ""}`}>
    {children}
  </div>
);

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);
// Add this to ui/dialog.tsx
export const DialogTrigger = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-md px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 ${className || ""}`}
  >
    {children}
  </button>
);