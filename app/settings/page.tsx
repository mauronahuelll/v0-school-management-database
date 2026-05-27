"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ShieldAlert, 
  Settings, 
  GraduationCap, 
  ClipboardList,
  Save,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Plus,
  Users,
  Eye,
  Pencil,
  FileWarning,
  BarChart3,
  Trash2,
  X
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface SystemRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
  color: string;
}

interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const SYSTEM_ROLES: SystemRole[] = [
  {
    id: "admin",
    name: "Administrador",
    description: "Control total del sistema",
    isSystem: true,
    userCount: 2,
    permissions: ["all"],
    color: "purple",
  },
  {
    id: "docente",
    name: "Docente",
    description: "Carga de notas y asistencia de sus cursos",
    isSystem: true,
    userCount: 34,
    permissions: ["ver_notas", "cargar_notas", "ver_asistencia"],
    color: "blue",
  },
  {
    id: "preceptor",
    name: "Preceptor",
    description: "Gestion de asistencia y convivencia",
    isSystem: true,
    userCount: 8,
    permissions: ["ver_notas", "cargar_notas", "ver_asistencia", "cargar_asistencia", "emitir_sanciones"],
    color: "emerald",
  },
  {
    id: "familia",
    name: "Familia/Tutor",
    description: "Consulta de notas y comunicados de sus hijos",
    isSystem: true,
    userCount: 412,
    permissions: ["ver_notas", "ver_asistencia", "ver_comunicados"],
    color: "amber",
  },
];

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: "ver_notas", label: "Ver Calificaciones", description: "Consultar notas de alumnos", category: "Calificaciones" },
  { id: "cargar_notas", label: "Cargar Calificaciones", description: "Ingresar y modificar notas", category: "Calificaciones" },
  { id: "ver_asistencia", label: "Ver Asistencia", description: "Consultar registros de asistencia", category: "Asistencia" },
  { id: "cargar_asistencia", label: "Cargar Asistencia", description: "Registrar asistencia diaria", category: "Asistencia" },
  { id: "emitir_sanciones", label: "Emitir Sanciones", description: "Crear actas de convivencia", category: "Convivencia" },
  { id: "ver_analitica", label: "Ver Analitica", description: "Acceder a metricas institucionales", category: "Sistema" },
];

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center space-y-6 p-10 bg-white/[0.02] border border-red-500/20 rounded-3xl backdrop-blur-md max-w-md">
        <div className="mx-auto w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-400">403</h1>
          <h2 className="text-lg font-semibold text-[#e4e1ea]">Acceso Restringido</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Esta zona es exclusiva para la administracion de la institucion. 
            Si crees que deberias tener acceso, contacta al administrador del sistema.
          </p>
        </div>
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-white/30 font-mono">
            SECURITY_VIOLATION: INSUFFICIENT_PRIVILEGES
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE ROLE MODAL
// ============================================================================

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (role: Partial<SystemRole>) => void;
}

