import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, Languages, Sparkles } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useLanguage } from '@/hooks/useLanguage';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const ROUTE_TITLES: Record<string, { ar: string; en: string }> = {
  '/admin': { ar: 'النظرة العامة والتحليلات', en: 'Overview & Analytics' },
  '/admin/orders': { ar: 'الطلبات والعملاء', en: 'Orders & Customers' },
  '/admin/catalog': { ar: 'إدارة الكتالوج', en: 'Catalog Manager' },
  '/admin/growth': { ar: 'النمو والعروض وB2B', en: 'Growth, Promos & B2B' },
  '/admin/merch': { ar: 'متجر البراند وهدية Bub', en: 'Merch Store & Bub GWP' },
  '/admin/studio': { ar: 'استوديو القصص', en: 'Story Studio' },
  '/admin/pdf-builder': { ar: 'صانع كتب KDP (8.5×8.5)', en: 'KDP 8.5"×8.5" PDF Composer' },
  '/admin/showcase': { ar: 'واجهة العرض', en: 'Hero & Showcase' },
  '/admin/integrations': { ar: 'مركز الـ APIs', en: 'APIs & Integrations' },
  '/admin/config': { ar: 'إعدادات المتجر', en: 'Store Settings' },
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { language, setLanguage, isRTL } = useLanguage();
  const location = useLocation();
  const isAr = language === 'ar';

  const currentMeta = ROUTE_TITLES[location.pathname] ?? {
    ar: 'لوحة تحكم الإدارة',
    en: 'Admin Studio',
  };

  return (
    <SidebarProvider>
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="min-h-screen flex w-full bg-[#080c1c] bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.14),_rgba(8,12,28,1)_55%)] text-slate-100"
      >
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 h-16 border-b border-white/10 flex items-center justify-between gap-3 px-4 sm:px-6 bg-[#090e21]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger
                aria-label={isAr ? 'فتح أو إغلاق القائمة الجانبية' : 'Toggle sidebar'}
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white shrink-0"
              />
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="text-sm font-bold text-white truncate">
                  {isAr ? currentMeta.ar : currentMeta.en}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Bilingual Switcher */}
              <button
                type="button"
                onClick={() => setLanguage(isAr ? 'en' : 'ar')}
                aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs sm:text-sm font-semibold text-slate-100 transition-colors cursor-pointer"
              >
                <Languages className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>{isAr ? 'English' : 'العربية'}</span>
              </button>

              {/* View Storefront Link */}
              <Link
                to="/"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/35 text-xs sm:text-sm font-semibold text-cyan-200 hover:text-white transition-all"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {isAr ? 'عرض المتجر' : 'View Storefront'}
                </span>
              </Link>
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10 overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
