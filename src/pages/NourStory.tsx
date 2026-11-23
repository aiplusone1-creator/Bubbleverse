import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { DigitalBookPreview } from '@/components/studio/DigitalBookPreview';
import { Button } from '@/components/ui/button';
import { renderDigitalBookPdf } from '@/features/pdf/digitalBookRenderer';
import { triggerBlobDownload } from '@/features/pdf/kdpCanvasRenderer';
import { createNourBook } from '@/features/studio/nourBook';
import { useLanguage } from '@/hooks/useLanguage';

const book = createNourBook(true);

export default function NourStory() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [selected, setSelected] = useState(-1);
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  async function download() {
    setDownloading(true);
    setFailed(false);
    try {
      triggerBlobDownload(await renderDigitalBookPdf(book), 'nour-library-train.pdf');
    } catch {
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#101527] px-4 py-6 text-white sm:py-9">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap justify-between gap-3">
          <Button asChild variant="ghost" className="min-h-11">
            <Link to="/stories"><BackIcon className="me-2 size-4" />{isAr ? 'الرجوع للقصص' : 'Back to stories'}</Link>
          </Button>
          <Button onClick={() => void download()} disabled={downloading} className="min-h-11 bg-cyan-200 text-slate-950 hover:bg-cyan-100">
            <Download className="me-2 size-4" />{downloading ? (isAr ? 'جاري التجهيز…' : 'Preparing…') : (isAr ? 'نزّل القصة PDF' : 'Download story PDF')}
          </Button>
        </div>
        <div className="space-y-2 text-center">
          <h1 lang="ar" dir="rtl" className="text-3xl font-bold sm:text-5xl">{book.title}</h1>
          <p className="text-sm text-cyan-200">{isAr ? 'قصة مصوّرة بالعربي · ٦ مشاهد' : 'Illustrated Arabic story · 6 scenes'}</p>
        </div>
        {failed && <p role="alert" className="rounded-lg border border-red-300/40 p-3 text-red-100">
          {isAr ? 'تعذّر تجهيز الملف. جرّب تاني.' : 'Could not prepare the PDF. Try again.'}
        </p>}
        <DigitalBookPreview book={book} selected={selected} onSelect={setSelected} isAr={isAr} />
      </div>
    </main>
  );
}
