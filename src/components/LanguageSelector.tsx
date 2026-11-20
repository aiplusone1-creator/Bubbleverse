import { useLanguage } from '@/hooks/useLanguage';
import { LiquidSelect } from '@/components/ui/LiquidSelect';

export default function LanguageSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="block space-y-2">
      <span className="block text-xl font-semibold">{t('summaryLanguage')}</span>
      <LiquidSelect
        value={value || '__none__'}
        onChange={(val) => onChange(val === '__none__' ? '' : val)}
        options={[
          { value: '__none__', label: t('notSelected') },
          { value: 'ar', label: t('inquiryArabic') },
          { value: 'en', label: t('inquiryEnglish') },
        ]}
        placeholder={t('notSelected')}
        className="max-w-xs text-base h-11"
      />
    </div>
  );
}
