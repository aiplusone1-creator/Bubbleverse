import { useLanguage } from '@/hooks/useLanguage';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';

interface FooterProps {
  showMascot?: boolean;
  onToggleMascot?: (show: boolean) => void;
}

const Footer = ({ showMascot = true, onToggleMascot }: FooterProps) => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className={`py-12 px-4 border-t border-border/40 ${isRTL ? 'rtl' : ''}`}>
      <div className={`max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <p className={`text-muted-foreground text-xs sm:text-sm text-center ${isRTL ? 'sm:text-right' : 'sm:text-left'} leading-relaxed font-normal`}>
          {t('footerText')}
        </p>
        
        {/* Mascot Toggle */}
        {onToggleMascot && (
          <div 
            className={`glass-card px-3.5 py-1.5 sm:px-4 sm:py-2 flex items-center gap-3 border-border/50 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">{t('showBub')}</span>
            <Switch
              checked={showMascot}
              onCheckedChange={onToggleMascot}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