function CreateRoleModal({ open, onOpenChange, onSave }: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [inheritFrom, setInheritFrom] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const handleInheritChange = (roleId: string) => {
    setInheritFrom(roleId);
    const baseRole = SYSTEM_ROLES.find(r => r.id === roleId);
    if (baseRole) {
      setSelectedPermissions(baseRole.permissions.filter(p => p !== "all"));
    }
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Ingresa un nombre para el rol");
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    onSave({
      name: roleName,
      permissions: selectedPermissions,
      isSystem: false,
      userCount: 0,
      color: "slate",
    });
    
    setIsSaving(false);
    setRoleName("");
    setInheritFrom("");
    setSelectedPermissions([]);
    onOpenChange(false);
    
    toast.success("Rol creado. Ya puede asignarse al personal.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131319] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#e4e1ea] flex items-center gap-2">
            <Shield className="size-5 text-purple-400" />
            Crear Rol Personalizado
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Define un nuevo rol con permisos especificos para el personal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role Name */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Nombre del Rol</Label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Ej: Ayudante de Laboratorio"
              className="bg-white/[0.02] border-white/10 h-11"
            />
          </div>

          {/* Inherit From */}
          <div className="space-y-2">
            <Label className="text-xs text-white/60">Heredar permisos base de</Label>
            <Select value={inheritFrom} onValueChange={handleInheritChange}>
              <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                <SelectValue placeholder="Seleccionar rol base (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="docente">Docente</SelectItem>
                <SelectItem value="preceptor">Preceptor</SelectItem>
                <SelectItem value="familia">Familia/Tutor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions Grid */}
          <div className="space-y-3">
            <Label className="text-xs text-white/60">Modulos Permitidos</Label>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <div 
                  key={perm.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-colors",
                    selectedPermissions.includes(perm.id)
                      ? "bg-purple-500/10 border-purple-500/30"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      selectedPermissions.includes(perm.id) ? "bg-purple-500/20" : "bg-white/5"
                    )}>
                      {perm.category === "Calificaciones" && <GraduationCap className="size-4 text-blue-400" />}
                      {perm.category === "Asistencia" && <ClipboardList className="size-4 text-emerald-400" />}
                      {perm.category === "Convivencia" && <FileWarning className="size-4 text-amber-400" />}
                      {perm.category === "Sistema" && <BarChart3 className="size-4 text-purple-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#e4e1ea]">{perm.label}</p>
                      <p className="text-[10px] text-white/40">{perm.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={selectedPermissions.includes(perm.id)}
                    onCheckedChange={() => handleTogglePermission(perm.id)}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !roleName.trim()}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-2" />
                Crear Rol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SettingsPage() {
  const { activeContext } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  
  // Form states
  const [academicFormat, setAcademicFormat] = useState("trimestral");
  const [gradingModel, setGradingModel] = useState("numerico");
  const [enablePreliminary, setEnablePreliminary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Roles management
  const [roles, setRoles] = useState<SystemRole[]>(SYSTEM_ROLES);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

  // Hydration-safe initialization with localStorage fallback
  useEffect(() => {
    setMounted(true);
    const role = activeContext?.role || localStorage.getItem("sequency_dev_role") || null;
    setCurrentRole(role);
  }, [activeContext]);

  // Handle save action
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSaving(false);
    toast.success("Politicas institucionales actualizadas y propagadas al sistema");
  };

  // Handle create role
  const handleCreateRole = useCallback((newRole: Partial<SystemRole>) => {
    const role: SystemRole = {
      id: `custom_${Date.now()}`,
      name: newRole.name || "Nuevo Rol",
      description: "Rol personalizado",
      isSystem: false,
      userCount: 0,
      permissions: newRole.permissions || [],
      color: "slate",
    };
    setRoles(prev => [...prev, role]);
  }, []);

  // Loading state to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-pulse text-white/30">Cargando configuracion...</div>
      </div>
    );
  }

  // Route Guard: Block non-ADMIN access
  if (currentRole !== "ADMIN") {
    return <AccessDenied />;
  }

  // ADMIN View: Full configuration panel
  return (
    <div className="space-y-6 text-[#e4e1ea]">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/[0.01] border border-white/[0.05] rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
              Panel de Control
            </span>
            <h1 className="text-xl font-bold tracking-tight">Configuracion Institucional</h1>
            <p className="text-xs text-white/40">Politicas academicas, parametros y gestion de roles</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Acceso Verificado: ADMIN
          </div>
        </div>
      </header>

      {/* Main Configuration Tabs */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-md">
        <Tabs defaultValue="regimen" className="space-y-6">
          <TabsList className="bg-black/40 border border-white/5 p-1 rounded-2xl w-full md:w-auto flex-wrap">
            <TabsTrigger 
              value="regimen" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Regimen Academico
            </TabsTrigger>
            <TabsTrigger 
              value="valoraciones"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Valoraciones
            </TabsTrigger>
            <TabsTrigger 
              value="roles"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-xl px-4 py-2 text-sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Permisos y Roles
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Regimen Academico */}
          <TabsContent value="regimen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formato del Ano */}
              <div className="space-y-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Formato del Ano Lectivo</h3>
                    <p className="text-[10px] text-white/40">Division temporal del ciclo escolar</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Regimen de Periodos</Label>
                  <Select value={academicFormat} onValueChange={setAcademicFormat}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bimestral">Bimestral (4 periodos)</SelectItem>
                      <SelectItem value="trimestral">Trimestral (3 periodos) - Recomendado</SelectItem>
                      <SelectItem value="cuatrimestral">Cuatrimestral (2 periodos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <p className="text-[10px] text-blue-300/70 leading-relaxed">
                    El regimen seleccionado define los cortes de calificaciones y la estructura 
                    de los boletines que se generan para las familias.
                  </p>
                </div>
              </div>

              {/* Modelo de Calificacion */}
              <div className="space-y-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Modelo de Calificacion</h3>
                    <p className="text-[10px] text-white/40">Sistema de evaluacion principal</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Escala de Notas</Label>
                  <Select value={gradingModel} onValueChange={setGradingModel}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numerico">Numerico (1-10)</SelectItem>
                      <SelectItem value="alfanumerico">Alfanumerico (A-F)</SelectItem>
                      <SelectItem value="conceptual">Conceptual (Excelente/Bueno/Regular/Insuficiente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <p className="text-[10px] text-amber-300/70 leading-relaxed">
                    El modelo numerico 1-10 es el estandar en Argentina para nivel secundario. 
                    El conceptual se usa comunmente en nivel inicial.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Valoraciones Preliminares */}
          <TabsContent value="valoraciones" className="space-y-6">
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">
                      Entregas Preliminares (TEA/TEP/TED)
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed max-w-xl">
                      Habilita las trayectorias escolares anticipadas a mitad de periodo. 
                      Esto permite a los docentes registrar valoraciones intermedias.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-[10px] font-mono rounded-lg border border-purple-500/20">
                        TEA: Avanzada
                      </span>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-300 text-[10px] font-mono rounded-lg border border-blue-500/20">
                        TEP: En Proceso
                      </span>
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-300 text-[10px] font-mono rounded-lg border border-amber-500/20">
                        TED: Dificultades
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <Switch 
                    checked={enablePreliminary}
                    onCheckedChange={setEnablePreliminary}
                    className="data-[state=checked]:bg-purple-500"
                  />
                  <span className={`text-[10px] font-mono ${enablePreliminary ? 'text-green-400' : 'text-white/30'}`}>
                    {enablePreliminary ? 'HABILITADO' : 'DESHABILITADO'}
                  </span>
                </div>
              </div>

              {enablePreliminary && (
                <div className="mt-6 p-4 bg-green-500/5 border border-green-500/10 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-300/70 leading-relaxed">
                    Las entregas preliminares estan activas. Los docentes podran cargar 
                    valoraciones TEA/TEP/TED y las familias recibiran notificaciones automaticas.
                  </p>
                </div>
              )}

              {!enablePreliminary && (
                <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/70 leading-relaxed">
                    Las entregas preliminares estan desactivadas. Solo se emitiran boletines 
                    oficiales al cierre de cada periodo segun el regimen academico configurado.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Gestion de Permisos y Roles */}
          <TabsContent value="roles" className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Roles del Sistema</h3>
                <p className="text-xs text-white/40 mt-1">Administra los permisos de acceso del personal</p>
              </div>
              <Button
                onClick={() => setIsCreateRoleOpen(true)}
                className="bg-purple-600 hover:bg-purple-500"
              >
                <Plus className="size-4 mr-2" />
                Crear Rol Personalizado
              </Button>
            </div>

            {/* Roles Table */}
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Descripcion
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Permisos
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            role.color === "purple" && "bg-purple-500/10 border border-purple-500/20",
                            role.color === "blue" && "bg-blue-500/10 border border-blue-500/20",
                            role.color === "emerald" && "bg-emerald-500/10 border border-emerald-500/20",
                            role.color === "amber" && "bg-amber-500/10 border border-amber-500/20",
                            role.color === "slate" && "bg-slate-500/10 border border-slate-500/20",
                          )}>
                            <Shield className={cn(
                              "size-5",
                              role.color === "purple" && "text-purple-400",
                              role.color === "blue" && "text-blue-400",
                              role.color === "emerald" && "text-emerald-400",
                              role.color === "amber" && "text-amber-400",
                              role.color === "slate" && "text-slate-400",
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#e4e1ea]">{role.name}</p>
                            {role.isSystem && (
                              <span className="text-[10px] text-white/30 font-mono">SISTEMA</span>
                            )}
                            {!role.isSystem && (
                              <span className="text-[10px] text-purple-400 font-mono">PERSONALIZADO</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-white/50">{role.description}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5">
                          <Users className="size-3.5 text-white/40" />
                          <span className="text-sm font-medium text-[#e4e1ea]">{role.userCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs text-white/50">
                          {role.permissions.includes("all") ? "Todos" : `${role.permissions.length} permisos`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/5"
                          >
                            <Eye className="size-4" />
                          </Button>
                          {!role.isSystem && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/5"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Permissions Legend */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
              <h4 className="text-xs font-bold text-white/60 mb-3">Leyenda de Permisos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <div key={perm.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-white/70">{perm.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Button - Floating Action */}
      <div className="sticky bottom-6 flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-purple-500/20 transition-all"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Guardar Politicas Institucionales
            </>
          )}
        </Button>
      </div>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={isCreateRoleOpen}
        onOpenChange={setIsCreateRoleOpen}
        onSave={handleCreateRole}
      />
    </div>
  );
}
