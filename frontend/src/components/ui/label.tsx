import * as React from "react";

export const Label = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className="text-sm font-medium text-gray-700" {...props}>
    {children}
  </label>
);
