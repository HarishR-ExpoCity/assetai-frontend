import React from 'react';
import { cn } from '@/lib/utils';

interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: string;
  filled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  icon,
  filled = false,
  size = 'md',
  weight = 400,
  grade = 0,
  opticalSize = 20,
  className,
  style,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[16px]',
    md: 'text-[20px]',
    lg: 'text-[24px]',
    xl: 'text-[36px]',
  };

  const fontSize = typeof size === 'number' ? `${size}px` : undefined;
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : '';

  return (
    <span
      className={cn(
        'material-symbols-rounded select-none',
        sizeClass,
        className
      )}
      style={{
        fontSize,
        fontVariationSettings: `'FILL' ${
          filled ? 1 : 0
        }, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
        ...style,
      }}
      {...props}
    >
      {icon}
    </span>
  );
};
