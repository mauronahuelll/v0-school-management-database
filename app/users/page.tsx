"use client";

import { useState, useEffect, useCallback } from "react";
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
  X
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
import { Checkbox } from "@/components/ui/checkbox";

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
  
  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("DOCENTE");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);

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

  // Handle invite
  const handleInvite = useCallback(async () => {
    if (!inviteEmail.trim()) {
      toast.error("Ingresa un correo electronico valido");
      return;
    }

    setIsInviting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Add new staff member
    const newMember: StaffMember = {
      id: `new-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "PENDING",
      assignedCourses: selectedCourses,
      assignedSubjects: selectedSubjects,
      invitedAt: new Date().toISOString().split("T")[0],
    };
    
    setStaff((prev) => [...prev, newMember]);
    setIsInviting(false);
    setIsInviteModalOpen(false);
    
    // Reset form
    setInviteEmail("");
    setInviteRole("DOCENTE");
    setSelectedCourses([]);
    setSelectedSubjects([]);
    
    toast.success("Enlace de alta y token enviados al correo del usuario", {
      description: `Invitacion enviada a ${inviteEmail}`,
    });
  }, [inviteEmail, inviteRole, selectedCourses, selectedSubjects]);

  // Handle revoke access
  const handleRevokeAccess = useCallback((memberId: string, memberName: string) => {
    setStaff((prev) => 
      prev.map((m) => 
        m.id === memberId ? { ...m, status: "SUSPENDED" as StaffStatus } : m
      )
    );
    toast.success(`Acceso revocado para ${memberName}`);
  }, []);

  // Handle toggle course selection
  const toggleCourse = (courseName: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseName)
        ? prev.filter((c) => c !== courseName)
        : [...prev, courseName]
    );
  };

  // Handle toggle subject selection
  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((s) => s !== subjectName)
        : [...prev, subjectName]
    );
  };

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

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-[#d0bcff]" />
              Invitar Nuevo Miembro
            </DialogTitle>
            <DialogDescription>
              Envia una invitacion por correo electronico para dar acceso al sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electronico Institucional</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@escuela.edu.ar"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-white/[0.02] border-white/10"
              />
            </div>
            
            {/* Role */}
            <div className="space-y-2">
              <Label>Rol a Asignar</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as StaffRole)}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="DOCENTE">Docente</SelectItem>
                  <SelectItem value="PRECEPTOR">Preceptor/a</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Course Assignment */}
            <div className="space-y-2">
              <Label>Asignacion de Cursos</Label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5 max-h-[120px] overflow-y-auto">
                {AVAILABLE_COURSES.map((course) => (
                  <div key={course.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`course-${course.id}`}
                      checked={selectedCourses.includes(course.name)}
                      onCheckedChange={() => toggleCourse(course.name)}
                    />
                    <label 
                      htmlFor={`course-${course.id}`}
                      className="text-xs text-foreground cursor-pointer"
                    >
                      {course.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Subject Assignment (only for DOCENTE) */}
            {inviteRole === "DOCENTE" && (
              <div className="space-y-2">
                <Label>Asignacion de Materias</Label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5 max-h-[120px] overflow-y-auto">
                  {AVAILABLE_SUBJECTS.map((subject) => (
                    <div key={subject.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.name)}
                        onCheckedChange={() => toggleSubject(subject.name)}
                      />
                      <label 
                        htmlFor={`subject-${subject.id}`}
                        className="text-xs text-foreground cursor-pointer"
                      >
                        {subject.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsInviteModalOpen(false)}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail.trim()}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
            >
              {isInviting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  Enviar Invitacion
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
