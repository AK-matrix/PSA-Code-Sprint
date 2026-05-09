"use client";

import { Sidebar } from "@/components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

export function DashboardLayout({ children, headerExtra }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar headerExtra={headerExtra} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
