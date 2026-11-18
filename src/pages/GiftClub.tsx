import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Cake,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Gift,
  Heart,
  MessageCircle,
  Palette,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { useMascotVisibility } from '@/hooks/useMascotVisibility';
import {
  generateReferralCode,
  saveBirthdayClubLead,
} from '@/lib/localStore';

type HeroTraitKey = 'courage' | 'kindness' | 'cleverness' | 'creativity';

interface HeroTraitConfig {
  key: HeroTraitKey;
  labelAr: string;
  labelEn: string;
  badgeAr: string;
  badgeEn: string;
  captionAr: string;
  captionEn: string;
  accentHex: string;
  icon: typeof Shield;
}

const HERO_TRAITS: HeroTraitConfig[] = [
  {
    key: 'courage',
    labelAr: 'الشجاعة',
    labelEn: 'Courage',
    badgeAr: 'القوة الخارقة: بطل الشجاعة',
    badgeEn: 'Superpower: Champion of Courage',
    captionAr: 'لقلبه الشجاع واستعداده لخوض كل مغامرة بثقة وابتسامة',
    captionEn: 'For a brave heart ready to face every adventure with wonder and confidence',
    accentHex: '#00D9FF',
    icon: Shield,
  },
  {
    key: 'kindness',
    labelAr: 'اللطف',
    labelEn: 'Kindness',
    badgeAr: 'القوة الخارقة: بطل اللطف',
    badgeEn: 'Superpower: Champion of Kindness',
    captionAr: 'لقلبه الحنون الذي ينشر الدفء والمحبة في كل مكان يذهب إليه',
    captionEn: 'For a warm, generous heart that brings joy and care to everyone around',
    accentHex: '#F472B6',
    icon: Heart,
  },
  {
    key: 'cleverness',
    labelAr: 'الذكاء',
    labelEn: 'Cleverness',
    badgeAr: 'القوة الخارقة: بطل الذكاء',
    badgeEn: 'Superpower: Champion of Cleverness',
    captionAr: 'لعقله اللامع وفضوله الجميل وشغفه باكتشاف أسرار الكون',
    captionEn: 'For a bright curious mind always eager to explore, ask, and discover',
    accentHex: '#A78BFA',
    icon: Sparkles,
  },
  {
    key: 'creativity',
    labelAr: 'الإبداع',
    labelEn: 'Creativity',
    badgeAr: 'القوة الخارقة: بطل الإبداع',
    badgeEn: 'Superpower: Champion of Creativity',
    captionAr: 'لخياله الواسع وقدرته الساحرة على ابتكار عوالم مليئة بالألوان',
    captionEn: 'For a boundless imagination that turns everyday moments into colorful worlds',
    accentHex: '#FBBF24',
    icon: Palette,
  },
];

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1700;
const BDAY_PROMO_CODE = 'BDAY15';
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFivePointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  fillStyle: string | CanvasGradient
) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function drawFourPointSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx + size * 0.16, cy - size * 0.16, cx + size, cy);
  ctx.quadraticCurveTo(cx + size * 0.16, cy + size * 0.16, cx, cy + size);
  ctx.quadraticCurveTo(cx - size * 0.16, cy + size * 0.16, cx - size, cy);
  ctx.quadraticCurveTo(cx - size * 0.16, cy - size * 0.16, cx, cy - size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawIridescentBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  tintA: string,
  tintB: string
) {
  ctx.save();
  const bodyGrad = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.32,
    r * 0.08,
    cx,
    cy,
    r
  );
  bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
  bodyGrad.addColorStop(0.55, tintA);
  bodyGrad.addColorStop(0.88, tintB);
  bodyGrad.addColorStop(1, 'rgba(255, 255, 255, 0.34)');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.stroke();

  // Upper-left specular highlight arc
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.76, Math.PI * 1.12, Math.PI * 1.48);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = Math.max(3, r * 0.07);
  ctx.lineCap = 'round';
  ctx.stroke();

  // Tiny glint dot
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.42, Math.max(3, r * 0.08), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fill();
  ctx.restore();
}

function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: number,
  flipY: number,
  goldStroke: CanvasGradient
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX, flipY);
  ctx.strokeStyle = goldStroke;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 74);
  ctx.lineTo(0, 12);
  ctx.quadraticCurveTo(0, 0, 12, 0);
  ctx.lineTo(74, 0);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(16, 56);
  ctx.lineTo(16, 22);
  ctx.quadraticCurveTo(16, 16, 22, 16);
  ctx.lineTo(56, 16);
  ctx.stroke();

  drawFourPointSparkle(ctx, 28, 28, 12, '#FDE68A', 0.92);
  ctx.restore();
}

