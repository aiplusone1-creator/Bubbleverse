import { useLanguage } from '@/hooks/useLanguage';

export default function LanguageSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useLanguage();
  return (
    <label className="block space-y-2">
      <span className="block text-xl font-semibold">{t('summaryLanguage')}</span>
      <select className="h-11 w-full max-w-xs rounded-md border border-input bg-background px-3 text-base" value={value} onChange={event => onChange(event.target.value)}>
        <option value="">{t('notSelected')}</option>
        <option value="ar">{t('inquiryArabic')}</option>
        <option value="en">{t('inquiryEnglish')}</option>
      </select>
    </label>
  );
}
