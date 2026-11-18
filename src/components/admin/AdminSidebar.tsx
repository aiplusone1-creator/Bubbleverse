import {
  BarChart3,
  ShoppingBag,
  TrendingUp,
  Gift,
  BookOpen,
  BookCopy,
  Settings,
  Home,
  LogOut,
  Sparkles,
  Wand2,
  Package,
  Plug,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { lockLocalAdmin } from '@/lib/localStore';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const MENU_ITEMS = [
  {
    url: '/admin',
    icon: BarChart3,
    titleAr: 'النظرة العامة والتحليلات',
    titleEn: 'Overview & Analytics',
  },
  {
    url: '/admin/orders',
    icon: ShoppingBag,
    titleAr: 'الطلبات والعملاء',
    titleEn: 'Orders & Customers',
  },
  {
    url: '/admin/growth',
    icon: TrendingUp,
    titleAr: 'النمو والعروض وB2B',
    titleEn: 'Growth, Promos & B2B',
  },
  {
    url: '/admin/merch',
    icon: Gift,
    titleAr: 'متجر البراند وهدية Bub',
    titleEn: 'Merch & Bub GWP',
  },
  {
    url: '/admin/catalog',
    icon: BookOpen,
    titleAr: 'إدارة الكتالوج',
    titleEn: 'Catalog Manager',
  },
  {
    url: '/admin/studio',
    icon: Wand2,
    titleAr: 'استوديو القصص',
    titleEn: 'Story Studio',
  },
  {
    url: '/admin/pdf-builder',
    icon: BookCopy,
    titleAr: 'صانع كتب KDP (8.5×8.5)',
    titleEn: 'KDP 8.5"×8.5" PDF Builder',
  },
  {
    url: '/admin/showcase',
    icon: Sparkles,
    titleAr: 'واجهة العرض',
    titleEn: 'Hero & Showcase',
  },
  {
    url: '/admin/integrations',
    icon: Plug,
    titleAr: 'مركز الـ APIs',
    titleEn: 'APIs & Integrations',
  },
  {
    url: '/admin/config',
    icon: Settings,
    titleAr: 'إعدادات المتجر',
    titleEn: 'Store Settings',
  },
] as const;

export function AdminSidebar() {
  const { user, signOut } = useAuth();
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  const handleSignOut = async () => {
    lockLocalAdmin();
    try {
      await signOut();
    } catch {
      // Ignore if not signed into Supabase
    }
    navigate('/');
  };

  const displayIdentity =
    user?.email || (isAr ? 'مدير الاستوديو' : 'Studio Admin');

  return (
    <Sidebar
      side={isRTL ? 'right' : 'left'}
      className={`${
        isRTL ? 'border-l' : 'border-r'
      } border-white/10 bg-[#090e21]/95 backdrop-blur-xl`}
    >
      <SidebarHeader className="border-b border-white/10 p-4 bg-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_24px_rgba(0,217,255,0.28)] shrink-0">
            <span className="text-white font-extrabold font-editorial text-base">B</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold font-editorial text-sm truncate">
              {isAr ? 'بابل فيرس' : 'Bubbleverse'}
            </h2>
            <p className="text-cyan-300 text-xs font-medium truncate">
              {isAr ? 'لوحة تحكم الاستوديو' : 'Studio Admin Hub'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-semibold px-3 py-2">
            {isAr ? 'إدارة المتجر والعمليات' : 'Operations'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {MENU_ITEMS.map((item) => {
                const label = isAr ? item.titleAr : item.titleEn;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/admin'}
                        className="flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] text-slate-300 hover:bg-white/5 hover:text-white rounded-2xl transition-all border border-transparent"
                        activeClassName="bg-gradient-to-r from-cyan-500/18 via-purple-500/18 to-pink-500/10 text-white border-cyan-400/35 shadow-[0_0_20px_rgba(0,217,255,0.12)]"
                      >
                        <item.icon className="w-5 h-5 shrink-0 text-cyan-300/90" />
                        <span className="text-sm font-medium truncate">{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-slate-400 text-xs font-semibold px-3 py-2">
            {isAr ? 'واجهة المتجر' : 'Storefront'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    className="flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] text-slate-300 hover:bg-white/5 hover:text-white rounded-2xl transition-all"
                    activeClassName=""
                  >
                    <Home className="w-5 h-5 shrink-0 text-purple-300" />
                    <span className="text-sm font-medium truncate">
                      {isAr ? 'عرض المتجر' : 'View Storefront'}
                    </span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/track"
                    className="flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] text-slate-300 hover:bg-white/5 hover:text-white rounded-2xl transition-all"
                    activeClassName=""
                  >
                    <Package className="w-5 h-5 shrink-0 text-pink-300" />
                    <span className="text-sm font-medium truncate">
                      {isAr ? 'صفحة تتبّع الطلبات' : 'Order Tracker'}
                    </span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4 bg-transparent space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-md">
            <span className="text-white font-bold text-xs">
              {displayIdentity.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{displayIdentity}</p>
            <p className="text-slate-400 text-xs truncate">
              {isAr ? 'الوضع المحلي الآمن' : 'Local-First Mode'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full h-10 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-red-500/15 hover:text-red-200 hover:border-red-400/40 gap-2"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'قفل وخروج' : 'Lock & Exit'}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
