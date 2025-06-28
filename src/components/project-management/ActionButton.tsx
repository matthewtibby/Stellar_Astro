import React from 'react';
import { Button } from '@/src/components/ui/button';

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'secondary' | 'outline';
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, label, loading, disabled, variant = 'default', className }) => (
  <Button
    onClick={onClick}
    disabled={disabled || loading}
    variant={variant}
    className={`w-full flex items-center space-x-2 ${className || ''}`}
  >
    {icon}
    <span>{loading ? `${label}...` : label}</span>
  </Button>
);

export default ActionButton; 