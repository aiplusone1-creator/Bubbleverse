import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface BubbleButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const BubbleButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick, 
  className = '',
  disabled = false
}: BubbleButtonProps) => {
  const baseClasses = {
    primary: 'bubble-button',
    secondary: 'bubble-button-secondary',
    outline: 'bubble-button-outline',
  };

  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-8 py-4 text-lg',
    lg: 'px-10 py-5 text-xl',
  };

  return (
    <motion.button
      className={`${baseClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.button>
  );
};

export default BubbleButton;
