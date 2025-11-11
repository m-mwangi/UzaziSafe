import * as React from "react";

export const Select = ({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
}) => <div>{children}</div>;

export const SelectTrigger = ({
  children,
}: {
  children: React.ReactNode;
}) => <div>{children}</div>;

export const SelectValue = ({
  placeholder,
}: {
  placeholder?: string;
}) => <span className="text-gray-500">{placeholder}</span>;

export const SelectContent = ({
  children,
}: {
  children: React.ReactNode;
}) => <div className="mt-2 border rounded">{children}</div>;

export const SelectItem = ({
  value,
  disabled,
  children,
}: {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`px-3 py-2 cursor-pointer ${
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
    }`}
  >
    {children}
  </div>
);