function renderHeroCertificate(
  canvas: HTMLCanvasElement,
  params: {
    childName: string;
    trait: HeroTraitConfig;
    certLang: 'ar' | 'en';
  }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { childName, trait, certLang } = params;
  const isCertAr = certLang === 'ar';
  const displayName =
    childName.trim() || (isCertAr ? 'بطلنا الصغير' : 'Little Hero');

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. Midnight Magic Deep Cosmic Background
  const bgGrad = ctx.createRadialGradient(
    CANVAS_WIDTH * 0.5,
    CANVAS_HEIGHT * 0.32,
    120,
    CANVAS_WIDTH * 0.5,
    CANVAS_HEIGHT * 0.5,
    CANVAS_WIDTH * 0.78
  );
  bgGrad.addColorStop(0, '#172047');
  bgGrad.addColorStop(0.52, '#0d1430');
  bgGrad.addColorStop(1, '#070b1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Soft ambient nebula glows (cyan, purple, pink, warm gold)
  const glows: Array<[number, number, number, string]> = [
    [320, 260, 560, 'rgba(0, 217, 255, 0.14)'],
    [2080, 280, 580, 'rgba(244, 114, 182, 0.14)'],
    [1200, 1460, 680, 'rgba(167, 139, 250, 0.15)'],
    [1200, 680, 520, 'rgba(251, 191, 36, 0.08)'],
  ];
  for (const [gx, gy, gr, color] of glows) {
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // 2. Iridescent Bubbles (peripheral framing, never crowding typography)
  drawIridescentBubble(ctx, 215, 310, 82, 'rgba(0, 217, 255, 0.12)', 'rgba(167, 139, 250, 0.22)');
  drawIridescentBubble(ctx, 310, 445, 38, 'rgba(244, 114, 182, 0.14)', 'rgba(0, 217, 255, 0.20)');
  drawIridescentBubble(ctx, 2175, 325, 92, 'rgba(244, 114, 182, 0.12)', 'rgba(167, 139, 250, 0.22)');
  drawIridescentBubble(ctx, 2065, 470, 40, 'rgba(0, 217, 255, 0.15)', 'rgba(251, 191, 36, 0.18)');
  drawIridescentBubble(ctx, 250, 1390, 70, 'rgba(167, 139, 250, 0.12)', 'rgba(0, 217, 255, 0.20)');
  drawIridescentBubble(ctx, 2150, 1365, 76, 'rgba(251, 191, 36, 0.10)', 'rgba(244, 114, 182, 0.20)');

  // 3. Starfield & Sparkles
  const sparkles: Array<[number, number, number, string, number]> = [
    [430, 225, 18, '#FDE68A', 0.9],
    [1960, 220, 18, '#FDE68A', 0.9],
    [610, 310, 11, '#7DD3FC', 0.75],
    [1790, 305, 11, '#F9A8D4', 0.75],
    [355, 845, 15, '#FDE68A', 0.7],
    [2045, 845, 15, '#FDE68A', 0.7],
    [470, 1210, 12, '#7DD3FC', 0.65],
    [1930, 1210, 12, '#F9A8D4', 0.65],
    [820, 200, 10, '#FFFFFF', 0.6],
    [1580, 200, 10, '#FFFFFF', 0.6],
  ];
  for (const [sx, sy, ss, sc, sa] of sparkles) {
    drawFourPointSparkle(ctx, sx, sy, ss, sc, sa);
  }

  // Subtle background dots
  const starDots: Array<[number, number, number]> = [
    [520, 240, 3],
    [710, 195, 2.5],
    [1690, 195, 2.5],
    [1880, 245, 3],
    [290, 620, 3],
    [2110, 620, 3],
    [310, 1060, 2.5],
    [2090, 1060, 2.5],
    [640, 1480, 2.5],
    [1760, 1480, 2.5],
  ];
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (const [dx, dy, dr] of starDots) {
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Metallic Gold Certificate Borders
  const goldGrad = ctx.createLinearGradient(80, 80, CANVAS_WIDTH - 80, CANVAS_HEIGHT - 80);
  goldGrad.addColorStop(0, '#FEF08A');
  goldGrad.addColorStop(0.28, '#F59E0B');
  goldGrad.addColorStop(0.55, '#FDE68A');
  goldGrad.addColorStop(0.8, '#D97706');
  goldGrad.addColorStop(1, '#FEF08A');

  // Outer Frame
  ctx.save();
  drawRoundedRectPath(ctx, 72, 72, CANVAS_WIDTH - 144, CANVAS_HEIGHT - 144, 48);
  ctx.lineWidth = 8;
  ctx.strokeStyle = goldGrad;
  ctx.stroke();

  // Inner Hairline Frame
  drawRoundedRectPath(ctx, 104, 104, CANVAS_WIDTH - 208, CANVAS_HEIGHT - 208, 34);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
  ctx.stroke();

  // Soft Inner Cyan Aura Hairline
  drawRoundedRectPath(ctx, 122, 122, CANVAS_WIDTH - 244, CANVAS_HEIGHT - 244, 26);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.25)';
  ctx.stroke();
  ctx.restore();

  // Four Ornate Corner Flourishes
  drawCornerFlourish(ctx, 138, 138, 1, 1, goldGrad);
  drawCornerFlourish(ctx, CANVAS_WIDTH - 138, 138, -1, 1, goldGrad);
  drawCornerFlourish(ctx, 138, CANVAS_HEIGHT - 138, 1, -1, goldGrad);
  drawCornerFlourish(ctx, CANVAS_WIDTH - 138, CANVAS_HEIGHT - 138, -1, -1, goldGrad);

  // Set typography direction cleanly for AR / EN
  ctx.direction = isCertAr ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 5. Top Brand Crest & Medallion
  const brandPillW = 460;
  const brandPillH = 68;
  const brandPillX = (CANVAS_WIDTH - brandPillW) / 2;
  const brandPillY = 178;

  ctx.save();
  drawRoundedRectPath(ctx, brandPillX, brandPillY, brandPillW, brandPillH, 34);
  ctx.fillStyle = 'rgba(15, 23, 52, 0.85)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = goldGrad;
  ctx.stroke();
  ctx.restore();

  drawFivePointStar(ctx, brandPillX + 44, brandPillY + brandPillH / 2, 16, 7, goldGrad);
  drawFivePointStar(
    ctx,
    brandPillX + brandPillW - 44,
    brandPillY + brandPillH / 2,
    16,
    7,
    goldGrad
  );

  ctx.fillStyle = '#FDE68A';
  ctx.font = isCertAr
    ? '700 32px "Baloo Bhaijaan 2", "Tajawal", sans-serif'
    : '700 30px "Fredoka", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    isCertAr ? 'عالم بابل فيرس للقصص' : 'BUBBLEVERSE STORY STUDIO',
    CANVAS_WIDTH / 2,
    brandPillY + brandPillH / 2 + 2
  );

  // 6. Main Certificate Title
  const titleGrad = ctx.createLinearGradient(420, 320, CANVAS_WIDTH - 420, 410);
  titleGrad.addColorStop(0, '#FEF9C3');
  titleGrad.addColorStop(0.5, '#FDE047');
  titleGrad.addColorStop(1, '#F59E0B');

  ctx.save();
  ctx.shadowColor = 'rgba(251, 191, 36, 0.35)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = titleGrad;
  ctx.font = isCertAr
    ? '800 84px "Baloo Bhaijaan 2", "Tajawal", sans-serif'
    : '800 68px "Fredoka", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    isCertAr
      ? 'شهادة بطل بابل فيرس المعتمد'
      : 'Official Bubbleverse Little Hero Certificate',
    CANVAS_WIDTH / 2,
    365
  );
  ctx.restore();

  // Ornate divider beneath title
  ctx.save();
  const divGrad = ctx.createLinearGradient(520, 445, CANVAS_WIDTH - 520, 445);
  divGrad.addColorStop(0, 'rgba(253, 230, 138, 0)');
  divGrad.addColorStop(0.35, 'rgba(0, 217, 255, 0.7)');
  divGrad.addColorStop(0.5, 'rgba(253, 230, 138, 1)');
  divGrad.addColorStop(0.65, 'rgba(244, 114, 182, 0.7)');
  divGrad.addColorStop(1, 'rgba(253, 230, 138, 0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(520, 445);
  ctx.lineTo(CANVAS_WIDTH - 520, 445);
  ctx.stroke();
  drawFivePointStar(ctx, CANVAS_WIDTH / 2, 445, 22, 9, goldGrad);
  ctx.restore();

  // 7. Presentation Line
  ctx.fillStyle = '#CBD5E1';
  ctx.font = isCertAr
    ? '500 38px "Tajawal", "Baloo Bhaijaan 2", sans-serif'
    : '500 34px "Plus Jakarta Sans", "Fredoka", sans-serif';
  ctx.fillText(
    isCertAr
      ? 'تُمنح هذه الشهادة بكل فخر وتقدير إلى البطل الصغير'
      : 'Proudly presented with wonder and admiration to',
    CANVAS_WIDTH / 2,
    542
  );

  // 8. Child's Hero Name (Auto-fitted so long names never clip)
  let nameFontSize = isCertAr ? 136 : 124;
  const maxNameWidth = 1760;
  const nameFontFamily = isCertAr
    ? '"Baloo Bhaijaan 2", "Tajawal", sans-serif'
    : '"Fredoka", "Plus Jakarta Sans", sans-serif';

  ctx.font = `800 ${nameFontSize}px ${nameFontFamily}`;
  while (ctx.measureText(displayName).width > maxNameWidth && nameFontSize > 62) {
    nameFontSize -= 6;
    ctx.font = `800 ${nameFontSize}px ${nameFontFamily}`;
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0, 217, 255, 0.42)';
  ctx.shadowBlur = 32;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(displayName, CANVAS_WIDTH / 2, 700);
  ctx.restore();

  // Golden underline flourish under Child's Name
  const measuredNameW = Math.min(Math.max(ctx.measureText(displayName).width + 180, 560), 1500);
  ctx.save();
  const nameLineGrad = ctx.createLinearGradient(
    CANVAS_WIDTH / 2 - measuredNameW / 2,
    798,
    CANVAS_WIDTH / 2 + measuredNameW / 2,
    798
  );
  nameLineGrad.addColorStop(0, 'rgba(0, 217, 255, 0)');
  nameLineGrad.addColorStop(0.25, '#00D9FF');
  nameLineGrad.addColorStop(0.5, '#FDE68A');
  nameLineGrad.addColorStop(0.75, '#F472B6');
  nameLineGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
  ctx.strokeStyle = nameLineGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2 - measuredNameW / 2, 798);
  ctx.lineTo(CANVAS_WIDTH / 2 + measuredNameW / 2, 798);
  ctx.stroke();
  ctx.restore();

  // 9. Superpower / Trait Badge Pill
  const badgeText = isCertAr ? trait.badgeAr : trait.badgeEn;
  ctx.font = isCertAr
    ? '700 42px "Baloo Bhaijaan 2", "Tajawal", sans-serif'
    : '700 38px "Fredoka", "Plus Jakarta Sans", sans-serif';
  const badgeTextW = ctx.measureText(badgeText).width;
  const badgeW = Math.min(Math.max(badgeTextW + 170, 620), 1460);
  const badgeH = 98;
  const badgeX = (CANVAS_WIDTH - badgeW) / 2;
  const badgeY = 864;

  ctx.save();
  drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 49);
  const badgeFill = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
  badgeFill.addColorStop(0, 'rgba(0, 217, 255, 0.16)');
  badgeFill.addColorStop(0.5, 'rgba(167, 139, 250, 0.22)');
  badgeFill.addColorStop(1, 'rgba(244, 114, 182, 0.16)');
  ctx.fillStyle = badgeFill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = trait.accentHex;
  ctx.stroke();
  ctx.restore();

  drawFivePointStar(ctx, badgeX + 54, badgeY + badgeH / 2, 18, 8, trait.accentHex);
  drawFivePointStar(ctx, badgeX + badgeW - 54, badgeY + badgeH / 2, 18, 8, trait.accentHex);

  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(badgeText, CANVAS_WIDTH / 2, badgeY + badgeH / 2 + 2);

  // Trait Affirmation Caption
  ctx.fillStyle = '#E2E8F0';
  ctx.font = isCertAr
    ? '500 36px "Tajawal", "Baloo Bhaijaan 2", sans-serif'
    : '500 32px "Plus Jakarta Sans", "Fredoka", sans-serif';
  ctx.fillText(
    isCertAr ? trait.captionAr : trait.captionEn,
    CANVAS_WIDTH / 2,
    1045
  );

  // 10. Bottom Metadata Row: Date | Golden Official Seal | Studio Signature
  const footerY = 1365;
  const formattedDate = new Intl.DateTimeFormat(isCertAr ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const dateColX = isCertAr ? 1820 : 580;
  const sigColX = isCertAr ? 580 : 1820;

  // Date Column
  ctx.fillStyle = '#94A3B8';
  ctx.font = isCertAr
    ? '600 28px "Tajawal", sans-serif'
    : '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(isCertAr ? 'تاريخ المنح' : 'DATE AWARDED', dateColX, footerY - 56);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = isCertAr
    ? '700 34px "Tajawal", sans-serif'
    : '700 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(formattedDate, dateColX, footerY + 2);

  ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dateColX - 210, footerY + 46);
  ctx.lineTo(dateColX + 210, footerY + 46);
  ctx.stroke();

  // Signature Column
  ctx.fillStyle = '#94A3B8';
  ctx.font = isCertAr
    ? '600 28px "Tajawal", sans-serif'
    : '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(isCertAr ? 'توقيع الاستوديو' : 'SIGNED WITH MAGIC', sigColX, footerY - 56);

  ctx.fillStyle = '#7DD3FC';
  ctx.font = isCertAr
    ? '700 36px "Baloo Bhaijaan 2", "Tajawal", sans-serif'
    : 'italic 700 36px "Plus Jakarta Sans", "Fredoka", sans-serif';
  ctx.fillText(
    isCertAr ? 'فريق حكايات بابل فيرس' : 'Bubbleverse Storytellers',
    sigColX,
    footerY + 2
  );

  ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sigColX - 210, footerY + 46);
  ctx.lineTo(sigColX + 210, footerY + 46);
  ctx.stroke();

  // Center Official Golden Seal
  const sealX = CANVAS_WIDTH / 2;
  const sealY = footerY - 8;

  ctx.save();
  // Ribbon tails behind seal
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.moveTo(sealX - 66, sealY + 70);
  ctx.lineTo(sealX - 102, sealY + 185);
  ctx.lineTo(sealX - 48, sealY + 158);
  ctx.lineTo(sealX - 18, sealY + 190);
  ctx.lineTo(sealX - 8, sealY + 75);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#9333EA';
  ctx.beginPath();
  ctx.moveTo(sealX + 66, sealY + 70);
  ctx.lineTo(sealX + 102, sealY + 185);
  ctx.lineTo(sealX + 48, sealY + 158);
  ctx.lineTo(sealX + 18, sealY + 190);
  ctx.lineTo(sealX + 8, sealY + 75);
  ctx.closePath();
  ctx.fill();

  // Scalloped outer gold medallion
  const scallops = 24;
  ctx.beginPath();
  for (let i = 0; i < scallops * 2; i++) {
    const angle = (Math.PI / scallops) * i;
    const rad = i % 2 === 0 ? 116 : 102;
    const px = sealX + Math.cos(angle) * rad;
    const py = sealY + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const sealGrad = ctx.createRadialGradient(sealX - 25, sealY - 25, 10, sealX, sealY, 118);
  sealGrad.addColorStop(0, '#FEF08A');
  sealGrad.addColorStop(0.55, '#F59E0B');
  sealGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = sealGrad;
  ctx.fill();

  // Inner seal ring
  ctx.beginPath();
  ctx.arc(sealX, sealY, 84, 0, Math.PI * 2);
  ctx.fillStyle = '#111936';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FDE68A';
  ctx.stroke();

  drawFivePointStar(ctx, sealX, sealY - 14, 34, 15, goldGrad);

  ctx.fillStyle = '#FEF08A';
  ctx.font = isCertAr
    ? '700 22px "Tajawal", sans-serif'
    : '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(isCertAr ? 'بطل معتمد' : 'CERTIFIED HERO', sealX, sealY + 42);
  ctx.restore();
}

