import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { renderDigitalBookSheet } from '@/features/pdf/digitalBookRenderer';
import { listBookSheets, type BookSheet, type StudioBook } from '@/features/studio/bookProduction';

function PreviewSheet({ book, sheet, isAr }: { book: StudioBook; sheet: BookSheet; isAr: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<{ sheet: BookSheet; revision: number; ok: boolean }>();
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    void renderDigitalBookSheet(canvas, book, sheet, 760).then(
      () => { if (active) setResult({ sheet, revision: book.revision, ok: true }); },
      () => { if (active) setResult({ sheet, revision: book.revision, ok: false }); },
    );
    return () => { active = false; };
  }, [book, sheet]);

  const current = result?.sheet === sheet && result.revision === book.revision;
  const visible = current && result.ok;
  const text = sheet.kind === 'cover'
    ? book.title
    : sheet.kind === 'text' ? `${sheet.scene.title}. ${sheet.scene.text}` : sheet.scene.alt;
  return (
    <div className="relative aspect-square min-w-0 overflow-hidden bg-slate-900">
      {visible && text && <p className="sr-only" lang={book.language}>{text}</p>}
      <canvas ref={canvasRef} aria-hidden="true" className={`w-full h-full ${visible ? '' : 'invisible'}`} />
      {!visible && (
        <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-slate-300">
          {current
            ? sheet.kind === 'text'
              ? (isAr ? 'راجع طول نص المشهد' : 'Check the scene text length')
              : (isAr ? 'الرسمة لسه مش جاهزة' : 'Illustration unavailable')
            : (isAr ? 'تحميل الصفحة…' : 'Loading page…')}
        </p>
      )}
    </div>
  );
}

interface PreviewProps {
  book: StudioBook;
  selected: number;
  onSelect: (selected: number) => void;
  isAr: boolean;
}

export function DigitalBookPreview({ book, selected, onSelect, isAr }: PreviewProps) {
  const sheets = listBookSheets(book);
  const pair = selected < 0 ? sheets.slice(0, 1) : sheets.slice(selected * 2 + 1, selected * 2 + 3);
  const numeral = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en');
  const current = numeral.format(selected + 1);
  const total = numeral.format(book.scenes.length);
  const range = selected < 0 ? (isAr ? 'الغلاف' : 'Cover')
    : isAr ? `مشهد ${current} من ${total}` : `Scene ${current} of ${total}`;

  if (!pair.length) return null;
  return (
    <section className="min-w-0 space-y-4" aria-label={isAr ? 'معاينة الكتاب' : 'Book preview'}>
      <div
        dir={book.language === 'ar' ? 'rtl' : 'ltr'}
        className={`grid overflow-hidden rounded-xl border border-white/10 shadow-xl ${pair.length === 1 ? 'max-w-[25rem] mx-auto' : 'sm:grid-cols-2'}`}
      >
        {pair.map((sheet) => (
          <PreviewSheet key={`${sheet.kind}-${sheet.scene.id}-${book.revision}`} book={book} sheet={sheet} isAr={isAr} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" className="min-h-11 border-white/20 bg-white/5 text-white" disabled={selected < 0} onClick={() => onSelect(selected - 1)}>
          {isAr ? 'السابق' : 'Previous'}
        </Button>
        <span role="status" className="text-sm text-slate-300 tabular-nums">{range}</span>
        <Button variant="outline" className="min-h-11 border-white/20 bg-white/5 text-white" disabled={selected >= book.scenes.length - 1} onClick={() => onSelect(selected + 1)}>
          {isAr ? 'التالي' : 'Next'}
        </Button>
      </div>
    </section>
  );
}
