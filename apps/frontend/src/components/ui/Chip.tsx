import React from 'react';

type ChipType = 'filter' | 'status';
type StatusVariant = 'published' | 'draft' | 'archived' | 'removed' | 'present' | 'absent' | 'completed';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: ChipType;
  status?: StatusVariant;
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ 
  children, 
  type = 'filter', 
  status, 
  active = false,
  style, 
  ...props 
}) => {
  let chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.2s',
    ...style,
  };

  if (type === 'filter') {
    chipStyle = {
      ...chipStyle,
      padding: '4px 12px',
      fontSize: '13px',
      border: '1px solid var(--border-default)',
      backgroundColor: active ? 'var(--stone)' : 'transparent',
      color: active ? '#FFFFFF' : 'var(--sage)',
      cursor: 'pointer',
    };
  } else if (type === 'status') {
    chipStyle = {
      ...chipStyle,
      padding: '3px 10px',
      fontSize: '11px',
      fontWeight: 500,
    };
    
    // Status variants mapping (using custom ZenGrid colors)
    // 'present', 'published' -> Success
    // 'draft' -> Warning
    // 'absent', 'removed' -> Error
    // 'archived', 'completed' -> Info
    if (status === 'published' || status === 'present') {
      chipStyle.backgroundColor = 'rgba(101, 163, 13, 0.08)'; // Success 8%
      chipStyle.color = 'var(--success)';
    } else if (status === 'draft') {
      chipStyle.backgroundColor = 'rgba(202, 138, 4, 0.08)'; // Warning 8%
      chipStyle.color = 'var(--warning)';
    } else if (status === 'removed' || status === 'absent') {
      chipStyle.backgroundColor = 'rgba(220, 38, 38, 0.08)'; // Error 8%
      chipStyle.color = 'var(--error)';
    } else if (status === 'archived' || status === 'completed') {
      chipStyle.backgroundColor = 'rgba(168, 162, 158, 0.15)'; // Sage 15%
      chipStyle.color = 'var(--stone)';
    } else {
      chipStyle.backgroundColor = 'rgba(168, 162, 158, 0.15)';
      chipStyle.color = 'var(--stone)';
    }
  }

  return (
    <span style={chipStyle} {...props}>
      {children}
    </span>
  );
};
