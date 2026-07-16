import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  containerStyle?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  helperText, 
  error, 
  style, 
  ...props 
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Border logic based on state
  let borderColor = 'var(--border-default)';
  if (isHovered && !props.disabled) borderColor = 'var(--border-strong)';
  if (isFocused && !props.disabled) borderColor = 'var(--border-focus)';
  if (error) borderColor = 'var(--error)';

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface-sunken)',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${borderColor}`,
    padding: '10px 14px',
    fontSize: '15px',
    color: 'var(--stone)',
    width: '100%',
    fontFamily: 'inherit',
    outline: 'none',
    boxShadow: 'none',
    transition: 'border-color 0.2s',
    opacity: props.disabled ? 0.35 : 1,
    ...style,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '1rem', ...props.containerStyle }}>
      {label && (
        <label style={{ 
          fontSize: '12px', 
          fontWeight: 500, 
          color: 'var(--sage)', 
          marginBottom: '6px' 
        }}>
          {label}
        </label>
      )}
      <input
        style={inputStyle}
        onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
        onMouseEnter={(e) => { setIsHovered(true); props.onMouseEnter?.(e); }}
        onMouseLeave={(e) => { setIsHovered(false); props.onMouseLeave?.(e); }}
        {...props}
      />
      {helperText && (
        <span style={{ 
          fontSize: '11px', 
          marginTop: '4px', 
          color: error ? 'var(--error)' : 'var(--sage)' 
        }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