export default function GiftClub() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());
  const { showMascot, setShowMascot } = useMascotVisibility();

  // Certificate Studio State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [certLangOverride, setCertLangOverride] = useState<'ar' | 'en' | null>(null);
  const certLang: 'ar' | 'en' = certLangOverride ?? language;
  const [heroChildName, setHeroChildName] = useState('');
  const [selectedTraitKey, setSelectedTraitKey] = useState<HeroTraitKey>('courage');
  const [certParentName, setCertParentName] = useState('');
  const [certBirthday, setCertBirthday] = useState('');
  const [certWhatsapp, setCertWhatsapp] = useState('');
  const [certError, setCertError] = useState('');
  const [certDownloadedFor, setCertDownloadedFor] = useState<{
    name: string;
    unlockedPromo: boolean;
  } | null>(null);
  const [copiedCertPromo, setCopiedCertPromo] = useState(false);

  // Full Birthday Club Form State
  const [clubParentName, setClubParentName] = useState('');
  const [clubChildName, setClubChildName] = useState('');
  const [clubBirthday, setClubBirthday] = useState('');
  const [clubWhatsapp, setClubWhatsapp] = useState('');
  const [clubError, setClubError] = useState('');
  const [clubUnlocked, setClubUnlocked] = useState<{
    childName: string;
    code: string;
  } | null>(null);
  const [copiedClubPromo, setCopiedClubPromo] = useState(false);

  // Full Referral Hub Form State
  const [refParentName, setRefParentName] = useState('');
  const [refWhatsapp, setRefWhatsapp] = useState('');
  const [refError, setRefError] = useState('');
  const [refResult, setRefResult] = useState<{
    parentName: string;
    code: string;
  } | null>(null);
  const [copiedRefCode, setCopiedRefCode] = useState(false);

  const activeTrait =
    HERO_TRAITS.find((item) => item.key === selectedTraitKey) ?? HERO_TRAITS[0];

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderHeroCertificate(canvas, {
      childName: heroChildName,
      trait: activeTrait,
      certLang,
    });
  }, [heroChildName, activeTrait, certLang]);

  // Redraw live on every state change & once web fonts finish loading
  useEffect(() => {
    drawCanvas();
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) drawCanvas();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [drawCanvas]);

  const handleCopy = async (
    value: string,
    which: 'cert' | 'club' | 'ref'
  ) => {
    const ok = await copyTextToClipboard(value);
    if (!ok) {
      toast.error(
        isAr ? 'تعذر النسخ التلقائي — يرجى نسخ الكود يدوياً.' : 'Unable to copy automatically — please copy manually.',
        { id: `club-copy-err-${which}` }
      );
      return;
    }

    if (which === 'cert') {
      setCopiedCertPromo(true);
      window.setTimeout(() => setCopiedCertPromo(false), 2200);
    } else if (which === 'club') {
      setCopiedClubPromo(true);
      window.setTimeout(() => setCopiedClubPromo(false), 2200);
    } else {
      setCopiedRefCode(true);
      window.setTimeout(() => setCopiedRefCode(false), 2200);
    }

    toast.success(
      isAr ? `تم نسخ الكود ${value}` : `Copied ${value}`,
      { id: `club-copy-ok-${which}` }
    );
  };

  const handleDownloadCertificate = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = heroChildName.trim();
    if (!trimmedName) {
      setCertError(
        isAr
          ? 'يرجى كتابة اسم الطفل ليظهر على الشهادة قبل التحميل.'
          : 'Please enter your child’s name to personalize the certificate before downloading.'
      );
      return;
    }

    setCertError('');

    // Ensure canvas is completely up to date
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderHeroCertificate(canvas, {
      childName: trimmedName,
      trait: activeTrait,
      certLang,
    });

    // Save freebie lead cleanly for Admin CRM
    saveBirthdayClubLead({
      parentName: certParentName.trim(),
      whatsapp: certWhatsapp.trim(),
      childName: trimmedName,
      childBirthday: certBirthday.trim(),
      source: 'free_certificate',
    });

    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'hero';
    const fileName = `bubbleverse-hero-certificate-${slug}.png`;

    const triggerDownloadFromUrl = (url: string, shouldRevoke: boolean) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (shouldRevoke) {
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
    };

    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          triggerDownloadFromUrl(objectUrl, true);
        } else {
          triggerDownloadFromUrl(canvas.toDataURL('image/png'), false);
        }
      }, 'image/png');
    } else {
      triggerDownloadFromUrl(canvas.toDataURL('image/png'), false);
    }

    const hasContact = Boolean(certBirthday.trim() || certWhatsapp.trim());
    setCertDownloadedFor({
      name: trimmedName,
      unlockedPromo: hasContact,
    });

    toast.success(
      isAr
        ? `تم تحميل شهادة البطل ${trimmedName} بجودة عالية!`
        : `Downloaded ${trimmedName}’s HD Hero Certificate!`,
      { id: 'hero-cert-download' }
    );
  };

  const handleClubSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedChild = clubChildName.trim();
    const trimmedBirthday = clubBirthday.trim();
    const trimmedPhone = clubWhatsapp.trim();

    if (!trimmedChild) {
      setClubError(isAr ? 'يرجى كتابة اسم الطفل.' : 'Please enter your child’s name.');
      return;
    }
    if (!trimmedBirthday) {
      setClubError(isAr ? 'يرجى تحديد تاريخ الميلاد.' : 'Please choose your child’s birthday.');
      return;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 8) {
      setClubError(
        isAr
          ? 'يرجى إدخال رقم واتساب صحيح (8 أرقام على الأقل).'
          : 'Please enter a valid WhatsApp number (at least 8 digits).'
      );
      return;
    }

    setClubError('');
    saveBirthdayClubLead({
      parentName: clubParentName.trim(),
      whatsapp: trimmedPhone,
      childName: trimmedChild,
      childBirthday: trimmedBirthday,
      source: 'birthday_club',
    });

    setClubUnlocked({ childName: trimmedChild, code: BDAY_PROMO_CODE });
    toast.success(
      isAr
        ? `تم انضمام ${trimmedChild} لنادي أعياد الميلاد — كودك: ${BDAY_PROMO_CODE}`
        : `${trimmedChild} joined the Birthday Club — code: ${BDAY_PROMO_CODE}`,
      { id: 'club-bday-saved' }
    );
  };

  const handleReferralHubSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedParent = refParentName.trim();
    if (trimmedParent.length < 2) {
      setRefError(
        isAr ? 'يرجى كتابة اسمك لإنشاء كود الدعوة.' : 'Please enter your name to generate your code.'
      );
      return;
    }

    setRefError('');
    const code = generateReferralCode(trimmedParent);
    saveBirthdayClubLead({
      parentName: trimmedParent,
      whatsapp: refWhatsapp.trim(),
      childName: '',
      childBirthday: '',
      referralCode: code,
      source: 'referral',
    });

    setRefResult({ parentName: trimmedParent, code });
    toast.success(
      isAr ? `تم إنشاء كود الدعوة الخاص بك: ${code}` : `Created your invite code: ${code}`,
      { id: 'club-ref-saved' }
    );
  };

  const buildWhatsappInviteHref = (name: string, code: string) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bubbleverse.app';
    const message = isAr
      ? `أهلاً! أنا ${name} وحبيت أشارككم هدية مميزة من بابل فيرس — صمّموا قصة مصورة مطبوعة باسم وملامح طفلكم واحصلوا على خصم 15% على أول طلب بكود FRIEND15 (كود الدعوة الخاص بي: ${code}) ✨\n${siteUrl}/stories`
      : `Hi! ${name} here — wanted to share a special gift from Bubbleverse! Create a personalized illustrated storybook starring your child and save 15% with code FRIEND15 (my referral code: ${code}) ✨\n${siteUrl}/stories`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-x-hidden bg-background text-foreground"
    >
      <ImmersiveBackground />
      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="bv-container space-y-14 sm:space-y-20">
          {/* Page Hero Header */}
          <motion.section
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT }}
            className="text-center max-w-4xl mx-auto space-y-4"
          >
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/12 border border-amber-300/35 text-amber-200 text-xs sm:text-sm font-semibold">
              <Award className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? 'استوديو الهدايا المجانية ونادي العائلة' : 'Free Gift Studio & Family Rewards Club'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-editorial leading-tight text-white text-balance">
              {isAr ? (
                <>
                  صمّم شهادة بطل مجانية...{' '}
                  <span className="text-magical">وانضم لنادي الهدايا</span>
                </>
              ) : (
                <>
                  Create a Free Hero Certificate...{' '}
                  <span className="text-magical">& Join the Gift Club</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'هدية مجانية فورية تطبعها وتعلقها في غرفة طفلك بدقة طباعة عالية — مع خصم 15% في نادي أعياد الميلاد وبرنامج مشاركة الأصدقاء.'
                : 'Craft a crisp print-ready certificate for your little hero in seconds — plus unlock 15% off in our Birthday Club and Give 15% / Get 15% referral hub.'}
            </p>
          </motion.section>

          {/* SECTION 1: Interactive Free Hero Certificate Studio */}
          <section
            aria-labelledby="certificate-studio-heading"
            className="glass-card rounded-3xl p-5 sm:p-8 lg:p-10 border-amber-300/25 shadow-2xl space-y-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div className="space-y-1 text-start">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'مجانية 100% • تحميل فوري PNG' : '100% Free • Instant HD PNG Download'}</span>
                </span>
                <h2
                  id="certificate-studio-heading"
                  className="text-2xl sm:text-3xl font-extrabold font-editorial text-white"
                >
                  {isAr ? 'استوديو شهادة بطل بابل فيرس' : 'Bubbleverse Hero Certificate Studio'}
                </h2>
              </div>

              {/* Certificate Language Toggle */}
              <div
                role="group"
                aria-label={isAr ? 'لغة الشهادة' : 'Certificate language'}
                className="inline-flex items-center rounded-full bg-slate-950/75 border border-white/15 p-1"
              >
                <button
                  type="button"
                  onClick={() => setCertLangOverride('ar')}
                  aria-pressed={certLang === 'ar'}
                  className={`min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    certLang === 'ar'
                      ? 'bg-primary text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  شهادة بالعربية
                </button>
                <button
                  type="button"
                  onClick={() => setCertLangOverride('en')}
                  aria-pressed={certLang === 'en'}
                  className={`min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    certLang === 'en'
                      ? 'bg-primary text-slate-950 shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  English Certificate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
              {/* Left/Start: Controls Form */}
              <form
                onSubmit={handleDownloadCertificate}
                className="lg:col-span-5 space-y-5 text-start"
                noValidate
              >
                {/* Child Name */}
                <div className="space-y-2">
                  <Label htmlFor="cert-child-name" className="text-sm font-semibold text-white">
                    {isAr ? 'اسم البطل الصغير *' : 'Little Hero’s Name *'}
                  </Label>
                  <Input
                    id="cert-child-name"
                    value={heroChildName}
                    onChange={(e) => {
                      setHeroChildName(e.target.value);
                      if (certError) setCertError('');
                    }}
                    maxLength={40}
                    placeholder={isAr ? 'اكتب اسم طفلك هنا (مثال: زين)' : 'Type your child’s name (e.g. Zain)'}
                    className="min-h-[48px] bg-slate-950/85 border-white/20 rounded-2xl text-white text-base placeholder:text-slate-500"
                    required
                  />
                </div>

                {/* Superpower / Trait Selector */}
                <div className="space-y-2.5">
                  <span className="block text-sm font-semibold text-white">
                    {isAr ? 'اختر القوة الخارقة للطفل' : 'Choose Their Superpower'}
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {HERO_TRAITS.map((trait) => {
                      const TraitIcon = trait.icon;
                      const isSelected = trait.key === selectedTraitKey;
                      return (
                        <button
                          key={trait.key}
                          type="button"
                          onClick={() => setSelectedTraitKey(trait.key)}
                          aria-pressed={isSelected}
                          className={`min-h-[52px] px-3.5 py-2.5 rounded-2xl border text-start flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected
                              ? 'bg-primary/15 border-primary text-white shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                              : 'bg-slate-950/60 border-white/12 text-slate-300 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-primary/20 text-cyan-200' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            <TraitIcon className="w-5 h-5" aria-hidden="true" />
                          </span>
                          <span className="text-sm font-bold">
                            {isAr ? trait.labelAr : trait.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Birthday + WhatsApp for 15% Gift Reminder */}
                <div className="rounded-2xl bg-slate-950/55 border border-white/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-200">
                    <Gift className="w-4 h-4 text-pink-300 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr
                        ? 'اختياري: أضف عيد الميلاد والواتساب لفتح كود خصم 15%'
                        : 'Optional: Add Birthday & WhatsApp to unlock 15% off'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="cert-parent-name" className="text-xs text-slate-300">
                        {isAr ? 'اسم ولي الأمر (اختياري)' : 'Parent Name (optional)'}
                      </Label>
                      <Input
                        id="cert-parent-name"
                        value={certParentName}
                        onChange={(e) => setCertParentName(e.target.value)}
                        placeholder={isAr ? 'مثال: أم زين' : 'e.g. Sarah'}
                        className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm placeholder:text-slate-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="cert-birthday" className="text-xs text-slate-300">
                          {isAr ? 'تاريخ الميلاد (اختياري)' : 'Birthday (optional)'}
                        </Label>
                        <Input
                          id="cert-birthday"
                          type="date"
                          dir="ltr"
                          value={certBirthday}
                          onChange={(e) => setCertBirthday(e.target.value)}
                          className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric [color-scheme:dark]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="cert-whatsapp" className="text-xs text-slate-300">
                          {isAr ? 'رقم الواتساب (اختياري)' : 'WhatsApp (optional)'}
                        </Label>
                        <Input
                          id="cert-whatsapp"
                          type="tel"
                          dir="ltr"
                          value={certWhatsapp}
                          onChange={(e) => setCertWhatsapp(e.target.value)}
                          placeholder="+20 / +966 / +971"
                          className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {isAr
                        ? 'الشهادة تُصمّم محلياً على جهازك فوراً ولا نشارك بياناتك مع أي جهة خارجية.'
                        : 'Generated 100% in your browser with instant download — we never share your details.'}
                    </span>
                  </p>
                </div>

                {certError && (
                  <p role="alert" className="text-xs sm:text-sm text-rose-300 font-medium">
                    {certError}
                  </p>
                )}

                <button
                  type="submit"
                  className="bubble-btn bubble-btn-primary w-full min-h-[52px] px-6 text-sm sm:text-base font-extrabold gap-2.5 shadow-[0_0_28px_rgba(0,217,255,0.35)]"
                >
                  <Download className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr ? 'تحميل الشهادة الآن (PNG عالية الدقة)' : 'Download Certificate PNG (300 DPI)'}
                  </span>
                </button>

                {/* Persistent Inline Confirmation Banner */}
                {certDownloadedFor && (
                  <div
                    role="status"
                    className="rounded-2xl bg-emerald-950/35 border border-emerald-400/35 p-4 space-y-2.5"
                  >
                    <div className="flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? `تم تحميل شهادة ${certDownloadedFor.name} بنجاح!`
                          : `${certDownloadedFor.name}’s certificate has been downloaded!`}
                      </span>
                    </div>
                    {certDownloadedFor.unlockedPromo && (
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/80 border border-white/15 px-3 py-2">
                        <span className="text-xs text-slate-200">
                          {isAr ? 'هدية الخصم (15%): ' : 'Bonus 15% Code: '}
                          <strong dir="ltr" className="font-numeric text-cyan-300">
                            {BDAY_PROMO_CODE}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(BDAY_PROMO_CODE, 'cert')}
                          className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 text-xs font-bold"
                        >
                          {copiedCertPromo ? (
                            <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                          ) : (
                            <Copy className="w-4 h-4" aria-hidden="true" />
                          )}
                          <span>{copiedCertPromo ? (isAr ? 'نُسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Right/End: Live Canvas Preview + Printed Book Upsell */}
              <div className="lg:col-span-7 space-y-5">
                <div className="rounded-3xl p-3 sm:p-4 bg-slate-950/75 border border-white/15 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between gap-2 px-1 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-200">
                      <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'معاينة حية للشهادة' : 'Live Certificate Preview'}</span>
                    </span>
                    <span dir="ltr" className="font-numeric text-slate-400">
                      2400 × 1700 px • PNG
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-amber-300/30 bg-[#070b1a] shadow-[0_14px_44px_rgba(0,0,0,0.55)]">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      role="img"
                      aria-label={
                        isAr
                          ? `معاينة شهادة بطل بابل فيرس المعتمد باسم ${heroChildName.trim() || 'بطلنا الصغير'} وبصفة ${activeTrait.labelAr}`
                          : `Live preview of Official Bubbleverse Little Hero Certificate for ${heroChildName.trim() || 'Little Hero'} featuring ${activeTrait.labelEn}`
                      }
                      className="block w-full h-auto aspect-[24/17]"
                    />
                  </div>
                </div>

                {/* High-Converting Storybook Upsell Card */}
                <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-purple-950/50 via-slate-900/80 to-cyan-950/45 border border-cyan-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-start">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'الخطوة التالية لبطلك' : 'Take the Magic Further'}</span>
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold font-editorial text-white leading-snug">
                      {isAr
                        ? 'خلّي طفلك بطل قصة مطبوعة كاملة بملامحه الحقيقية'
                        : 'Turn your child into the star of a printed storybook with their real likeness'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {isAr
                        ? 'غلاف مقوى فاخر، مراجعة 100% لكل صفحة قبل الطباعة، وخصم 15% بكود BDAY15.'
                        : 'Heirloom hardcover printing, 100% page-by-page approval before print, and 15% off with code BDAY15.'}
                    </p>
                  </div>

                  <Link
                    to="/stories"
                    className="bubble-btn bubble-btn-secondary min-h-[48px] px-6 text-sm font-bold shrink-0 gap-2 w-full sm:w-auto"
                  >
                    <span>{isAr ? 'تصفح القصص الآن' : 'Explore Storybooks'}</span>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Full Birthday Club & Give 15%, Get 15% Referral Hub */}
          <section
            aria-labelledby="club-hub-heading"
            className="space-y-8"
          >
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <h2
                id="club-hub-heading"
                className="text-2xl sm:text-4xl font-extrabold font-editorial text-white"
              >
                {isAr ? (
                  <>
                    نادي أعياد الميلاد{' '}
                    <span className="text-magical">ومكافآت الأصدقاء</span>
                  </>
                ) : (
                  <>
                    Birthday Club &{' '}
                    <span className="text-magical">Friend Rewards Hub</span>
                  </>
                )}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                {isAr
                  ? 'استفد من خصم 15% فوري لعيد ميلاد طفلك أو شارك كود الدعوة مع أصدقائك على واتساب.'
                  : 'Claim an instant 15% Birthday Club savings code or share your personal WhatsApp invite with friends.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
              {/* Full Birthday Club Card */}
              <div
                id="birthday-club"
                className="glass-card rounded-3xl p-6 sm:p-8 border-pink-400/25 flex flex-col justify-between gap-6 text-start"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-400/35 text-pink-300 flex items-center justify-center shrink-0">
                      <Cake className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200 text-xs font-bold font-numeric">
                      {isAr ? 'كود فوري: BDAY15' : 'Instant Code: BDAY15'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-extrabold font-editorial text-white">
                      {isAr ? 'سجّل في نادي أعياد الميلاد' : 'Join the Birthday Club'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {isAr
                        ? 'لا تفوّت هدية عيد ميلاد طفلك! بنبعتلك تذكير لطيف قبل يوم ميلاده بوقت كافٍ للطباعة والتوصيل مع خصم 15%.'
                        : 'Never miss the perfect birthday gift — get a gentle reminder in time for custom printing and delivery, plus an instant 15% code today.'}
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                    {(isAr
                      ? [
                          'خصم 15% فوري بكود BDAY15 قابل للاستخدام اليوم',
                          'تذكير عبر واتساب قبل عيد ميلاد طفلك بأسبوعين',
                          'أولوية حجز للطبعات الموسمية (رمضان والعيد والتخرج)',
                        ]
                      : [
                          'Instant 15% code (BDAY15) ready to use right away',
                          'Friendly WhatsApp reminder 2 weeks before their birthday',
                          'Early heads-up on seasonal editions (Ramadan, Eid & Graduation)',
                        ]
                    ).map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {clubUnlocked ? (
                  <div className="rounded-2xl bg-emerald-950/35 border border-emerald-400/35 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? `تم تسجيل ${clubUnlocked.childName} في نادي أعياد الميلاد!`
                          : `${clubUnlocked.childName} is officially in the Birthday Club!`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/85 border border-white/15 px-4 py-3">
                      <div>
                        <span className="block text-xs text-slate-400">
                          {isAr ? 'كود خصم 15%' : 'Your 15% Off Code'}
                        </span>
                        <span dir="ltr" className="font-numeric text-xl font-extrabold text-cyan-300">
                          {clubUnlocked.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(clubUnlocked.code, 'club')}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 text-xs font-bold"
                      >
                        {copiedClubPromo ? (
                          <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                        ) : (
                          <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{copiedClubPromo ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الكود' : 'Copy Code')}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <Link
                        to="/stories"
                        className="text-cyan-300 hover:text-cyan-200 font-bold inline-flex items-center gap-1.5 py-1"
                      >
                        <span>{isAr ? 'اطلب قصتك بخصم 15%' : 'Shop Storybooks (15% Off)'}</span>
                        <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setClubUnlocked(null);
                          setClubChildName('');
                          setClubBirthday('');
                        }}
                        className="text-slate-400 hover:text-white underline-offset-4 hover:underline py-1"
                      >
                        {isAr ? 'تسجيل طفل آخر' : 'Register another child'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleClubSubmit} className="space-y-3.5" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="club-parent-name" className="text-xs text-slate-200">
                          {isAr ? 'اسم ولي الأمر (اختياري)' : 'Parent Name (optional)'}
                        </Label>
                        <Input
                          id="club-parent-name"
                          value={clubParentName}
                          onChange={(e) => setClubParentName(e.target.value)}
                          placeholder={isAr ? 'مثال: أم سيف' : 'e.g. Sarah'}
                          className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm placeholder:text-slate-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="club-child-name" className="text-xs text-slate-200">
                          {isAr ? 'اسم الطفل *' : 'Child’s Name *'}
                        </Label>
                        <Input
                          id="club-child-name"
                          value={clubChildName}
                          onChange={(e) => {
                            setClubChildName(e.target.value);
                            if (clubError) setClubError('');
                          }}
                          placeholder={isAr ? 'مثال: آدم أو مريم' : 'e.g. Adam or Mariam'}
                          className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm placeholder:text-slate-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="club-birthday" className="text-xs text-slate-200">
                          {isAr ? 'تاريخ الميلاد *' : 'Child’s Birthday *'}
                        </Label>
                        <Input
                          id="club-birthday"
                          type="date"
                          dir="ltr"
                          value={clubBirthday}
                          onChange={(e) => {
                            setClubBirthday(e.target.value);
                            if (clubError) setClubError('');
                          }}
                          className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric [color-scheme:dark]"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="club-whatsapp" className="text-xs text-slate-200">
                          {isAr ? 'رقم الواتساب *' : 'WhatsApp Number *'}
                        </Label>
                        <Input
                          id="club-whatsapp"
                          type="tel"
                          dir="ltr"
                          value={clubWhatsapp}
                          onChange={(e) => {
                            setClubWhatsapp(e.target.value);
                            if (clubError) setClubError('');
                          }}
                          placeholder="+20 / +966 / +971"
                          className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric placeholder:text-slate-500"
                          required
                        />
                      </div>
                    </div>

                    {clubError && (
                      <p role="alert" className="text-xs text-rose-300 font-medium">
                        {clubError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="bubble-btn bubble-btn-secondary w-full min-h-[48px] px-6 text-sm font-bold gap-2"
                    >
                      <Cake className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'سجّل وافتح كود خصم 15%' : 'Join & Unlock 15% Off Code'}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Full Referral Hub Card */}
              <div
                id="referral-hub"
                className="glass-card rounded-3xl p-6 sm:p-8 border-cyan-400/25 flex flex-col justify-between gap-6 text-start"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 flex items-center justify-center shrink-0">
                      <Share2 className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold font-numeric">
                      {isAr ? 'شارك 15% واكسب 15%' : 'Give 15%, Get 15%'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-extrabold font-editorial text-white">
                      {isAr ? 'برنامج دعوة الأصدقاء والعائلة' : 'Share the Magic Referral Hub'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {isAr
                        ? 'اصنع كود دعوة باسمك في ثانية وشاركه على واتساب مع الأهل والأصدقاء — ياخدوا خصم 15% على أول قصة ولك مكافأة 15%.'
                        : 'Create your personalized referral code in a second and share it on WhatsApp — friends get 15% off their first storybook, and you earn 15% off yours.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    {(isAr
                      ? [
                          { step: '01', text: 'أنشئ كودك' },
                          { step: '02', text: 'شاركه واتساب' },
                          { step: '03', text: '15% لك ولهم' },
                        ]
                      : [
                          { step: '01', text: 'Create Code' },
                          { step: '02', text: 'Share WhatsApp' },
                          { step: '03', text: 'Both Save 15%' },
                        ]
                    ).map((item) => (
                      <div
                        key={item.step}
                        className="rounded-2xl bg-slate-950/60 border border-white/10 p-3 space-y-1"
                      >
                        <span className="block font-numeric text-sm font-extrabold text-cyan-300">
                          {item.step}
                        </span>
                        <span className="block text-xs text-slate-200 font-medium">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {refResult ? (
                  <div className="rounded-2xl bg-cyan-950/35 border border-cyan-400/35 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/85 border border-white/15 px-4 py-3">
                      <div className="min-w-0">
                        <span className="block text-xs text-slate-400">
                          {isAr ? 'كود دعوتك الشخصي' : 'Your Personal Invite Code'}
                        </span>
                        <span
                          dir="ltr"
                          className="font-numeric text-xl font-extrabold text-cyan-300 block truncate"
                        >
                          {refResult.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(refResult.code, 'ref')}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold shrink-0"
                      >
                        {copiedRefCode ? (
                          <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                        ) : (
                          <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{copiedRefCode ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                      </button>
                    </div>

                    <a
                      href={buildWhatsappInviteHref(refResult.parentName, refResult.code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bubble-btn bubble-btn-emerald w-full min-h-[48px] px-6 text-sm font-bold gap-2"
                    >
                      <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'أرسل الدعوة الآن عبر واتساب' : 'Send Invite on WhatsApp'}</span>
                    </a>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {isAr ? 'كود خصم الصديق في السلة: ' : 'Friend cart promo: '}
                        <strong dir="ltr" className="font-numeric text-cyan-300">
                          FRIEND15
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRefResult(null);
                          setRefParentName('');
                        }}
                        className="hover:text-white underline-offset-4 hover:underline py-1"
                      >
                        {isAr ? 'إنشاء كود جديد' : 'Create another'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleReferralHubSubmit} className="space-y-3.5" noValidate>
                    <div className="space-y-1.5">
                      <Label htmlFor="hub-ref-parent" className="text-xs text-slate-200">
                        {isAr ? 'اسمك (الأب أو الأم) *' : 'Your Name *'}
                      </Label>
                      <Input
                        id="hub-ref-parent"
                        value={refParentName}
                        onChange={(e) => {
                          setRefParentName(e.target.value);
                          if (refError) setRefError('');
                        }}
                        placeholder={isAr ? 'مثال: سارة أو كريم' : 'e.g. Sarah or Karim'}
                        className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm placeholder:text-slate-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="hub-ref-wa" className="text-xs text-slate-200">
                        {isAr ? 'رقم الواتساب لإرسال مكافأتك (اختياري)' : 'Your WhatsApp for reward credit (optional)'}
                      </Label>
                      <Input
                        id="hub-ref-wa"
                        type="tel"
                        dir="ltr"
                        value={refWhatsapp}
                        onChange={(e) => setRefWhatsapp(e.target.value)}
                        placeholder="+20 / +966 / +971"
                        className="min-h-[44px] bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric placeholder:text-slate-500"
                      />
                    </div>

                    {refError && (
                      <p role="alert" className="text-xs text-rose-300 font-medium">
                        {refError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="bubble-btn bubble-btn-primary w-full min-h-[48px] px-6 text-sm font-bold gap-2"
                    >
                      <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'إنشاء كود الدعوة الخاص بي' : 'Generate My Invite Code'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer showMascot={showMascot} onToggleMascot={setShowMascot} />
    </div>
  );
}
