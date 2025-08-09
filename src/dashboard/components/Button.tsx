import React from 'react';

interface ButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Button({ 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  title,
  className = '',
  children 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    purple: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    gray: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';

  const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={allClasses}
    >
      {children}
    </button>
  );
}

// Convenience components for common use cases
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="secondary" />
);

export const SuccessButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="success" />
);

export const DangerButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="danger" />
);

export const PurpleButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="purple" />
);