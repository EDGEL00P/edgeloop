import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  return (
    <div className={`bg-[linear-gradient(180deg,#0b0b0b,rgba(255,255,255,0.02))] p-4 rounded-md shadow-md ${props.className ?? ''}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
