import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BubbleButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const BubbleButton = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false,
  type = 'button',
}: BubbleButtonProps) => {
  const shouldReduceMotion = Boolean(useReducedMotion());

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
      type={type}
      className={cn(
        baseClasses[variant],
        sizeClasses[size],
        className,
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled && !shouldReduceMotion ? { scale: 1.05, y: -2 } : undefined}
      whileTap={!disabled && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
    >
      {children}
    </motion.button>
  );
};

export default BubbleButton;
