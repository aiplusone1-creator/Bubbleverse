import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Check, Download, Pencil, Settings2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DigitalBookPreview } from '@/components/studio/DigitalBookPreview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/hooks/useLanguage';
import { getOrders, getStudioDraft, listStudioDrafts, saveStudioDraft, type OrderRecord } from '@/lib/localStore';
import { getPhotoFromVault } from '@/lib/photoVault';
import { DEFAULT_STORY_FALLBACK_IMAGES } from '@/features/studio/stage2PromptEngine';
import { bookFromStudioDraft, canApproveBook, MAX_SCENE_TEXT, reviseBookScene, type StudioBook } from '@/features/studio/bookProduction';
import { readProducedBook, saveProducedBook } from '@/features/studio/bookProductionStore';
import { createNourBook, getNourSceneArt, NOUR_BOOK_ID } from '@/features/studio/nourBook';
import { createOrderStoryDraft } from '@/features/studio/orderStoryDraft';
import { loadBookArtwork, renderDigitalBookPdf, verifyDigitalBook } from '@/features/pdf/digitalBookRenderer';
import { triggerBlobDownload } from '@/features/pdf/kdpCanvasRenderer';

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getSafeDraftArt(url: string): boolean {
  return !DEFAULT_STORY_FALLBACK_IMAGES.includes(url) &&
    (/^\/(?!\/)/.test(url) || /^https:\/\//.test(url) || /^data:image\/(jpeg|png|webp);base64,/.test(url));
}

function readIllustration(file: File): Promise<string> {
  if (!imageTypes.has(file.type) || file.size > 8 * 1024 * 1024) {
    return Promise.reject(new Error('BOOK_IMAGE_FORMAT'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('BOOK_ART_UNAVAILABLE'));
    reader.onerror = () => reject(new Error('BOOK_ART_UNAVAILABLE'));
    reader.readAsDataURL(file);
  });
}

function bookError(error: unknown, isAr: boolean): string {
  const code = error instanceof Error ? error.message : '';
  switch (code) {
    case 'BOOK_CHANGED':
      return isAr ? 'الكتاب اتعدّل في تبويب تاني. افتح أحدث نسخة.' : 'The book changed in another tab. Open the latest version.';
    case 'BOOK_TEXT_OVERFLOW':
      return isAr ? 'في نص أطول من مساحة الصفحة. اختصره وجرّب تاني.' : 'Some text is too long for its page. Shorten it and try again.';
    case 'BOOK_IMAGE_FORMAT':
      return isAr ? 'اختار رسمة JPG أو PNG أو WebP أقل من ٨ ميجابايت.' : 'Choose a JPG, PNG or WebP illustration up to 8 MB.';
    case 'BOOK_ART_UNAVAILABLE':
      return isAr ? 'في رسمة تعذّر فتحها. جرّب إعادة تجهيزها أو استبدالها.' : 'An illustration could not be loaded. Retry or replace it.';
    default:
      return isAr ? 'تعذّر إكمال العملية. جرّب تاني.' : 'The operation could not finish. Try again.';
  }
}

export default function AdminBookProduction() {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const isAr = language === 'ar';
  const orderId = params.get('orderId');
  const draftParam = params.get('draft');
  const order = orderId ? getOrders().find((item) => item.id === orderId || item.reference === orderId) : undefined;
  const draftKey = draftParam ?? order?.id ?? orderId;
  const bookId = draftKey ? `draft:${draftKey}` : NOUR_BOOK_ID;
  return (
    <AdminLayout>
      <BookWorkspace key={bookId} bookId={bookId} draftKey={draftKey} order={order} isAr={isAr} />
    </AdminLayout>
  );
}

interface WorkspaceProps {
  bookId: string;
  draftKey: string | null;
  order?: OrderRecord;
  isAr: boolean;
}

function BookWorkspace({ bookId, draftKey, order, isAr }: WorkspaceProps) {
  const [book, setBook] = useState<StudioBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(0);
  const [editText, setEditText] = useState<string | null>(null);
  const sample = !draftKey;
  const orderId = order?.id;
  const reference = order?.reference;
  const editUrl = orderId
    ? `/admin/studio/advanced?orderId=${encodeURIComponent(orderId)}`
    : draftKey ? `/admin/studio/advanced?draft=${encodeURIComponent(draftKey)}` : '/admin/studio/advanced';
  const draft = draftKey ? getStudioDraft(draftKey) : null;

  useEffect(() => {
    let active = true;
    void readProducedBook(bookId).then(async (saved) => {
      const source = draftKey ? getStudioDraft(draftKey) : null;
      const initial = saved ?? (source
        ? await bookFromStudioDraft(source, getPhotoFromVault, getSafeDraftArt)
        : draftKey ? null : createNourBook());
      if (active) setBook(initial);
    }).catch((cause) => {
      if (active) setError(bookError(cause, isAr));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [bookId, draftKey, isAr]);

  useEffect(() => {
    if (!sample || !book?.started) return;
    const index = book.scenes.findIndex((scene) => scene.status === 'pending');
    if (index < 0) return;
    let active = true;
    const art = getNourSceneArt(index);
    const sceneId = book.scenes[index].id;
    void (async () => {
      let ready = true;
      try { await loadBookArtwork(art); } catch { ready = false; }
      if (!active) return;
      const next = reviseBookScene(book, sceneId, { status: ready ? 'ready' : 'failed', art: ready ? art : null });
      await saveProducedBook(next, book);
      if (active) setBook(next);
    })().catch((cause) => {
      if (active) setError(bookError(cause, isAr));
    });
    return () => { active = false; };
  }, [book, isAr, sample]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try { await action(); } catch (cause) { setError(bookError(cause, isAr)); }
    finally { setBusy(false); }
  }

  async function commit(next: StudioBook) {
    const saved = await readProducedBook(next.id);
    if (saved && (!book || saved.revision !== book.revision || saved.approvedRevision !== book.approvedRevision)) {
      throw new Error('BOOK_CHANGED');
    }
    await saveProducedBook(next, saved ?? undefined);
    setBook(next);
  }

  const scene = book?.scenes[selected];
  const ready = book?.scenes.filter((page) => page.status === 'ready').length ?? 0;
  const failed = book?.scenes.filter((page) => page.status === 'failed') ?? [];
  const preparing = Boolean(sample && book?.started && book.scenes.some((page) => page.status === 'pending'));
  const approved = Boolean(book && book.approvedRevision === book.revision);
  const label = (ar: string, en: string) => isAr ? ar : en;

  async function replaceArtwork(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !book || !scene) return;
    await run(async () => {
      const art = { url: await readIllustration(file) };
      await loadBookArtwork(art);
      await commit(reviseBookScene(book, scene.id, { art, status: 'ready' }));
      setMessage(label('تم حفظ الرسمة. راجع النسخة قبل الاعتماد.', 'Illustration saved. Review the book before approving it.'));
    });
  }

  async function importDraft() {
    if (!draft) return;
    await run(async () => {
      const imported = await bookFromStudioDraft(draft, getPhotoFromVault, getSafeDraftArt);
      await commit({ ...imported, revision: (book?.revision ?? 0) + 1 });
      setSelected(0);
      setEditText(null);
      setMessage(label('تم استيراد أحدث مسودة.', 'Latest draft imported.'));
    });
  }

  async function prepareOrder() {
    if (!order) return;
    await run(async () => {
      const created = getStudioDraft(order.id) ?? createOrderStoryDraft(order);
      if (!created) throw new Error('BOOK_ORDER_HAS_NO_STORY');
      const draft = saveStudioDraft(created);
      if (getStudioDraft(draft.key)?.updatedAt !== draft.updatedAt) throw new Error('BOOK_SAVE_FAILED');
      await commit(await bookFromStudioDraft(draft, getPhotoFromVault, getSafeDraftArt));
      setMessage(label('النص جاهز للمراجعة. أضف الرسومات قبل الاعتماد.', 'The draft text is ready. Add illustrations before approving the book.'));
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cyan-200">{reference ?? label('استوديو القصص', 'Story Studio')}</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-white sm:text-4xl" lang={book?.language}>
            {book?.title ?? label('إنتاج الكتاب', 'Book production')}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {draftKey && <Button asChild variant="outline" className="border-white/20 bg-white/5">
            <Link to="/admin/studio">{label('رجوع للاستوديو', 'Back to Studio')}</Link>
          </Button>}
          <Button asChild variant="outline" className="border-white/20 bg-white/5">
            <Link to={editUrl}><Settings2 className="me-2 size-4" />{label('أدوات الإنتاج المتقدمة', 'Advanced production tools')}</Link>
          </Button>
        </div>
      </div>

      {error && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-400/35 bg-red-950/40 p-4" role="alert">
        <p>{error}</p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>{label('إعادة فتح الكتاب', 'Reopen book')}</Button>
      </div>}
      {loading && <p role="status">{label('بنفتح الكتاب…', 'Opening the book…')}</p>}
      {!loading && !book && !error && (
        <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold">{label('الطلب لسه مفيهوش مسودة كتاب', 'This order has no book draft yet')}</h2>
          {order?.items.some((item) => item.itemType !== 'merch') && (
            <Button type="button" disabled={busy} onClick={() => void prepareOrder()}>
              {label('جهّز مسودة القصة من الطلب', 'Prepare story draft from order')}
            </Button>
          )}
        </section>
      )}

      {book && <>
        <ol className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm" aria-label={label('مراحل تجهيز الكتاب', 'Book production stages')}>
          {[
            label('تجهيز الكتاب', 'Prepare book'),
            label('المراجعة', 'Review'),
            label('التصدير', 'Export'),
          ].map((stage, index) => {
            const current = index === (approved ? 2 : canApproveBook(book) ? 1 : 0);
            return <li key={stage} aria-current={current ? 'step' : undefined}
              className={`rounded-xl border p-3 ${current ? 'border-purple-300/60 bg-purple-400/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
              {stage}
            </li>;
          })}
        </ol>
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(245px,300px)_minmax(0,1fr)]">
          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#15192b] p-4 sm:p-5">
            <div>
              <h2 className="font-bold">{sample ? label('كتاب تجريبي', 'Sample book') : label('نسخة الكتاب الرقمية', 'Digital book')}</h2>
              {sample && <p className="mt-1 text-sm text-slate-300">
                {label('قصة خيالية كاملة برسومات جاهزة للتجهيز في الاستوديو.', 'A complete fictional story with prepared artwork.')}
              </p>}
            </div>
            <p role="status" className="rounded-lg bg-cyan-200/10 px-3 py-2 text-sm text-cyan-100">
              {preparing ? label('جاري تجهيز المشاهد', 'Preparing scenes') : label('المشاهد الجاهزة', 'Ready scenes')} · {ready} / {book.scenes.length}
            </p>
            {failed.length > 0 && <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
              <p>{label('مشاهد تحتاج رسمة', 'Scenes that need an illustration')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {failed.map((page) => (
                  <Button key={page.id} type="button" size="sm" variant="outline" className="border-amber-300/30 bg-transparent"
                    onClick={() => { setSelected(book.scenes.indexOf(page)); setEditText(null); }}>
                    {page.title}
                  </Button>
                ))}
              </div>
            </div>}
            <div className="grid gap-2">
              {sample && !book.started && <Button disabled={busy} className="min-h-11 bg-cyan-200 text-slate-950 hover:bg-cyan-100"
                onClick={() => void run(() => commit({ ...book, started: true, revision: book.revision + 1 }))}>
                {label('ابدأ تجهيز الكتاب', 'Start preparing the book')}
              </Button>}
              {approved ? <Button disabled={busy} className="min-h-11 bg-cyan-200 text-slate-950 hover:bg-cyan-100"
                onClick={() => void run(async () => {
                  const stored = await readProducedBook(book.id);
                  if (!stored || stored.revision !== book.revision || stored.approvedRevision !== book.revision) throw new Error('BOOK_CHANGED');
                  triggerBlobDownload(await renderDigitalBookPdf(stored), sample ? 'nour-library-train.pdf' : 'bubbleverse-story.pdf');
                })}>
                <Download className="me-2 size-4" />{label('نزّل PDF', 'Download PDF')}
              </Button> : book.started && <Button disabled={busy || !canApproveBook(book)} className="min-h-11 bg-cyan-200 text-slate-950 hover:bg-cyan-100"
                onClick={() => void run(async () => {
                  await verifyDigitalBook(book);
                  await commit({ ...book, approvedRevision: book.revision });
                  setMessage(label('تم اعتماد النسخة للتصدير.', 'This version is approved for export.'));
                })}>
                <Check className="me-2 size-4" />{label('اعتمد الكتاب', 'Approve book')}
              </Button>}
              {draft && <Button type="button" disabled={busy} variant="outline" className="min-h-11 border-white/20 bg-white/5" onClick={() => void importDraft()}>
                {label('استيراد أحدث مسودة من الأدوات المتقدمة', 'Import latest advanced draft')}
              </Button>}
              {orderId && <Button asChild variant="outline" className="min-h-11 border-white/20 bg-white/5">
                <Link to={`/admin/pdf-builder?orderId=${encodeURIComponent(orderId)}`}>{label('إعدادات طباعة KDP', 'KDP print settings')}</Link>
              </Button>}
            </div>
            {busy && <p role="status" className="text-sm text-slate-300">{label('لحظة واحدة…', 'Working…')}</p>}
            {message && <p role="status" className="text-sm text-emerald-200">{message}</p>}
          </section>
          <div className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-[#15192b] p-3 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold"><BookOpen className="size-4 text-purple-300" />{label('معاينة الكتاب', 'Book preview')}</h2>
              <Button type="button" variant="ghost" disabled={selected < 0} className="min-h-11" onClick={() => { setSelected(-1); setEditText(null); }}>
                {label('عرض الغلاف', 'Show cover')}
              </Button>
            </div>
            {book.started ? <DigitalBookPreview book={book} selected={selected} isAr={isAr}
              onSelect={(index) => { setSelected(index); setEditText(null); }} />
              : <p className="rounded-lg border border-dashed border-white/20 p-8 text-slate-300">
                {label('معاينة الكتاب هتظهر هنا بعد بدء التجهيز.', 'The book preview appears when preparation starts.')}
              </p>}
            {scene && book.started && !preparing && <div className="flex flex-wrap items-start gap-2 border-t border-white/10 pt-4">
              <Button type="button" disabled={busy} variant="outline" className="min-h-11 border-white/20 bg-white/5"
                onClick={() => setEditText(scene.text)}>
                <Pencil className="me-2 size-4" />{label('عدّل نص المشهد', 'Edit scene text')}
              </Button>
              <label className={`relative inline-flex min-h-11 items-center rounded-md border border-white/20 bg-white/5 px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-cyan-200 ${busy ? 'opacity-50' : 'cursor-pointer'}`}>
                {label('استبدل رسمة المشهد', 'Replace scene illustration')}
                <input type="file" className="sr-only" disabled={busy} accept="image/jpeg,image/png,image/webp" onChange={(event) => void replaceArtwork(event)} />
              </label>
              {sample && scene.status === 'failed' && <Button type="button" disabled={busy} variant="secondary" className="min-h-11"
                onClick={() => void run(() => commit(reviseBookScene(book, scene.id, { status: 'pending' })))}>
                {label('أعد تجهيز المشهد', 'Retry this scene')}
              </Button>}
            </div>}
            {scene && editText !== null && <form className="space-y-2" onSubmit={(event) => {
              event.preventDefault();
              if (!editText.trim()) return;
              void run(async () => {
                await commit(reviseBookScene(book, scene.id, { text: editText.trim() }));
                setEditText(null);
              });
            }}>
              <label htmlFor="production-scene-text">{label('نص المشهد', 'Scene text')}</label>
              <Textarea id="production-scene-text" dir={book.language === 'ar' ? 'rtl' : 'ltr'} value={editText}
                onChange={(event) => setEditText(event.target.value)} maxLength={MAX_SCENE_TEXT} rows={4} />
              <div className="flex gap-2">
                <Button disabled={busy || !editText.trim()} type="submit">{label('احفظ النص', 'Save text')}</Button>
                <Button type="button" variant="ghost" onClick={() => setEditText(null)}>{label('إلغاء', 'Cancel')}</Button>
              </div>
            </form>}
          </div>
        </div>
      </>}
      {sample && <DraftLinks isAr={isAr} />}
    </div>
  );
}

function DraftLinks({ isAr }: { isAr: boolean }) {
  const drafts = listStudioDrafts().filter((draft) => draft.pages.length > 0 && draft.storyTitle.trim());
  if (!drafts.length) return null;
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <h2 className="font-bold">{isAr ? 'مسوداتك المحفوظة' : 'Your saved drafts'}</h2>
      <ul className="flex flex-wrap gap-2">
        {drafts.map((draft) => <li key={draft.key}>
          <Button asChild variant="outline" className="max-w-full border-white/20 bg-white/5">
            <Link to={`/admin/studio?draft=${encodeURIComponent(draft.key)}`}>{draft.storyTitle}</Link>
          </Button>
        </li>)}
      </ul>
    </section>
  );
}
