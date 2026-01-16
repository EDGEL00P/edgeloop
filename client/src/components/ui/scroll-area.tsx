import React from 'react';

export const ScrollArea: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props} style={{ overflow: 'auto' }}>
    {children}
  </div>
);

export default ScrollArea;
