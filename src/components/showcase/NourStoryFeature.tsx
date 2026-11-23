import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { visual } from '@/features/showcase/siteArtwork';

export default function NourStoryFeature() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  return (
    <section className="bv-container relative px-4 py-8 sm:py-12">
      <Link to="/stories/nour-library-train/read"
        className="group mx-auto grid max-w-4xl grid-cols-[minmax(100px,1fr)_minmax(0,2fr)] overflow-hidden rounded-2xl border border-white/15 bg-[#171a30] text-white hover:border-cyan-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">
        <img src={visual('nour-train-station')} alt={isAr ? 'نور عند قطار المكتبة على شاطئ البحر' : 'Nour boarding a seaside library train'}
          width={512} height={512} loading="lazy" className="h-full max-h-56 w-full object-cover" />
        <div className="self-center space-y-2 p-4 sm:p-7">
          <p className="text-xs font-semibold text-cyan-200 sm:text-sm">{isAr ? 'قصة عربية للقراءة' : 'Read a complete Arabic story'}</p>
          <h2 className="text-lg font-bold sm:text-3xl">{isAr ? 'نور والقطار اللي نسي طريقه' : 'Nour and the Train That Lost Its Way'}</h2>
          <span className="inline-block text-sm font-semibold text-purple-200 group-hover:underline">{isAr ? 'اقرأ القصة' : 'Open the story'}</span>
        </div>
      </Link>
    </section>
  );
}
