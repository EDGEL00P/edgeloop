import React from 'react';
import { Card as LibCard } from '../../../../libs/ui/src';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  return <LibCard {...props}>{children}</LibCard>;
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, ...props }) => (
  <h3 {...props}>{children}</h3>
);

export default Card;
