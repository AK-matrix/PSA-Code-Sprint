"use client";

import { useHydration } from "@/hooks/use-hydration";
import { ReactNode } from "react";

interface HydrationSafeProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function HydrationSafe({ children, fallback }: HydrationSafeProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <>{fallback || <div className="animate-pulse bg-gray-100 rounded h-4 w-full"></div>}</>;
  }

  return <>{children}</>;
}

// Component to handle browser extension attributes
export function BrowserExtensionSafe({ children, ...props }: any) {
  return (
    <div {...props} suppressHydrationWarning>
      {children}
    </div>
  );
}
