import React from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormField({ label, id, className = "", ...rest }: FormFieldProps): React.ReactElement {
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="block text-xs font-semibold text-text-1 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-3 py-2 border border-border rounded text-sm text-text-1 bg-surface transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)] ${className}`}
        {...rest}
      />
    </div>
  );
}
