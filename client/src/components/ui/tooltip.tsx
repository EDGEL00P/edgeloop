import React from 'react';

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="relative">{children}</div>;
export const TooltipTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => <span>{children}</span>;
export const TooltipContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-black/80 text-white p-2 rounded-md text-sm">{children}</div>
);

export default Tooltip;
