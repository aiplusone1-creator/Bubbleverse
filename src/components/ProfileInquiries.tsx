import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StoryWizard from './StoryWizard';
import { useLanguage } from '@/hooks/useLanguage';
import { listStoryInquiries, resumeStoryInquiry } from '@/features/orders/orderService';
import type { StoryInquiryDetail } from '@/features/orders/orderService';
import { inquiryErrorKey, inquiryPrice, inquiryStatus } from '@/features/orders/inquiryPresentation';
import { readInquiryDraft, clearInquiryDraft } from '@/features/orders/inquiryDraft';

export default function ProfileInquiries({ ownerId }: { ownerId: string }) {
  const { t, language } = useLanguage();
  const client = useQueryClient();
  const [page, setPage] = useState<string[]>([]);
  const [draftOrder] = useState(() => {
    const draft = readInquiryDraft();
    return draft?.ownerId === ownerId ? draft.correctionId : undefined;
  });
  const [orderId, setOrderId] = useState(draftOrder);
  const [editing, setEditing] = useState(!!draftOrder);
  const before = page.at(-1);
  const listKey = ['story-inquiries', ownerId];
  const detailKey = ['story-inquiry', ownerId, orderId];
  const list = useQuery({ queryKey: [...listKey, before], queryFn: () => listStoryInquiries(before), retry: false });
  const detail = useQuery({ queryKey: detailKey, queryFn: () => resumeStoryInquiry(orderId!), enabled: !!orderId, retry: false });
  const feedback = (error: unknown, retry: () => void) => (
    <div className="space-y-2">
      <p role="alert">{t(inquiryErrorKey(error))}</p>
      {inquiryErrorKey(error) === 'inquirySignIn'
        ? <Link className="inline-flex min-h-11 items-center underline" to="/auth?return=inquiries&reauth=1">{t('signIn')}</Link>
        : <Button variant="outline" className="min-h-11" onClick={retry}>{t('inquiryRetry')}</Button>}
    </div>
  );

  if (orderId && editing && detail.data) {
    return <StoryWizard key={orderId} correction={detail.data}
      onBack={() => {
        if (readInquiryDraft()?.correctionId === orderId) clearInquiryDraft();
        setEditing(false);
      }}
      onCorrected={(updated: StoryInquiryDetail) => {
        client.setQueryData(detailKey, updated);
        void client.invalidateQueries({ queryKey: listKey });
        void client.invalidateQueries({ queryKey: detailKey });
        setEditing(false);
      }} />;
  }

  return (
    <section className="glass-card min-w-0 space-y-4 p-4 sm:p-6" aria-label={t('inquiryMyInquiries')}>
      <h2 className="font-editorial text-2xl">{t('inquiryMyInquiries')}</h2>
      {orderId ? (
        <>
          <Button variant="outline" className="min-h-11" onClick={() => setOrderId(undefined)}>{t('inquiryBackToList')}</Button>
          {detail.isPending && <p role="status">{t('inquiryLoading')}</p>}
          {detail.isError && feedback(detail.error, () => { void detail.refetch(); })}
          {!detail.isError && detail.data && (
            <div className="space-y-3 break-words">
              <p><bdi className="break-all font-semibold">{detail.data.reference}</bdi></p>
              <p>{inquiryStatus(detail.data.status, t)}</p>
              <p>{t('inquiryChildName')}: <bdi>{detail.data.childFirstName}</bdi></p>
              <p>{t(detail.data.country === 'EG' ? 'inquiryEgypt' : 'inquirySaudi')} · {t(detail.data.format === 'digital_pdf' ? 'inquiryDigital' : 'inquiryHardcopy')}</p>
              {detail.data.totalMinor != null && <p>{t('inquiryIndicativePrice')}: {inquiryPrice(detail.data.totalMinor, detail.data.currency, language)}</p>}
              {detail.data.correctionRequest && <p>{t('inquiryCorrectionRequest')}: <bdi>{detail.data.correctionRequest}</bdi></p>}
              {detail.data.story && (
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt>{t('summaryLanguage')}</dt><dd>{t(detail.data.language === 'ar' ? 'inquiryArabic' : 'inquiryEnglish')}</dd></div>
                  <div><dt>{t('summaryLength')}</dt><dd>{t('inquiryOption_' + detail.data.story.storyLength)}</dd></div>
                  <div><dt>{t('summaryFormat')}</dt><dd>{t('inquiryOption_' + detail.data.story.storyFormat)}</dd></div>
                  <div><dt>{t('summaryStyle')}</dt><dd>{detail.data.story.artStyle === 'custom' ? detail.data.story.customArtStyle : t('inquiryOption_' + detail.data.story.artStyle)}</dd></div>
                  <div><dt>{t('summaryCharacters')}</dt><dd>{detail.data.story.characters.map(character => character.name).join(', ')}</dd></div>
                  <div><dt>{t('summaryInterests')}</dt><dd>{detail.data.story.interests.join(', ') || t('noneSelected')}</dd></div>
                  {detail.data.story.plotMode === 'manual' && <div className="sm:col-span-2"><dt>{t('customPlot')}</dt><dd>{detail.data.story.customPlot}</dd></div>}
                </dl>
              )}
              {detail.data.editable && <Button className="min-h-11" onClick={() => setEditing(true)}>{t('inquiryEditCorrection')}</Button>}
            </div>
          )}
        </>
      ) : (
        <>
          {list.isPending && <p role="status">{t('inquiryLoading')}</p>}
          {list.isError && feedback(list.error, () => { void list.refetch(); })}
          {!list.isError && list.data && (
            <>
              {list.data.length === 0 ? <p>{t('inquiryEmpty')}</p> : (
                <ul className="space-y-2">
                  {list.data.map(item => (
                    <li key={item.id} className="rounded-xl border border-border/70">
                      <button type="button" className="min-h-11 w-full rounded-xl p-3 text-start focus-visible:outline focus-visible:outline-primary" onClick={() => setOrderId(item.id)}>
                        <bdi className="block break-all font-medium">{item.reference}</bdi>
                        <span className="text-sm text-muted-foreground">{inquiryStatus(item.status, t)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {list.data.length === 50 && <Button variant="outline" className="min-h-11" onClick={() => setPage([...page, list.data[49].created_at])}>{t('inquiryOlder')}</Button>}
            </>
          )}
          {page.length > 0 && <Button variant="outline" className="min-h-11" onClick={() => setPage(page.slice(0, -1))}>{t('previous')}</Button>}
        </>
      )}
    </section>
  );
}
