import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const GlassCard = ({ children, className = '', delay = 0 }: GlassCardProps) => {
  return (
    <motion.div
      className={`glass-card p-6 ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.3 }
      }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
