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
  GraduationCap,
  BookOpen,
  Plus,
  ShieldCheck,
  MessageSquare,
  FileText,
  Megaphone,
  Upload,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, Role } from "@/lib/context/auth-context";

// ============================================
// NAVIGATION ITEMS BY ROLE
// ============================================

const NAV_ITEMS_ADMIN = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Asistencia", href: "/attendance", icon: ClipboardList },
  { id: "grades", label: "Calificaciones", href: "/grades", icon: GraduationCap },
  { id: "behavior", label: "Convivencia", href: "/behavior", icon: Users },
  { id: "comunicados", label: "Comunicados", href: "/comunicados", icon: Megaphone },
  { id: "import", label: "Importar Matricula", href: "/admin/import", icon: Upload },
  { id: "config", label: "Config. Institucion", href: "/admin/config", icon: Sliders },
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "users", label: "Usuarios", href: "/users", icon: Users },
  { id: "analytics", label: "Analitica", href: "/analytics", icon: BarChart3 },
  { id: "permissions", label: "Permisos", href: "/permissions", icon: ShieldCheck },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_PRECEPTOR = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Asistencia", href: "/attendance", icon: ClipboardList },
  { id: "behavior", label: "Convivencia", href: "/behavior", icon: Users },
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_DOCENTE = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "grades", label: "Calificaciones", href: "/grades", icon: GraduationCap },
  { id: "cursos", label: "Cursos", href: "/cursos", icon: BookOpen },
  { id: "analytics", label: "Analitica", href: "/analytics", icon: BarChart3 },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/ajustes", icon: Settings },
];

const NAV_ITEMS_FAMILIA = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "comunidad", label: "Muro Escolar", href: "/comunidad", icon: MessageSquare },
  { id: "tramites", label: "Tramites", href: "/tramites", icon: FileText },
  { id: "profile", label: "Perfil Alumno", href: "/student", icon: GraduationCap },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
];

function getNavItems(role: Role) {
  switch (role) {
    case "ADMIN":
      return NAV_ITEMS_ADMIN;
    case "DOCENTE":
      return NAV_ITEMS_DOCENTE;
    case "FAMILIA":
      return NAV_ITEMS_FAMILIA;
    case "PRECEPTOR":
      return NAV_ITEMS_PRECEPTOR;
    default:
      return [];
  }
}

// ============================================
// GLOBAL NAV COMPONENT
// ============================================

interface GlobalNavProps {
  className?: string;
}

export function GlobalNav({ className }: GlobalNavProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const navItems = getNavItems(role);

  if (!role) return null;

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
              "relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "text-sm transition-all duration-200",
              "hover:bg-white/5",
              "active:scale-[0.98]",
              isActive
                ? "text-primary bg-primary/15 font-medium border border-primary/20"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
            )}
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      {/* Separator */}
      <div className="h-px bg-white/5 my-3" />

      {/* New Record Button - Only for staff roles */}
      {role !== "FAMILIA" && (
        <button
          className={cn(
            "w-full h-10 rounded-xl",
            "bg-primary text-primary-foreground",
            "text-sm font-medium",
            "flex items-center justify-center gap-2",
            "hover:brightness-110 transition-all",
            "active:scale-[0.98]",
            "shadow-lg shadow-primary/20"
          )}
        >
          <Plus className="size-4" />
          Nuevo Registro
        </button>
      )}
    </nav>
  );
}

// Export nav items for use in other components
export { NAV_ITEMS_PRECEPTOR as NAV_ITEMS };
