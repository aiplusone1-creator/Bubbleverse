import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useTheme } from 'next-themes';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const GlassCard = ({ children, className = '', delay = 0 }: GlassCardProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.div
      className={`p-6 rounded-2xl border backdrop-blur-xl ${className}`}
      style={{
        background: isDark 
          ? 'hsla(240, 20%, 15%, 0.6)' 
          : 'hsla(0, 0%, 100%, 0.85)',
        borderColor: isDark 
          ? 'hsla(190, 100%, 70%, 0.2)' 
          : 'hsla(190, 100%, 40%, 0.3)',
        boxShadow: isDark
          ? '0 8px 32px hsla(0, 0%, 0%, 0.3), inset 0 1px 0 hsla(190, 100%, 70%, 0.1)'
          : '0 8px 32px hsla(190, 100%, 30%, 0.15), inset 0 1px 0 hsla(0, 0%, 100%, 0.5)',
      }}
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
