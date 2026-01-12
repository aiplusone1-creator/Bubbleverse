import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';

interface FooterProps {
  showMascot?: boolean;
  onToggleMascot?: (show: boolean) => void;
}

const Footer = ({ showMascot = true, onToggleMascot }: FooterProps) => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="py-12 px-4 border-t border-border/30">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm text-center sm:text-left">
          {t('footerText')}
        </p>
        
        {/* Mascot Toggle */}
        {onToggleMascot && (
          <div 
            className={`glass-card px-4 py-2 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">{t('showBub')}</span>
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
