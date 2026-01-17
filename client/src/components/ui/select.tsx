import React from 'react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange, ...props }) => (
  <select 
    {...props} 
    value={value} 
    onChange={(e) => onValueChange?.(e.target.value)}
    className={`${props.className ?? ''} bg-white/5 text-white rounded-md px-2 py-1`}
  >
    {children}
  </select>
);

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, ...props }) => <div {...props}>{children}</div>;
export const SelectItem: React.FC<any> = ({ children, ...props }) => <option {...props}>{children}</option>;
export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, ...props }) => <div {...props}>{children}</div>;
export const SelectValue: React.FC<{ children?: React.ReactNode; placeholder?: string }> = ({ children, placeholder }) => <span>{children ?? placeholder}</span>;

export default Select;
