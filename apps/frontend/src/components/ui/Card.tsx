import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  elevated = false, 
  style, 
  ...props 
}) => {
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface-raised)',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${elevated ? 'var(--border-strong)' : 'var(--border-default)'}`,
    padding: elevated ? 'var(--sp-5)' : 'var(--sp-4)',
    boxShadow: 'none', // ZenGrid enforces no shadows
    ...style,
  };

  return (
    <div style={cardStyle} {...props}>
      {children}
    </div>
  );
};
