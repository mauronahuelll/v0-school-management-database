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
  FileText,
  Send,
  AlertTriangle,
  Loader2,
  LineChart,
  BookOpen,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, Role } from "@/lib/context/auth-context";
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
  { id: "users", label: "Personal", href: "/users", icon: UserCheck },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/settings", icon: Settings },
];

// PRECEPTOR sees operational labels
const NAV_ITEMS_PRECEPTOR = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Parte Diario", href: "/attendance", icon: ClipboardCheck },
  { id: "grades", label: "Calificaciones", href: "/grades", icon: BookOpen },
  { id: "behavior", label: "Convivencia", href: "/behavior", icon: Users },
  { id: "secretaria", label: "Secretaria", href: "/students", icon: Building2 },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/settings", icon: Settings },
];

// DOCENTE sees teaching-focused labels
const NAV_ITEMS_DOCENTE = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Parte Diario", href: "/attendance", icon: ClipboardCheck },
  { id: "grades", label: "Calificaciones", href: "/grades", icon: BookOpen },
  { id: "calendar", label: "Calendario", href: "/calendar", icon: Calendar },
  { id: "settings", label: "Ajustes", href: "/settings", icon: Settings },
];

const NAV_ITEMS_FAMILIA = [
  { id: "dashboard", label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { id: "community", label: "Muro Escolar", href: "/community", icon: MessageSquare },
  { id: "procedures", label: "Tramites", href: "/procedures", icon: FileText },
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
  const { role } = useAuth();
  const navItems = getNavItems(role);
  
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
