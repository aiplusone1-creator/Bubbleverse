import { useLanguage } from '@/hooks/useLanguage';
import { Textarea } from '@/components/ui/textarea';

interface CustomPlotInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CustomPlotInput({ value, onChange }: CustomPlotInputProps) {
  const { t } = useLanguage();
  return (
    <label className="block space-y-2">
      <span>{t('customPlot')}</span>
      <Textarea value={value} onChange={event => onChange(event.target.value)} maxLength={3000} rows={5} className="text-base" />
    </label>
  );
}
