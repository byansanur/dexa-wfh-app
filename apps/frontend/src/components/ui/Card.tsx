import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  elevated = false, 
  className = '',
  style, 
  ...props 
}) => {
  return (
    <div 
      className={`zengrid-card ${elevated ? 'elevated' : ''} ${className}`} 
      style={style} 
      {...props}
    >
      {children}
    </div>
  );
};
