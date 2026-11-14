import type { StoryInquiryDetail, OrderQuote } from './orderService';

export function inquiryErrorKey(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  if (['PGRST301', 'PGRST302', 'PGRST303'].includes(code) || (error as { status?: number } | null)?.status === 401) return 'inquirySignIn';
  if (code === '42501') return 'inquiryDenied';
  if (code === 'PT404') return 'inquiryMissing';
  if (code === 'PT409') return 'inquiryConflict';
  if (['22023', '22P02'].includes(code) || code.startsWith('23')) return 'inquiryInvalid';
  return 'inquiryUnavailable';
}

export function inquiryPrice(amount: number, currency: OrderQuote['currency'], language: string) {
  return new Intl.NumberFormat(language, { style: 'currency', currency }).format(amount / 100);
}

export function inquiryStatus(value: string, t: (key: string) => string) {
  const key = 'inquiryStatus_' + value;
  const label = t(key);
  return label === key ? t('inquiryStatusUnknown') : label;
}

export function correctionInput(detail: StoryInquiryDetail) {
  return {
    storyLength: detail.story?.storyLength ?? 'medium',
    format: detail.story?.storyFormat ?? 'storyboard',
    artStyle: detail.story?.artStyle ?? 'disney',
    customArtStyle: detail.story?.customArtStyle ?? '',
    language: detail.language,
    characters: detail.story?.characters.map((character, index) => ({ ...character, id: String(index) })) ?? [],
    interests: detail.story?.interests ?? [],
    plotMode: detail.story?.plotMode ?? 'auto',
    customPlot: detail.story?.customPlot ?? '',
  };
}
