"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  Edit3, 
  Activity, 
  UserX,
  Loader2,
  CheckCircle,
  Clock,
  BookOpen,
  GraduationCap,
  Send,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTodayLocalISO } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

type StaffRole = "DOCENTE" | "PRECEPTOR" | "ADMINISTRATIVO";
type StaffStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  assignedCourses: string[];
  assignedSubjects: string[];
  invitedAt: string;
  lastActivity?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_STAFF: StaffMember[] = [
  { 
    id: "1", 
    name: "Prof. Rodriguez, Maria", 
    email: "rodriguez@escuela.edu.ar", 
    role: "DOCENTE", 
    status: "ACTIVE",
    assignedCourses: ["4to Ano A", "4to Ano B", "5to Ano A"],
    assignedSubjects: ["Matematica", "Fisica"],
    invitedAt: "2024-01-15",
    lastActivity: "Hace 2 horas"
  },
  { 
    id: "2", 
    name: "Martinez, Ana Laura", 
    email: "martinez@escuela.edu.ar", 
    role: "PRECEPTOR", 
    status: "ACTIVE",
    assignedCourses: ["4to Ano A", "4to Ano B"],
    assignedSubjects: [],
    invitedAt: "2024-02-10",
    lastActivity: "Hace 15 min"
  },
  { 
    id: "3", 
    name: "Garcia, Luis Alberto", 
    email: "garcia@escuela.edu.ar", 
    role: "ADMINISTRATIVO", 
    status: "PENDING",
    assignedCourses: [],
    assignedSubjects: [],
    invitedAt: "2024-03-18",
  },
  { 
    id: "4", 
    name: "Prof. Fernandez, Carlos", 
    email: "fernandez@escuela.edu.ar", 
    role: "DOCENTE", 
    status: "ACTIVE",
    assignedCourses: ["3er Ano A", "3er Ano B"],
    assignedSubjects: ["Historia", "Ciudadania"],
    invitedAt: "2024-01-20",
    lastActivity: "Hace 1 dia"
  },
  { 
    id: "5", 
    name: "Lopez, Patricia", 
    email: "lopez@escuela.edu.ar", 
    role: "PRECEPTOR", 
    status: "SUSPENDED",
    assignedCourses: ["5to Ano B"],
    assignedSubjects: [],
    invitedAt: "2023-11-05",
    lastActivity: "Hace 30 dias"
  },
];

const AVAILABLE_COURSES = [
  { id: "3a", name: "3er Ano A" },
  { id: "3b", name: "3er Ano B" },
  { id: "4a", name: "4to Ano A" },
  { id: "4b", name: "4to Ano B" },
  { id: "5a", name: "5to Ano A" },
  { id: "5b", name: "5to Ano B" },
  { id: "6a", name: "6to Ano A" },
];

const AVAILABLE_SUBJECTS = [
  { id: "mat", name: "Matematica" },
  { id: "fis", name: "Fisica" },
  { id: "qui", name: "Quimica" },
  { id: "bio", name: "Biologia" },
  { id: "his", name: "Historia" },
  { id: "geo", name: "Geografia" },
  { id: "len", name: "Lengua y Literatura" },
  { id: "ing", name: "Ingles" },
  { id: "efi", name: "Educacion Fisica" },
  { id: "art", name: "Arte" },
];

const EDUCATION_LEVELS = [
  { id: "inicial", name: "Nivel Inicial", description: "Jardin y Preescolar" },
  { id: "primario", name: "Nivel Primario", description: "1ro a 6to grado" },
  { id: "secundario", name: "Nivel Secundario", description: "1ro a 6to ano" },
];

const ROLE_CARDS = [
  { 
    value: "DOCENTE" as StaffRole, 
    label: "Docente", 
    description: "Acceso a calificaciones, asistencia y planificacion",
    icon: GraduationCap,
    color: "border-[#d0bcff]/30 bg-[#d0bcff]/5 hover:border-[#d0bcff]/50 hover:bg-[#d0bcff]/10",
    selectedColor: "border-[#d0bcff] bg-[#d0bcff]/20",
    iconColor: "text-[#d0bcff]",
  },
  { 
    value: "PRECEPTOR" as StaffRole, 
    label: "Preceptor/a", 
    description: "Gestion de asistencia y seguimiento de alumnos",
    icon: BookOpen,
    color: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10",
    selectedColor: "border-blue-500 bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  { 
    value: "ADMINISTRATIVO" as StaffRole, 
    label: "Administrativo", 
    description: "Acceso a reportes y gestion documental",
    icon: Briefcase,
    color: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10",
    selectedColor: "border-amber-500 bg-amber-500/20",
    iconColor: "text-amber-400",
  },
];

// ============================================
// HELPERS
// ============================================

