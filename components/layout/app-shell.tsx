"use client";

import { GlobalNav } from "@/components/navigation/global-nav";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  schoolName?: string;
  userName?: string;
  userRole?: string;
}

export function AppShell({
  children,
  schoolName,
  userName,
  userRole,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Global Navigation */}
      <GlobalNav
        schoolName={schoolName}
        userName={userName}
        userRole={userRole}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "min-h-screen transition-all duration-200",
          // Desktop: offset for sidebar
          "md:pl-[72px] lg:pl-[256px]",
          // Mobile: offset for bottom nav
          "pb-20 md:pb-0"
        )}
      >
        {children}
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "glass border-glass-border",
            title: "text-foreground font-medium",
            description: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
