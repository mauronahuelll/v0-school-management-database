"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle, ThemeToggleCompact } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

// ============================================
// NAVIGATION ITEMS
// ============================================

const NAV_ITEMS = [
  {
    id: "attendance",
    label: "Asistencia",
    href: "/attendance",
    icon: ClipboardList,
    description: "Toma de lista diaria",
  },
  {
    id: "grades",
    label: "Calificaciones",
    href: "/grades",
    icon: GraduationCap,
    description: "Carga de notas por materia",
  },
  {
    id: "sanctions",
    label: "Convivencia",
    href: "/sanctions",
    icon: BookOpen,
    description: "Observaciones y sanciones",
  },
] as const;

// ============================================
// SIDEBAR NAVIGATION (Desktop)
// ============================================

interface GlobalNavProps {
  schoolName?: string;
  userName?: string;
  userRole?: string;
}

export function GlobalNav({
  schoolName = "Escuela Demo",
  userName = "Preceptor",
  userRole = "PRECEPTOR",
}: GlobalNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On mobile, render the bottom tabs
  if (isMobile) {
    return <MobileBottomNav pathname={pathname} />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50",
          "flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "transition-theme"
        )}
      >
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
          <Link href="/attendance" className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <School className="size-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <h1 className="font-semibold text-sidebar-foreground truncate">
                  Sequency
                </h1>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {schoolName}
                </p>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <motion.div
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-3 rounded-xl",
                        "transition-all duration-200",
                        "hover:bg-sidebar-accent",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-sidebar-primary"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}

                      <Icon className={cn(
                        "size-5 shrink-0",
                        isActive && "text-sidebar-primary"
                      )} />

                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="min-w-0"
                        >
                          <span className={cn(
                            "block text-sm font-medium truncate",
                            isActive && "text-sidebar-primary"
                          )}>
                            {item.label}
                          </span>
                          <span className="block text-xs text-sidebar-foreground/50 truncate">
                            {item.description}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" sideOffset={12}>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer with Theme Toggle and Collapse */}
        <div className="border-t border-sidebar-border p-3 space-y-3">
          {/* Theme Toggle */}
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between px-2"
          )}>
            {!isCollapsed && (
              <span className="text-xs text-sidebar-foreground/60 font-medium">
                Tema
              </span>
            )}
            {isCollapsed ? <ThemeToggleCompact /> : <ThemeToggle />}
          </div>

          {/* Collapse Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  "hover:bg-sidebar-accent"
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <>
                    <ChevronLeft className="size-4 mr-2" />
                    <span className="text-xs">Colapsar</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Expandir menu
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

// ============================================
// MOBILE BOTTOM NAVIGATION
// ============================================

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-glass-border">
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1",
                "transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute -inset-2 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "size-5 relative z-10",
                  isActive && "text-primary"
                )} />
              </motion.div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Theme toggle in mobile */}
        <div className="flex flex-col items-center justify-center flex-1 h-full gap-1">
          <ThemeToggleCompact />
          <span className="text-[10px] font-medium text-muted-foreground">
            Tema
          </span>
        </div>
      </div>
    </nav>
  );
}

// ============================================
// EXPORTS
// ============================================

export { NAV_ITEMS };