function getRoleLabel(role: StaffRole): string {
  const labels: Record<StaffRole, string> = {
    DOCENTE: "Docente",
    PRECEPTOR: "Preceptor/a",
    ADMINISTRATIVO: "Administrativo",
  };
  return labels[role];
}

function getRoleColor(role: StaffRole): string {
  const colors: Record<StaffRole, string> = {
    DOCENTE: "bg-[#d0bcff]/10 text-[#d0bcff] border-[#d0bcff]/20",
    PRECEPTOR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ADMINISTRATIVO: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return colors[role];
}

function getStatusConfig(status: StaffStatus): { label: string; color: string; icon: typeof CheckCircle } {
  const configs: Record<StaffStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
    ACTIVE: { label: "Activo", color: "bg-[#4de082]/10 text-[#4de082]", icon: CheckCircle },
    PENDING: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
    SUSPENDED: { label: "Suspendido", color: "bg-[#ffb4ab]/10 text-[#ffb4ab]", icon: UserX },
  };
  return configs[status];
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StaffManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<StaffRole | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<StaffStatus | "ALL">("ALL");
  
  // Invite modal state - Batch Onboarding
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("DOCENTE");
  const [inviteLevel, setInviteLevel] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Parse emails from textarea
  const parsedEmails = useMemo(() => {
    if (!inviteEmails.trim()) return [];
    return inviteEmails
      .split(/[,\n]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0 && email.includes("@"));
  }, [inviteEmails]);

  const emailCount = parsedEmails.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter staff
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "ALL" || member.role === filterRole;
    const matchesStatus = filterStatus === "ALL" || member.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle batch invite
  const handleBatchInvite = useCallback(async () => {
    if (parsedEmails.length === 0) {
      toast.error("Ingresa al menos un correo electronico valido");
      return;
    }

    if ((inviteRole === "DOCENTE" || inviteRole === "PRECEPTOR") && !inviteLevel) {
      toast.error("Selecciona un nivel educativo para este rol");
      return;
    }

    setIsInviting(true);
    
    // Simulate API call with batch processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Add new staff members
    const newMembers: StaffMember[] = parsedEmails.map((email, index) => ({
      id: `batch-${Date.now()}-${index}`,
      name: email.split("@")[0].replace(/[._]/g, " "),
      email,
      role: inviteRole,
      status: "PENDING",
      assignedCourses: [],
      assignedSubjects: [],
      invitedAt: getTodayLocalISO(),
    }));
    
    setStaff((prev) => [...prev, ...newMembers]);
    setIsInviting(false);
    setIsInviteModalOpen(false);
    
    // Reset form
    setInviteEmails("");
    setInviteRole("DOCENTE");
    setInviteLevel("");
    
    toast.success("Invitaciones cifradas enviadas correctamente a los correos indicados", {
      description: `Se enviaron ${parsedEmails.length} invitacion(es) con rol ${getRoleLabel(inviteRole)}`,
    });
  }, [parsedEmails, inviteRole, inviteLevel]);

  // Handle revoke access
  const handleRevokeAccess = useCallback((memberId: string, memberName: string) => {
    setStaff((prev) => 
      prev.map((m) => 
        m.id === memberId ? { ...m, status: "SUSPENDED" as StaffStatus } : m
      )
    );
    toast.success(`Acceso revocado para ${memberName}`);
  }, []);

  // Reset modal state when closing
  const handleCloseModal = useCallback(() => {
    setIsInviteModalOpen(false);
    setInviteEmails("");
    setInviteRole("DOCENTE");
    setInviteLevel("");
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion de Personal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra docentes, preceptores y personal administrativo
          </p>
        </div>
        <Button 
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
        >
          <UserPlus className="size-4" />
          Invitar Miembro
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Personal", value: staff.length, icon: Users, color: "text-[#d0bcff]" },
          { label: "Docentes", value: staff.filter((s) => s.role === "DOCENTE").length, icon: GraduationCap, color: "text-[#d0bcff]" },
          { label: "Preceptores", value: staff.filter((s) => s.role === "PRECEPTOR").length, icon: BookOpen, color: "text-blue-400" },
          { label: "Pendientes", value: staff.filter((s) => s.status === "PENDING").length, icon: Clock, color: "text-yellow-500" },
        ].map((stat, i) => (
          <div 
            key={i}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`size-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/[0.02] border-white/5"
          />
        </div>
        
        {/* Role Filter */}
        <Select value={filterRole} onValueChange={(v) => setFilterRole(v as StaffRole | "ALL")}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white/[0.02] border-white/5">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10">
            <SelectItem value="ALL">Todos los roles</SelectItem>
            <SelectItem value="DOCENTE">Docentes</SelectItem>
            <SelectItem value="PRECEPTOR">Preceptores</SelectItem>
            <SelectItem value="ADMINISTRATIVO">Administrativos</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StaffStatus | "ALL")}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white/[0.02] border-white/5">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10">
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">
                  Miembro
                </th>
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">
                  Rol
                </th>
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">
                  Alcance
                </th>
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">
                  Estado
                </th>
                <th className="text-right text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No se encontraron miembros con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const statusConfig = getStatusConfig(member.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr 
                      key={member.id} 
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Member Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gradient-to-br from-[#d0bcff]/30 to-[#d0bcff]/10 flex items-center justify-center text-sm font-bold text-[#d0bcff] border border-[#d0bcff]/20">
                            {member.name.split(",")[0].charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3" />
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${getRoleColor(member.role)}`}>
                          <Shield className="size-3" />
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      
                      {/* Scope */}
                      <td className="px-4 py-3">
                        <div className="max-w-[200px]">
                          {member.assignedCourses.length > 0 ? (
                            <p className="text-xs text-foreground truncate" title={member.assignedCourses.join(", ")}>
                              {member.assignedCourses.slice(0, 2).join(", ")}
                              {member.assignedCourses.length > 2 && (
                                <span className="text-muted-foreground"> +{member.assignedCourses.length - 2}</span>
                              )}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Sin asignar</p>
                          )}
                          {member.assignedSubjects.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {member.assignedSubjects.join(", ")}
                            </p>
                          )}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full w-fit ${statusConfig.color}`}>
                            <StatusIcon className="size-3" />
                            {statusConfig.label}
                          </span>
                          {member.lastActivity && (
                            <span className="text-[10px] text-muted-foreground">
                              {member.lastActivity}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border-white/10">
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Edit3 className="size-4" />
                              Editar Asignaciones
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Activity className="size-4" />
                              Auditar Actividad
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer text-[#ffb4ab] focus:text-[#ffb4ab] focus:bg-[#ffb4ab]/10"
                              onClick={() => handleRevokeAccess(member.id, member.name)}
                            >
                              <UserX className="size-4" />
                              Revocar Acceso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[560px] bg-[#131319] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <UserPlus className="size-5 text-[#d0bcff]" />
              Aprovisionamiento por Lotes
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Invita multiples miembros del personal de forma masiva y segura.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Step 1: Role Selection */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Paso 1: Seleccionar Jerarquia
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLE_CARDS.map((role) => {
                  const Icon = role.icon;
                  const isSelected = inviteRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setInviteRole(role.value);
                        if (role.value === "ADMINISTRATIVO") {
                          setInviteLevel("");
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all duration-200",
                        isSelected ? role.selectedColor : role.color
                      )}
                    >
                      <Icon className={cn("size-6 mb-2", role.iconColor)} />
                      <p className="text-sm font-semibold text-[#e4e1ea]">{role.label}</p>
                      <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Email Input (Drive Style) */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Paso 2: Ingresar Correos (Separados por coma o salto de linea)
              </Label>
              <Textarea
                placeholder="juan.perez@escuela.edu.ar, maria.gomez@escuela.edu.ar&#10;carlos.lopez@escuela.edu.ar"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                className="min-h-[100px] bg-white/[0.02] border-white/10 text-sm resize-none font-mono"
              />
              {/* Dynamic Helper */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                emailCount > 0 
                  ? "bg-[#4de082]/10 border border-[#4de082]/20 text-[#4de082]" 
                  : "bg-white/[0.02] border border-white/5 text-white/40"
              )}>
                <Mail className="size-4" />
                {emailCount > 0 ? (
                  <span>
                    Se enviaran <strong>{emailCount}</strong> invitacion(es) segura(s) con el rol <strong>{getRoleLabel(inviteRole)}</strong>.
                  </span>
                ) : (
                  <span>Ingresa correos electronicos para continuar</span>
                )}
              </div>
            </div>

            {/* Step 3: Level Selection (Conditional) */}
            {(inviteRole === "DOCENTE" || inviteRole === "PRECEPTOR") && (
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-white/50">
                  Paso 3: Nivel Educativo de Acceso
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {EDUCATION_LEVELS.map((level) => {
                    const isSelected = inviteLevel === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setInviteLevel(level.id)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all duration-200",
                          isSelected 
                            ? "border-[#d0bcff] bg-[#d0bcff]/10" 
                            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        )}
                      >
                        <p className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-[#d0bcff]" : "text-[#e4e1ea]"
                        )}>
                          {level.name}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {level.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <Button 
              variant="outline" 
              onClick={handleCloseModal}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBatchInvite}
              disabled={isInviting || emailCount === 0 || ((inviteRole === "DOCENTE" || inviteRole === "PRECEPTOR") && !inviteLevel)}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
            >
              {isInviting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando lote...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Enviar {emailCount > 0 ? `${emailCount} ` : ""}Invitacion(es)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Toaster theme="dark" />
    </div>
  );
}
