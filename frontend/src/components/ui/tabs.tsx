import * as React from "react";

interface TabsProps {
  /** Controlled tab value */
  value: string;
  /** Change handler for tab value */
  onValueChange: (value: string) => void;
  /** Tab children (usually TabsList + TabsContent) */
  children: React.ReactNode;
  /** Optional CSS */
  className?: string;
}

/**
 * Tabs container — controlled by value and onValueChange.
 */
export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  children,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        // ✅ Pass activeValue + setActiveValue to ALL children (e.g. TabsList)
        return React.cloneElement(child as React.ReactElement<any>, {
          activeValue: value,
          setActiveValue: onValueChange,
        });
      })}
    </div>
  );
};

/**
 * TabsList — contains tab triggers
 * ✅ Updated: now forwards activeValue + setActiveValue to its children (TabsTrigger)
 */
export const TabsList: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    activeValue?: string;
    setActiveValue?: (v: string) => void;
  }
> = ({ children, className = "", activeValue, setActiveValue }) => (
  <div className={`flex bg-gray-100 rounded-md ${className}`}>
    {React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child as React.ReactElement<any>, {
        activeValue,
        setActiveValue,
      });
    })}
  </div>
);

/**
 * TabsTrigger — clickable button for each tab
 */
export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  activeValue?: string;
  setActiveValue?: (v: string) => void;
}> = ({ value, children, className = "", onClick, activeValue, setActiveValue }) => (
  <button
    type="button"
    onClick={() => {
      setActiveValue?.(value);
      onClick?.();
    }}
    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition
      ${activeValue === value
        ? "bg-indigo-600 text-white"
        : "text-gray-600 hover:bg-indigo-100"}
      ${className}`}
  >
    {children}
  </button>
);

/**
 * TabsContent — renders content for active tab
 */
export const TabsContent: React.FC<{
  value: string;
  activeValue?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, activeValue, children, className = "" }) =>
  value === activeValue ? <div className={className}>{children}</div> : null;
