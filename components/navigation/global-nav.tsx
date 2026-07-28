"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  Users,
  Calendar,
  Settings,
  GraduationCap,
  Plus,
  UserCheck,
  Building2,
  MessageSquare,
  Megaphone,
  FileText,
  Send,
  AlertTriangle,
  Loader2,
  LineChart,
  BookOpen,
  BookHeart,
  Scale,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, Role } from "@/lib/context/auth-context";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ============================================
// NAVIGATION ITEMS BY ROLE (Polymorphic Labels)
// ============================================

// ADMIN sees management-focused labels
const NAV_ITEMS_ADMIN = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Control RRHH", href: "/attendance", icon: Users },
  { id: "grades", label: "Monitoreo Academico", href: "/grades", icon: LineChart },
  { id: "behavior", label: "Gestion de Convivencia", href: "/behavior", icon: Scale },
  { id: "secretaria", label: "Secretaria", href: "/students", icon: Building2 },
  { id: "community", label: "Muro Escolar", href: "/community", icon: Megaphone },
  { id: "communications", label: "Comunicaciones", href: "/communications", icon: Send },
  { id: "users", label: "Personal", href: "/users", icon: UserCheck },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "my-profile", label: "Mi Perfil", href: "/my-profile", icon: UserCircle },
  { id: "settings", label: "Ajustes", href: "/settings", icon: Settings },
];

// PRECEPTOR sees operational labels
const NAV_ITEMS_PRECEPTOR = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Parte Diario", href: "/attendance", icon: ClipboardCheck },
  { id: "grades", label: "Calificaciones", href: "/grades", icon: BookOpen },
  { id: "behavior", label: "Convivencia", href: "/behavior", icon: Users },
  { id: "secretaria", label: "Secretaria", href: "/students", icon: Building2 },
  { id: "community", label: "Muro Escolar", href: "/community", icon: Megaphone },
  { id: "communications", label: "Comunicaciones", href: "/communications", icon: Send },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "my-profile", label: "Mi Perfil", href: "/my-profile", icon: UserCircle },
  { id: "settings", label: "Ajustes", href: "/settings", icon: Settings },
];

// DOCENTE sees teaching-focused labels
const NAV_ITEMS_DOCENTE = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Parte Diario", href: "/attendance", icon: ClipboardCheck },
  { id: "grades", label: "Calificaciones", href: "/grades", icon: BookOpen },
  { id: "community", label: "Muro Escolar", href: "/community", icon: Megaphone },
  { id: "communications", label: "Comunicaciones", href: "/communications", icon: Send },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "my-profile", label: "Mi Perfil", href: "/my-profile", icon: UserCircle },
  { id: "settings", label: "Ajustes", href: "/settings", icon: Settings },
];

const NAV_ITEMS_FAMILIA = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "community", label: "Novedades", href: "/community", icon: Megaphone },
  { id: "procedures", label: "Tramites", href: "/procedures", icon: FileText },
  // "Perfil Alumno" (/student) eliminado: FAMILIA accede al perfil del hijo
  // directamente desde el Dashboard Multihijo — el ítem era redundante y confuso.
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
];

// ============================================
// CHILD CONTEXT SWITCHER — Solo rol FAMILIA
// ============================================

export type Child = {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  level: string;
  initials: string;
  color: string;
};

export const MOCK_CHILDREN: Child[] = [
  {
    id: "child-1",
    firstName: "Tomas",
    lastName: "Perez",
    grade: "3er Grado",
    level: "Primaria",
    initials: "TP",
    color: "from-violet-500/40 to-purple-600/40",
  },
  {
    id: "child-2",
    firstName: "Sofia",
    lastName: "Perez",
    grade: "2do Año",
    level: "Secundaria",
    initials: "SP",
    color: "from-rose-500/40 to-pink-600/40",
  },
];

interface ChildContextSwitcherProps {
  /** compact=true para el header mobile (solo avatar + chevron) */
  compact?: boolean;
}

