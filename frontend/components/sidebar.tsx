"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydration } from "@/hooks/use-hydration";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  AlertCircle,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity
} from "lucide-react";
import { PortaBellaLogo } from "@/components/portabella-logo";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Process Alert", href: "/process", icon: AlertCircle },
  { name: "Log Simulation", href: "/simulation", icon: Activity },
  { name: "History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const isHydrated = useHydration();
  const pathname = usePathname();

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="relative h-screen portabella-sidebar border-r border-gray-200 w-64 flex flex-col">
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200">
          <PortaBellaLogo size="md" showText={false} />
        </div>
        <div className="flex-1 px-3 py-4 space-y-1">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-screen portabella-sidebar border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
      suppressHydrationWarning
    >
      {/* Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <PortaBellaLogo size="md" showText={true} />
        )}
        {collapsed && (
          <PortaBellaLogo size="md" showText={false} />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center justify-center gap-2 hover:bg-gray-100",
            collapsed && "px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
