import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-12 px-4 text-center border-t border-border/30">
      <p className="text-muted-foreground text-sm">
        {t('footerText')}
      </p>
    </footer>
  );
};

export default Footer;
