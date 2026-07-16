import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  style,
  ...props 
}) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'inherit',
    borderRadius: 'var(--radius-md)',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.35 : 1,
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { fontSize: '12px', height: '32px', padding: '6px 16px', fontWeight: 500 },
    md: { fontSize: '14px', height: '40px', padding: '10px 20px', fontWeight: 500 },
    lg: { fontSize: '15px', height: '48px', padding: '14px 28px', fontWeight: 500 },
  };

  let variantStyle: React.CSSProperties = {};
  
  // Note: We use inline styles here for simplicity, but in a real app 
  // you might use styled-components, CSS modules, or Tailwind.
  // For hover states, a generic solution in raw React is tricky without CSS classes.
  // We will rely on simple classes for complex hover states if needed, 
  // but for now we apply the base styles directly.

  switch (variant) {
    case 'primary':
      variantStyle = {
        backgroundColor: 'var(--stone)',
        color: '#FFFFFF',
      };
      break;
    case 'secondary':
      variantStyle = {
        backgroundColor: 'transparent',
        color: 'var(--stone)',
        border: '1px solid var(--border-strong)',
      };
      break;
    case 'ghost':
      variantStyle = {
        backgroundColor: 'transparent',
        color: 'var(--sage)',
      };
      break;
    case 'destructive':
      variantStyle = {
        backgroundColor: 'var(--error)',
        color: '#FFFFFF',
      };
      break;
    case 'success':
      variantStyle = {
        backgroundColor: 'var(--success)',
        color: '#FFFFFF',
      };
      break;
  }

  // To properly handle hover in plain React without external CSS libraries,
  // we add mouse event handlers to simulate hover states, 
  // though using CSS classes would be cleaner.
  const [isHovered, setIsHovered] = React.useState(false);

  let hoverStyle: React.CSSProperties = {};
  if (isHovered && !props.disabled) {
    if (variant === 'primary') hoverStyle = { backgroundColor: 'var(--stone-hover)' };
    if (variant === 'secondary') hoverStyle = { backgroundColor: 'var(--surface-sunken)' };
    if (variant === 'ghost') hoverStyle = { color: 'var(--stone)' };
    if (variant === 'destructive') hoverStyle = { backgroundColor: 'var(--error-hover)' };
    if (variant === 'success') hoverStyle = { backgroundColor: 'var(--success)' }; // You can define --success-hover if needed, but for now just keep it or slightly alter
  }

  return (
    <button
      style={{ ...baseStyle, ...sizeStyles[size], ...variantStyle, ...hoverStyle, ...style }}
      onMouseEnter={(e) => { setIsHovered(true); props.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setIsHovered(false); props.onMouseLeave?.(e); }}
      {...props}
    >
      {children}
    </button>
  );
};
