import type { BookArt, StudioBook } from './bookProduction';
import { visual } from '../showcase/siteArtwork.ts';

export const NOUR_BOOK_ID = 'nour-library-train-v1';
const sceneArtwork = [
  'nour-train-station', 'nour-train-fog', 'nour-train-map',
  'nour-train-bell', 'nour-train-bridge', 'nour-train-books',
].map(visual);

const story = [
  {
    title: 'آخر قطار عند البحر',
    text: 'كان البحر يلمع وراء المحطة لما سمعت نور صفّارة قصيرة. نادت السائقة عمّة سلمى: «طالعة أوصّل كتب لقرية الجبل. تيجي تساعديني؟». طلعت نور وهي ماسكة شنطتها بحماس.',
    alt: 'نور تصعد إلى قطار المكتبة التركوازي على رصيف محطة على البحر عند الغروب.',
  },
  {
    title: 'طريقين في الضباب',
    text: 'بعد أول تلّة، غطّى الضباب القضبان. وقّفت عمّة سلمى القطار عند التحويلة. قدّامهم طريقان، واللافتة الخشب وقعت على جنبها. سألت نور: «أمال نعرف طريق القرية إزاي؟».',
    alt: 'نور والسائقة في الكابينة تنظران إلى القضبان المتفرعة وسط الضباب.',
  },
  {
    title: 'تلات نجوم صغيرة',
    text: 'وقفت نور على الرصيف وفردت خريطة الطريق. جنب قرية الجبل شافت تلات نجوم. ولما رفعت راسها، شافت نفس النجوم محفورة في عمود قديم، عند السكة اللي بتطلّع الجبل.',
    alt: 'نور تمسك خريطة على الرصيف وتلاحظ ثلاث نجوم على عمود خشبي.',
  },
  {
    title: 'رنّة في الضباب',
    text: 'جنب العمود كان فيه جرس نحاس. شدّت نور الحبل، فرنّ الجرس مرتين. من بعيد ردّ عليهم جرس تاني. رفعت نور الراية لعمّة سلمى وقالت: «أنا سمعتهم! القرية من الناحية دي».',
    alt: 'نور على الرصيف بجوار جرس نحاسي ترفع راية إشارة لسائقة القطار.',
  },
  {
    title: 'الجسر فوق البحر',
    text: 'اتحرّك القطار ببطء فوق جسر حجري. خفّ الضباب، وبانت بيوت القرية منوّرة فوق الميّه. عدّت نور الشبابيك المضيئة وهي مستنية تشوف مين هيستقبلهم.',
    alt: 'قطار المكتبة يعبر جسرًا حجريًا مقوسًا فوق البحر متجهًا نحو قرية مضيئة.',
  },
  {
    title: 'كتاب لكل واحد',
    text: 'على الرصيف كان الأطفال مستنيينهم. ناولت نور أول كتاب لولد واقف قدّامها. سألها: «هنبدأ الحكاية إمتى؟». قعدت نور جنبهم وفتحت الكتاب. «دلوقتي».',
    alt: 'نور توزّع كتبًا ملوّنة على أطفال القرية عند وصول القطار.',
  },
] as const;

export function getNourSceneArt(index: number): BookArt {
  const url = sceneArtwork[index];
  if (!url) throw new RangeError('Unknown Nour scene');
  return { url };
}

export function createNourBook(complete = false): StudioBook {
  return {
    id: NOUR_BOOK_ID,
    title: 'نور والقطار اللي نسي طريقه',
    coverTitle: 'نور والقطار\nاللي نسي طريقه',
    language: 'ar',
    childName: 'نور',
    revision: 0,
    started: complete,
    approvedRevision: complete ? 0 : null,
    scenes: story.map((scene, index) => ({
      ...scene,
      id: `scene-${index + 1}`,
      art: complete ? getNourSceneArt(index) : null,
      status: complete ? 'ready' : 'pending',
    })),
  };
}
