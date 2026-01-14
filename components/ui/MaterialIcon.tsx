'use client';

import { CSSProperties } from 'react';
import clsx from 'clsx';

interface MaterialIconProps {
  name: string;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  filled?: boolean;
}

export function MaterialIcon({ 
  name, 
  size = 24, 
  className = '', 
  style = {},
  filled = false 
}: MaterialIconProps) {
  const iconStyle: CSSProperties = {
    fontSize: typeof size === 'number' ? `${size}px` : size,
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
    ...style,
  };

  return (
    <span
      className={clsx(
        filled ? 'material-symbols-rounded' : 'material-symbols-outlined',
        className
      )}
      style={iconStyle}
    >
      {name}
    </span>
  );
}

