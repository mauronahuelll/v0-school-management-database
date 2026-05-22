"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { ThemeToggle } from "@/components/theme-toggle";

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
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "users", label: "Usuarios", href: "/users", icon: Users },
  { id: "analytics", label: "Analitica", href: "/analytics", icon: BarChart3 },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_DOCENTE = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "users", label: "Usuarios", href: "/users", icon: Users },
  { id: "analytics", label: "Analitica", href: "/analytics", icon: BarChart3 },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_TUTOR = [
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
    case "TUTOR":
      return NAV_ITEMS_TUTOR;
    default:
      return NAV_ITEMS_PRECEPTOR;
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administracion";
    case "DOCENTE":
      return "Ciencias Exactas";
    case "TUTOR":
      return "Tutor Familiar";
    default:
      return "Administracion";
  }
}

function getUserName(role: string) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "DOCENTE":
      return "Prof. Rodriguez";
    case "TUTOR":
      return "Elena Martinez";
    default:
      return "Usuario";
  }
}

// ============================================
// GLOBAL NAV COMPONENT
// ============================================

interface GlobalNavProps {
  schoolName?: string;
  userName?: string;
  userRole?: string;
}

export function GlobalNav({
  schoolName = "Instituto Demo",
  userName,
  userRole = "PRECEPTOR",
}: GlobalNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(userRole);
  const displayName = userName || getUserName(userRole);
  const roleLabel = getRoleLabel(userRole);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50",
        "w-[15%] min-w-[180px] max-w-[220px]",
        "glass-panel border-r border-white/5",
        "flex flex-col",
        "py-4"
      )}
    >
      {/* Header / Brand */}
      <div className="px-4 mb-6">
        <Link href="/dashboard" className="block">
          <h1 className="text-display-sm font-bold text-primary tracking-tighter">
            Sequency
          </h1>
          <p className="text-label-caps text-on-surface-variant/60 uppercase mt-0.5">
            {roleLabel}
          </p>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "text-body-md transition-all duration-200",
                "hover:bg-white/5",
                "active:scale-[0.98]",
                isActive
                  ? "text-primary bg-primary/5 border-r-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="px-2 mt-auto space-y-3">
        {/* New Record Button */}
        {userRole !== "TUTOR" && (
          <button
            className={cn(
              "w-full h-8 rounded-lg",
              "bg-primary text-primary-foreground",
              "text-body-sm font-medium",
              "flex items-center justify-center gap-2",
              "hover:brightness-110 transition-all",
              "active:scale-[0.98]"
            )}
          >
            <Plus className="size-4" />
            Nuevo Registro
          </button>
        )}

        {/* User Profile */}
        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="size-8 rounded-full bg-surface-container-high flex items-center justify-center text-body-sm font-medium text-on-surface">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium truncate">{displayName}</p>
              <p className="text-label-xs text-on-surface-variant/60 truncate">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2",
            "text-body-sm text-on-surface-variant",
            "hover:text-on-surface hover:bg-white/5",
            "rounded-lg transition-colors"
          )}
        >
          <LogOut className="size-4" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
}

// Export nav items for use in other components
export { NAV_ITEMS_PRECEPTOR as NAV_ITEMS };
