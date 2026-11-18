import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Switch } from '@/components/ui/switch';

interface FooterProps {
  showMascot?: boolean;
  onToggleMascot?: (show: boolean) => void;
}

const Footer = ({ showMascot = true, onToggleMascot }: FooterProps) => {
  const { isRTL, language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <footer
      className={`relative z-10 border-t border-white/10 bg-background/45 backdrop-blur-md pt-10 pb-24 lg:pb-12 px-4 sm:px-6 ${
        isRTL ? 'rtl' : ''
      }`}
    >
      <div className="bv-container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Warm Brand Copy & Clean Links */}
        <div className={`space-y-3 text-center ${isRTL ? 'sm:text-right' : 'sm:text-left'}`}>
          <p className="text-foreground/90 text-sm sm:text-base font-medium leading-relaxed">
            {isAr
              ? 'نصنع حكايات مصورة تخلي طفلك بطل عالمه الصغير، باسمه وملامحه الحقيقية.'
              : 'Handcrafted personalized storybooks where your child leads every magical page.'}
          </p>

          <nav
            aria-label={isAr ? 'روابط التذييل' : 'Footer navigation'}
            className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground ${
              isRTL ? 'sm:justify-start' : 'sm:justify-start'
            }`}
          >
            <Link
              to="/stories"
              className="py-1 hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
            >
              {isAr ? 'مكتبة القصص' : 'Story Catalog'}
            </Link>
            <Link
              to="/merch"
              className="py-1 hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
            >
              {isAr ? (
                <>
                  متجر منتجات بابل وكورة <bdi dir="ltr">Bub</bdi>
                </>
              ) : (
                'Bub Merch Store'
              )}
            </Link>
            <Link
              to="/club"
              className="py-1 hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
            >
              {isAr ? 'نادي أعياد الميلاد والهدايا المجانية' : 'Birthday Club & Freebies'}
            </Link>
            <Link
              to="/schools"
              className="py-1 text-muted-foreground/85 hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
            >
              {isAr ? 'للمدارس والحضانات' : 'For Schools & Nurseries'}
            </Link>
            <Link
              to="/track"
              className="py-1 hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
            >
              {isAr ? 'تتبع طلبك' : 'Track Order'}
            </Link>
            <Link
              to="/admin"
              className="py-1 text-muted-foreground/65 hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
            >
              {isAr ? 'بوابة الإدارة' : 'Admin Studio'}
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground/70">
            {isAr
              ? '© 2026 بابل فيرس — كل حكاية بتتعمل بحب.'
              : '© 2026 Bubbleverse — Every story crafted with wonder.'}
          </p>
        </div>

        {/* Bub Visibility Toggle */}
        {onToggleMascot && (
          <div className="flex justify-center sm:justify-end shrink-0">
            <label className="glass-card-inner px-4 py-2.5 flex items-center gap-3 cursor-pointer min-h-[44px] border-white/12 hover:border-primary/30">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <span className="text-xs sm:text-sm text-foreground/85 font-medium select-none">
                {isAr ? 'إظهار باب' : 'Show Bub'}
              </span>
              <Switch
                checked={showMascot}
                onCheckedChange={onToggleMascot}
                aria-label={isAr ? 'إظهار أو إخفاء باب' : 'Toggle Bub companion'}
                className="data-[state=checked]:bg-primary"
              />
            </label>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
