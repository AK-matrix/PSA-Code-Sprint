"use client";

import { Sidebar } from "@/components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" suppressHydrationWarning>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" suppressHydrationWarning>
        {children}
      </main>
    </div>
  );
}
