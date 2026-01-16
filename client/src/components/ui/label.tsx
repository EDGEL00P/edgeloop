import React from 'react';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, ...props }) => (
  <label {...props} className={`${props.className ?? ''} text-sm text-white/80`}>{children}</label>
);

export default Label;
