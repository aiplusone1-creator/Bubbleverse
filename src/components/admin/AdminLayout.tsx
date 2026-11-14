import type { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-900">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-slate-700 flex items-center px-4 bg-slate-900/50 backdrop-blur">
            <SidebarTrigger className="text-slate-400 hover:text-white" />
          </header>
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
