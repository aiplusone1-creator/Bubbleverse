import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RequireAdmin } from "@/features/auth/RequireAdmin";
import { AuthProvider } from "@/contexts/AuthProvider";
import Index from "./pages/Index";
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminStories = lazy(() => import("./pages/admin/AdminStories"));
const AdminConfig = lazy(() => import("./pages/admin/AdminConfig"));
const AdminExamples = lazy(() => import("./pages/admin/AdminExamples"));
const AdminShowcase = lazy(() => import("./pages/admin/AdminShowcase"));
const AdminBrand = lazy(() => import("./pages/admin/AdminBrand"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<div role="status" className="min-h-screen grid place-items-center">Loading…</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="/admin" element={<AdminOverview />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/stories" element={<AdminStories />} />
                    <Route path="/admin/examples" element={<AdminExamples />} />
                    <Route path="/admin/showcase" element={<AdminShowcase />} />
                    <Route path="/admin/brand" element={<AdminBrand />} />
                    <Route path="/admin/config" element={<AdminConfig />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
