import { useRef, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Download, FileImage, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Static SVG of the redesigned Bubbleverse logo (mark + wordmark).
 * Self-contained: no external fonts (uses system-ui), gradients & filters baked in.
 * Designed for export — animations from the live React logo are intentionally omitted
 * so the exported file is a clean, scalable brand asset.
 */
const LOGO_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 200" width="720" height="200">
  <defs>
    <radialGradient id="bubble" cx="32%" cy="28%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>
      <stop offset="22%" stop-color="#9ce8ff" stop-opacity="0.9"/>
      <stop offset="52%" stop-color="#a48cf0" stop-opacity="0.85"/>
      <stop offset="78%" stop-color="#ef8fd6" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#1f4ea8" stop-opacity="0.85"/>
    </radialGradient>
    <linearGradient id="wordmark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1ab8ff"/>
      <stop offset="45%" stop-color="#7a5cf0"/>
      <stop offset="80%" stop-color="#f25cc0"/>
      <stop offset="100%" stop-color="#1ab8ff"/>
    </linearGradient>
    <linearGradient id="rule" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22c2f0"/>
      <stop offset="100%" stop-color="#e94fc0"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="55%" stop-color="#7ad4ff" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#7ad4ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <!-- Mark -->
  <g transform="translate(100 100)">
    <!-- Halo -->
    <circle r="78" fill="url(#halo)" filter="url(#soft)"/>
    <!-- Soap bubble body -->
    <circle r="62" fill="url(#bubble)"/>
    <!-- Thin film rim -->
    <circle r="61" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.5"/>
    <!-- Specular highlights -->
    <ellipse cx="-18" cy="-26" rx="16" ry="9" fill="#ffffff" opacity="0.78" transform="rotate(-20 -18 -26)"/>
    <circle cx="-6" cy="-16" r="3.5" fill="#ffffff" opacity="0.95"/>
    <ellipse cx="22" cy="30" rx="18" ry="5" fill="#ffffff" opacity="0.18"/>
    <!-- Orbiting micro bubbles -->
    <circle cx="0" cy="-66" r="5" fill="#bff0ff"/>
    <circle cx="46" cy="48" r="3.5" fill="#ffc9f0"/>
    <circle cx="-60" cy="14" r="2.6" fill="#d8c5ff"/>
  </g>

  <!-- Wordmark -->
  <g transform="translate(195 0)">
    <text x="0" y="118"
      font-family="Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
      font-size="78" font-weight="900" letter-spacing="-2.5">
      <tspan fill="url(#wordmark)">Bubble</tspan><tspan fill="#0f172a">verse</tspan>
    </text>
    <!-- Tagline rule + label -->
    <rect x="2" y="138" width="36" height="2" rx="1" fill="url(#rule)"/>
    <text x="46" y="146"
      font-family="Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
      font-size="11" font-weight="600" letter-spacing="3"
      fill="#64748b">STORIES IN BUBBLES</text>
  </g>
</svg>`;

const PNG_SIZES = [256, 512, 1024, 2048];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function svgToPng(svg: string, width: number, transparent: boolean): Promise<Blob> {
  // Aspect ratio of the source viewBox is 720:200 = 3.6
  const height = Math.round((width / 720) * 200);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    if (!transparent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AdminBrand() {
  const [busy, setBusy] = useState<string | null>(null);
  const [transparent, setTransparent] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  const downloadSVG = () => {
    const blob = new Blob([LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, 'bubbleverse-logo.svg');
    toast.success('SVG downloaded');
  };

  const downloadPNG = async (size: number) => {
    try {
      setBusy(`png-${size}`);
      const blob = await svgToPng(LOGO_SVG, size, transparent);
      triggerDownload(blob, `bubbleverse-logo-${size}.png`);
      toast.success(`PNG ${size}px downloaded`);
    } catch (e) {
      toast.error('Failed to export PNG');
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = async () => {
    try {
      setBusy('all');
      const blob = new Blob([LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
      triggerDownload(blob, 'bubbleverse-logo.svg');
      for (const size of PNG_SIZES) {
        const png = await svgToPng(LOGO_SVG, size, transparent);
        triggerDownload(png, `bubbleverse-logo-${size}.png`);
      }
      toast.success('All assets downloaded');
    } catch {
      toast.error('Failed to export bundle');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Brand Assets</h1>
          <p className="text-slate-400 text-sm mt-1">
            Download the official Bubbleverse logo in SVG (vector) or PNG at multiple sizes.
          </p>
        </header>

        {/* Preview */}
        <div
          ref={previewRef}
          className="rounded-2xl border border-slate-700 overflow-hidden"
          style={{
            background: transparent
              ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 24px 24px'
              : '#ffffff',
          }}
        >
          <div className="flex items-center justify-center p-10">
            <div
              className="w-full max-w-[640px]"
              dangerouslySetInnerHTML={{ __html: LOGO_SVG }}
            />
          </div>
        </div>

        {/* Background toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-300">PNG background:</span>
          <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setTransparent(true)}
              className={`px-3 py-1.5 text-xs font-medium ${transparent ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              Transparent
            </button>
            <button
              onClick={() => setTransparent(false)}
              className={`px-3 py-1.5 text-xs font-medium ${!transparent ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              White
            </button>
          </div>
        </div>

        {/* Downloads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileCode2 className="h-5 w-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Vector</h2>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              Infinitely scalable. Best for print, web, and further editing.
            </p>
            <Button onClick={downloadSVG} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download SVG
            </Button>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileImage className="h-5 w-5 text-fuchsia-400" />
              <h2 className="text-white font-semibold">Raster (PNG)</h2>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              Pre-rendered sizes for social, favicons, and quick embeds.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PNG_SIZES.map((size) => (
                <Button
                  key={size}
                  variant="outline"
                  onClick={() => downloadPNG(size)}
                  disabled={busy === `png-${size}`}
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {size}px
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={downloadAll}
          disabled={busy === 'all'}
          size="lg"
          className="w-full bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white hover:opacity-90"
        >
          <Download className="h-5 w-5 mr-2" />
          {busy === 'all' ? 'Preparing bundle…' : 'Download all (SVG + all PNG sizes)'}
        </Button>
      </div>
    </AdminLayout>
  );
}