export function ChildContextSwitcher({ compact = false }: ChildContextSwitcherProps) {
  const { role } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>(MOCK_CHILDREN[0].id);
  const [isSwitching, setIsSwitching] = useState(false);

  if (role !== "FAMILIA") return null;

  const selected = MOCK_CHILDREN.find(c => c.id === selectedChildId) ?? MOCK_CHILDREN[0];

  const handleSelect = async (child: Child) => {
    if (child.id === selectedChildId) return;
    setIsSwitching(true);
    toast.info(`Cambiando al perfil de ${child.firstName} ${child.lastName}...`);
    // Simula recarga de datos del contexto del hijo
    await new Promise(r => setTimeout(r, 900));
    setSelectedChildId(child.id);
    setIsSwitching(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isSwitching}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border transition-all duration-200",
            "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
            "disabled:opacity-60 disabled:cursor-wait",
            compact ? "p-1.5" : "w-full px-3 py-2.5"
          )}
        >
          <Avatar className="size-7 shrink-0">
            <AvatarFallback
              className={cn(
                "text-[10px] font-bold bg-gradient-to-br text-white/90",
                selected.color
              )}
            >
              {selected.initials}
            </AvatarFallback>
          </Avatar>

          {!compact && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {selected.firstName} {selected.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">
                {selected.grade} — {selected.level}
              </p>
            </div>
          )}

          <ChevronDown
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200",
              compact ? "size-3.5" : "size-3.5 ml-auto"
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={compact ? "end" : "start"}
        sideOffset={6}
        className="w-56 bg-[#131319] border-white/10 p-1.5"
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-[10px] uppercase tracking-widest text-white/35 font-semibold">
          <Users2 className="size-3" />
          Perfil activo
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 my-1" />

        {MOCK_CHILDREN.map(child => {
          const isActive = child.id === selectedChildId;
          return (
            <DropdownMenuItem
              key={child.id}
              onClick={() => handleSelect(child)}
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors",
                "focus:bg-white/[0.05]",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-white/70 hover:text-white"
              )}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-[11px] font-bold bg-gradient-to-br text-white/90",
                    child.color
                  )}
                >
                  {child.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isActive ? "text-primary" : "text-foreground")}>
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {child.grade} — {child.level}
                </p>
              </div>
              {isActive && (
                <ChevronRight className="size-3.5 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

// Course options for notifications
const AVAILABLE_COURSES = [
  { id: "3a", name: "3er Ano A" },
  { id: "3b", name: "3er Ano B" },
  { id: "4a", name: "4to Ano A" },
  { id: "4b", name: "4to Ano B" },
  { id: "5a", name: "5to Ano A" },
  { id: "5b", name: "5to Ano B" },
  { id: "6a", name: "6to Ano A" },
];

// ============================================
// GLOBAL NAV COMPONENT
// ============================================

interface GlobalNavProps {
  className?: string;
}

export function GlobalNav({ className }: GlobalNavProps) {
  const pathname = usePathname();
  const { role, activeContext } = useAuth();
  const isInitialLevel = activeContext?.level === "INICIAL";

  // Mutar el item "grades" según el nivel educativo del contexto activo
  const navItems = getNavItems(role ?? "FAMILIA").map((item) => {
    if (item.id === "grades" && isInitialLevel) {
      return { ...item, label: "Informes de Progreso", icon: BookHeart };
    }
    return item;
  });
  
  // Communication Dialog State
  const [isCommDialogOpen, setIsCommDialogOpen] = useState(false);
  const [commMessage, setCommMessage] = useState("");
  const [commPriority, setCommPriority] = useState<"NORMAL" | "ALTA">("NORMAL");
  const [commCourse, setCommCourse] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Determine dialog type based on role
  const isAdmin = role === "ADMIN";
  const isStaffWithFamilyAccess = role === "DOCENTE" || role === "PRECEPTOR";
  const canSendComm = role !== "FAMILIA" && role !== null;
  
  const dialogTitle = isAdmin ? "Aviso al Personal" : "Notificacion a Familias";
  const dialogDescription = isAdmin 
    ? "Este mensaje se enviara obligatoriamente a todos los tableros de Docentes y Preceptores."
    : "Selecciona un curso para enviar un aviso directo al Legajo y Muro de los alumnos.";
  
  // Handle send communication
  const handleSendCommunication = useCallback(async () => {
    if (!commMessage.trim()) {
      toast.error("Escribe un mensaje para continuar");
      return;
    }
    
    if (isStaffWithFamilyAccess && !commCourse) {
      toast.error("Selecciona un curso destinatario");
      return;
    }
    
    setIsSending(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSending(false);
    setIsCommDialogOpen(false);
    setCommMessage("");
    setCommPriority("NORMAL");
    setCommCourse("");
    
    toast.success("Comunicacion cifrada y distribuida a los destinatarios", {
      description: isAdmin 
        ? "Aviso enviado a todo el personal institucional"
        : `Notificacion enviada a las familias de ${AVAILABLE_COURSES.find(c => c.id === commCourse)?.name}`,
    });
  }, [commMessage, commCourse, isAdmin, isStaffWithFamilyAccess]);

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
              "text-sm transition-all duration-300",
              "active:scale-[0.98]",
              isActive
                ? "bg-white/10 text-[#D0BCFF] font-semibold border-r-2 border-[#8A2BE2] border-t border-t-transparent border-b border-b-transparent border-l border-l-transparent"
                : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#8A2BE2] rounded-r-full shadow-[0_0_8px_rgba(138,43,226,0.7)]" />
            )}
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      {/* Separator */}
      <div className="h-px bg-white/5 my-3" />

      {/* Child Context Switcher — solo rol FAMILIA */}
      {role === "FAMILIA" && (
        <div className="space-y-1.5 mb-1">
          <p className="px-1 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
            Alumno activo
          </p>
          <ChildContextSwitcher />
        </div>
      )}

      {/* New Communication Button - Only for staff roles */}
      {canSendComm && (
        <button
          onClick={() => setIsCommDialogOpen(true)}
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
          Nueva Comunicacion
        </button>
      )}
      
      {/* Communication Dialog */}
      <Dialog open={isCommDialogOpen} onOpenChange={setIsCommDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#131319] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <MessageSquare className="size-5 text-[#d0bcff]" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-5">
            {/* Course Selection (Only for DOCENTE/PRECEPTOR) */}
            {isStaffWithFamilyAccess && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-white/50">
                  Curso Destinatario
                </Label>
                <Select value={commCourse} onValueChange={setCommCourse}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar curso..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {AVAILABLE_COURSES.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Message */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Mensaje
              </Label>
              <Textarea
                value={commMessage}
                onChange={(e) => setCommMessage(e.target.value)}
                placeholder={isAdmin 
                  ? "Escriba el aviso para el personal docente y preceptores..."
                  : "Escriba la notificacion para las familias del curso..."
                }
                className="min-h-[120px] bg-white/[0.02] border-white/10 resize-none"
              />
            </div>
            
            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Prioridad
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCommPriority("NORMAL")}
                  className={cn(
                    "flex-1 p-3 rounded-lg border text-sm font-medium transition-all",
                    commPriority === "NORMAL"
                      ? "border-[#d0bcff] bg-[#d0bcff]/10 text-[#d0bcff]"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  )}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setCommPriority("ALTA")}
                  className={cn(
                    "flex-1 p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                    commPriority === "ALTA"
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  )}
                >
                  <AlertTriangle className="size-4" />
                  Alta
                </button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <Button 
              variant="outline" 
              onClick={() => setIsCommDialogOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSendCommunication}
              disabled={isSending || !commMessage.trim() || (isStaffWithFamilyAccess && !commCourse)}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Enviar Comunicacion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

// Export nav items for use in other components
export { NAV_ITEMS_PRECEPTOR as NAV_ITEMS };
