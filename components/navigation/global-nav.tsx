"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  GraduationCap,
  BookOpen,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// NAVIGATION ITEMS BY ROLE
// ============================================

const NAV_ITEMS_ADMIN = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "users", label: "Usuarios", href: "/users", icon: Users },
  { id: "analytics", label: "Analitica", href: "/analytics", icon: BarChart3 },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_PRECEPTOR = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Asistencia", href: "/attendance", icon: ClipboardList },
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "users", label: "Usuarios", href: "/users", icon: Users },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_DOCENTE = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "grades", label: "Notas", href: "/grades", icon: GraduationCap },
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "analytics", label: "Analitica", href: "/analytics", icon: BarChart3 },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_FAMILIA = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "community", label: "Comunidad", href: "/community", icon: Users },
  { id: "tramites", label: "Tramites", href: "/tramites", icon: ClipboardList },
  { id: "profile", label: "Perfil Alumno", href: "/student", icon: GraduationCap },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

function getNavItems(role: string) {
  switch (role) {
    case "ADMIN":
      return NAV_ITEMS_ADMIN;
    case "DOCENTE":
      return NAV_ITEMS_DOCENTE;
    case "FAMILIA":
      return NAV_ITEMS_FAMILIA;
    default:
      return NAV_ITEMS_PRECEPTOR;
  }
}

// ============================================
// GLOBAL NAV COMPONENT (Simplified for AppShell)
// ============================================

interface GlobalNavProps {
  userRole?: string;
  className?: string;
}

export function GlobalNav({
  userRole = "PRECEPTOR",
  className,
}: GlobalNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(userRole);

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-sm transition-all duration-200",
              "hover:bg-white/5",
              "active:scale-[0.98]",
              isActive
                ? "text-primary bg-primary/10 font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
            )}
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      {/* Separator */}
      <div className="h-px bg-white/5 my-3" />

      {/* New Record Button - Only for staff roles */}
      {userRole !== "FAMILIA" && (
        <button
          className={cn(
            "w-full h-9 rounded-lg",
            "bg-primary text-primary-foreground",
            "text-sm font-medium",
            "flex items-center justify-center gap-2",
            "hover:brightness-110 transition-all",
            "active:scale-[0.98]"
          )}
        >
          <Plus className="size-4" />
          Nuevo Registro
        </button>
      )}

      {/* Logout at bottom */}
      <div className="mt-auto pt-4">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2",
            "text-sm text-muted-foreground",
            "hover:text-foreground hover:bg-white/5",
            "rounded-lg transition-colors"
          )}
        >
          <LogOut className="size-4" />
          Cerrar Sesion
        </button>
      </div>
    </nav>
  );
}

// Export nav items for use in other components
export { NAV_ITEMS_PRECEPTOR as NAV_ITEMS };
