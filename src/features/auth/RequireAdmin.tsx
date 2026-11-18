import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import {
  Shield,
  Lock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Languages,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getStoreConfig,
  isLocalAdminUnlocked,
  unlockLocalAdmin,
} from '@/lib/localStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Gate admin routes via either Supabase admin role OR local studio passcode session.
export function RequireAdmin() {
  const { isAdmin, isLoading } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  const isAr = language === 'ar';

  const [localUnlocked, setLocalUnlocked] = useState<boolean>(() => isLocalAdminUnlocked());
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');

  if (isAdmin || localUnlocked) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div
        role="status"
        dir={isRTL ? 'rtl' : 'ltr'}
        className="min-h-screen bg-[#080c1c] text-slate-300 grid place-items-center"
      >
        {isAr ? 'جاري تحميل لوحة التحكم…' : 'Loading admin studio…'}
      </div>
    );
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const config = getStoreConfig();
    if (passcode.trim() === config.adminPasscode) {
      unlockLocalAdmin();
      setError('');
      setLocalUnlocked(true);
    } else {
      setError(
        isAr
          ? 'رمز الدخول غير صحيح. تأكد من الرمز وحاول مرة أخرى.'
          : 'Invalid admin passcode. Please check and try again.'
      );
    }
  };

  const toggleLanguage = () => {
    setLanguage(isAr ? 'en' : 'ar');
    if (error) setError('');
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-screen bg-[#080c1c] text-white flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Subtle Midnight Magic Ambient Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(0,217,255,0.14),_transparent_55%)]"
      />

      <div className="relative z-10 w-full max-w-md glass-card p-6 sm:p-8 space-y-6">
        {/* Top Row: Studio Pill + Quick Language Switcher */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>{isAr ? 'استوديو بابل فيرس' : 'Bubbleverse Studio'}</span>
          </div>

          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <Languages className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        </div>

        {/* Shield Emblem & Heading */}
        <div className="text-center space-y-3 pt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/25 to-pink-500/20 border border-cyan-400/35 text-cyan-300 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(0,217,255,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
              {isAr ? 'لوحة تحكم الإدارة' : 'Admin Control Center'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'أدخل رمز الدخول للوصول إلى الطلبات، الكتالوج، استوديو القصص، ومركز الربط.'
                : 'Enter your studio passcode to manage orders, catalog, story studio, and integrations.'}
            </p>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="admin-passcode"
              className="text-xs font-semibold text-slate-200 flex items-center gap-2"
            >
              <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>{isAr ? 'رمز دخول الإدارة' : 'Admin Passcode'}</span>
            </label>

            <div className="relative">
              <Input
                id="admin-passcode"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                autoFocus
                autoComplete="current-password"
                className="h-12 pe-11 ps-11 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-2xl text-white text-center tracking-widest font-numeric"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                aria-label={
                  showPasscode
                    ? isAr
                      ? 'إخفاء رمز الدخول'
                      : 'Hide passcode'
                    : isAr
                    ? 'إظهار رمز الدخول'
                    : 'Show passcode'
                }
                className="absolute top-1/2 -translate-y-1/2 end-2.5 p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs text-red-300 bg-red-950/50 border border-red-400/35 rounded-xl px-3 py-2 text-center"
              >
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bubble-btn bubble-btn-primary text-sm font-bold"
          >
            {isAr ? 'دخول لوحة التحكم' : 'Unlock Admin Studio'}
          </Button>
        </form>

        {/* Footer Info */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            {isAr ? 'الرمز الافتراضي:' : 'Default:'}{' '}
            <code className="text-cyan-300 font-numeric font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded-md">
              admin123
            </code>
          </span>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 transition-colors font-medium"
          >
            <BackIcon className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'العودة للمتجر' : 'Back to Store'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
