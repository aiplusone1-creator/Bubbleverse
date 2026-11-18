import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { RequireAdmin } from "@/features/auth/RequireAdmin";
import { AuthProvider } from "@/contexts/AuthProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import GuestCheckoutModal from "@/components/cart/GuestCheckoutModal";
import Index from "./pages/Index";

const Stories = lazy(() => import("./pages/Stories"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const MerchStore = lazy(() => import("./pages/MerchStore"));
const MerchDetail = lazy(() => import("./pages/MerchDetail"));
const SchoolsPortal = lazy(() => import("./pages/SchoolsPortal"));
const GiftClub = lazy(() => import("./pages/GiftClub"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCatalog = lazy(() => import("./pages/admin/AdminCatalog"));
const AdminMerch = lazy(() => import("./pages/admin/AdminMerch"));
const AdminStudio = lazy(() => import("./pages/admin/AdminStudio"));
const AdminPdfBuilder = lazy(() => import("./pages/admin/AdminPdfBuilder"));
const AdminShowcase = lazy(() => import("./pages/admin/AdminShowcase"));
const AdminGrowth = lazy(() => import("./pages/admin/AdminGrowth"));
const AdminIntegrations = lazy(() => import("./pages/admin/AdminIntegrations"));
const AdminConfig = lazy(() => import("./pages/admin/AdminConfig"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <CartDrawer />
                <GuestCheckoutModal />
                <Suspense fallback={<div role="status" className="min-h-screen grid place-items-center">Loading…</div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/stories" element={<Stories />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/stories/:id" element={<ProductDetail />} />
                    <Route path="/merch" element={<MerchStore />} />
                    <Route path="/merch/:id" element={<MerchDetail />} />
                    <Route path="/schools" element={<SchoolsPortal />} />
                    <Route path="/club" element={<GiftClub />} />
                    <Route path="/track" element={<TrackOrder />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route element={<RequireAdmin />}>
                      <Route path="/admin" element={<AdminOverview />} />
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/catalog" element={<AdminCatalog />} />
                      <Route path="/admin/merch" element={<AdminMerch />} />
                      <Route path="/admin/studio" element={<AdminStudio />} />
                      <Route path="/admin/pdf-builder" element={<AdminPdfBuilder />} />
                      <Route path="/admin/showcase" element={<AdminShowcase />} />
                      <Route path="/admin/growth" element={<AdminGrowth />} />
                      <Route path="/admin/integrations" element={<AdminIntegrations />} />
                      <Route path="/admin/config" element={<AdminConfig />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
