"use client";

import { useState } from "react";
import { GlobalNav } from "@/components/navigation/global-nav";
import { SchoolContextProvider } from "@/lib/context/school-context";
import { UtilityPanel } from "@/components/layout/utility-panel";
import { DevConsole } from "@/components/layout/dev-console";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

// ============================================
// APP SHELL - 3 Column Galactic Layout
// ============================================

interface AppShellProps {
  children: React.ReactNode;
  schoolName?: string;
  userName?: string;
  userRole?: string;
  /** Hide utility panel for specific pages */
  hideUtilityPanel?: boolean;
}

export function AppShell({
  children,
  schoolName = "Instituto Demo",
  userName = "Usuario",
  userRole = "PRECEPTOR",
  hideUtilityPanel = false,
}: AppShellProps) {
  const [currentRole, setCurrentRole] = useState(userRole);

  return (
    <SchoolContextProvider>
      <div className="h-screen w-screen overflow-hidden bg-background flex">
        {/* ========================================
            COLUMN 1: SIDEBAR (15%)
            ======================================== */}
        <GlobalNav
          schoolName={schoolName}
          userName={userName}
          userRole={currentRole}
        />

        {/* ========================================
            COLUMN 2: MAIN CONTENT (55%)
            ======================================== */}
        <main
          className={cn(
            "flex-1 h-full overflow-hidden",
            "ml-[15%] md:ml-[180px] lg:ml-[200px]",
            !hideUtilityPanel && "mr-[30%] md:mr-[280px] lg:mr-[340px]"
          )}
        >
          <div className="h-full overflow-y-auto scrollbar-galactic p-4">
            {children}
          </div>
        </main>

        {/* ========================================
            COLUMN 3: UTILITY PANEL (30%)
            ======================================== */}
        {!hideUtilityPanel && (
          <div className="fixed right-0 top-0 bottom-0 w-[30%] min-w-[280px] max-w-[380px] z-40">
            <UtilityPanel />
          </div>
        )}

        {/* ========================================
            FLOATING DEV CONSOLE
            ======================================== */}
        <DevConsole onRoleChange={(role) => setCurrentRole(role)} />

        {/* Toast Notifications */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "glass-panel border-white/10",
              title: "text-foreground font-medium text-body-sm",
              description: "text-on-surface-variant text-body-sm",
            },
          }}
        />
      </div>
    </SchoolContextProvider>
  );
}
