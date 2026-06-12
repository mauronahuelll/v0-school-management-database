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
  Settings2,
  Plus,
  X,
  FileText,
  AlertTriangle,
  Upload,
  Calendar,
  Phone,
  MapPin,
  Eye,
  Check,
  Ban,
  ShieldCheck,
  FileSearch,
  Trash2,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getTodayLocalISO } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

type StaffRole = "DOCENTE" | "PRECEPTOR" | "ADMINISTRATIVO";
type StaffStatus = "ACTIVE" | "PENDING" | "SUSPENDED";
type DocumentStatus = "AL_DIA" | "VENCIDO" | "FALTA_ENTREGAR" | "EN_REVISION" | "RECHAZADO";

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
  phone?: string;
  address?: string;
  cuil?: string;
}

interface StaffDocument {
  id: string;
  name: string;
  description: string;
  status: DocumentStatus;
  expirationDate?: string;
  uploadedAt?: string;
  rejectionReason?: string;
  uploadedByAdmin?: boolean;
}

interface StaffAttendanceRecord {
  year: number;
  totalDays: number;
  presentDays: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  lateArrivals: number;
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
    lastActivity: "Hace 2 horas",
    phone: "+54 11 5555-1234",
    address: "Av. Corrientes 1234, CABA",
    cuil: "27-28456789-4",
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
    lastActivity: "Hace 15 min",
    phone: "+54 11 5555-5678",
    address: "Calle Florida 567, CABA",
    cuil: "27-30123456-8",
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
    phone: "+54 11 5555-9012",
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
    lastActivity: "Hace 1 dia",
    phone: "+54 11 5555-3456",
    address: "Belgrano 890, CABA",
    cuil: "20-25789012-3",
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
    lastActivity: "Hace 30 dias",
    phone: "+54 11 5555-7890",
  },
];

// Mock documents for staff legajo
const MOCK_DOCUMENTS: Record<string, StaffDocument[]> = {
  "1": [
    { id: "d1", name: "Declaracion Jurada (DD.JJ.) de Cargos", description: "Declaracion anual de cargos publicos", status: "AL_DIA", uploadedAt: "2024-03-01", expirationDate: "2025-03-01" },
    { id: "d2", name: "Titulo Habilitante", description: "Titulo universitario o terciario", status: "AL_DIA", uploadedAt: "2024-01-15" },
    { id: "d3", name: "Apto Medico", description: "Certificado de aptitud psicofisica", status: "EN_REVISION", uploadedAt: "2024-06-10" },
    { id: "d4", name: "Antecedentes Penales", description: "Certificado de antecedentes", status: "AL_DIA", uploadedAt: "2024-02-20", expirationDate: "2025-02-20" },
  ],
  "2": [
    { id: "d1", name: "Declaracion Jurada (DD.JJ.) de Cargos", description: "Declaracion anual de cargos publicos", status: "AL_DIA", uploadedAt: "2024-02-15", expirationDate: "2025-02-15" },
    { id: "d2", name: "Titulo Habilitante", description: "Titulo universitario o terciario", status: "AL_DIA", uploadedAt: "2024-02-10" },
    { id: "d3", name: "Apto Medico", description: "Certificado de aptitud psicofisica", status: "FALTA_ENTREGAR" },
    { id: "d4", name: "Antecedentes Penales", description: "Certificado de antecedentes", status: "AL_DIA", uploadedAt: "2024-01-10", expirationDate: "2025-01-10" },
  ],
  "4": [
    { id: "d1", name: "Declaracion Jurada (DD.JJ.) de Cargos", description: "Declaracion anual de cargos publicos", status: "FALTA_ENTREGAR" },
    { id: "d2", name: "Titulo Habilitante", description: "Titulo universitario o terciario", status: "AL_DIA", uploadedAt: "2024-01-20" },
    { id: "d3", name: "Apto Medico", description: "Certificado de aptitud psicofisica", status: "AL_DIA", uploadedAt: "2024-05-01", expirationDate: "2025-05-01" },
    { id: "d4", name: "Antecedentes Penales", description: "Certificado de antecedentes", status: "VENCIDO", uploadedAt: "2023-01-20", expirationDate: "2024-01-20" },
  ],
};

// Mock attendance records
const MOCK_ATTENDANCE: Record<string, StaffAttendanceRecord> = {
  "1": { year: 2024, totalDays: 120, presentDays: 112, justifiedAbsences: 5, unjustifiedAbsences: 1, lateArrivals: 2 },
  "2": { year: 2024, totalDays: 120, presentDays: 118, justifiedAbsences: 2, unjustifiedAbsences: 0, lateArrivals: 0 },
  "4": { year: 2024, totalDays: 120, presentDays: 105, justifiedAbsences: 10, unjustifiedAbsences: 3, lateArrivals: 2 },
  "5": { year: 2024, totalDays: 120, presentDays: 80, justifiedAbsences: 15, unjustifiedAbsences: 20, lateArrivals: 5 },
};

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

function getDocumentStatusConfig(status: DocumentStatus): { label: string; color: string; bgColor: string } {
  const configs: Record<DocumentStatus, { label: string; color: string; bgColor: string }> = {
    AL_DIA: { label: "Aprobado", color: "text-[#4de082]", bgColor: "bg-[#4de082]/10 border-[#4de082]/20" },
    VENCIDO: { label: "Vencido", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
    FALTA_ENTREGAR: { label: "Falta Entregar", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" },
    EN_REVISION: { label: "En Revision", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
    RECHAZADO: { label: "Rechazado", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
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
  
  // Invite modal state - Identity-based Onboarding (Legal Compliance)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "DOCENTE" as StaffRole,
    level: "",
  });
  const [isInviting, setIsInviting] = useState(false);

  // Validation check
  const isFormValid = useMemo(() => {
    const hasIdentity = inviteData.firstName.trim() && inviteData.lastName.trim();
    const hasEmail = inviteData.email.trim() && inviteData.email.includes("@");
    const hasLevel = inviteData.role === "ADMINISTRATIVO" || inviteData.level !== "";
    return hasIdentity && hasEmail && hasLevel;
  }, [inviteData]);

  // Scope management modal state
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [newAssignmentCourse, setNewAssignmentCourse] = useState("");
  const [newAssignmentSubject, setNewAssignmentSubject] = useState("");
  const [isSavingScope, setIsSavingScope] = useState(false);

  // Current assignments for selected member
  interface Assignment {
    course: string;
    subject: string;
  }
  const [memberAssignments, setMemberAssignments] = useState<Assignment[]>([]);

  // Legajo (Staff File) Sheet state
  const [isLegajoOpen, setIsLegajoOpen] = useState(false);
  const [legajoMember, setLegajoMember] = useState<StaffMember | null>(null);
  const [legajoTab, setLegajoTab] = useState("datos");
  const [isValidatingDoc, setIsValidatingDoc] = useState<string | null>(null);

  // Editable documents store (audit flow: approve / reject / upload on behalf)
  const [documentsStore, setDocumentsStore] = useState<Record<string, StaffDocument[]>>(MOCK_DOCUMENTS);

  // Reject modal state (requires reason)
  const [rejectingDoc, setRejectingDoc] = useState<StaffDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Upload-on-behalf modal state
  const [uploadingDoc, setUploadingDoc] = useState<StaffDocument | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Documents of the currently open legajo member
  const legajoDocuments = legajoMember
    ? documentsStore[legajoMember.id] ?? []
    : [];

  // For demo purposes, assume current user is ADMIN (can edit documents)
  const isAdmin = true;

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

  // Handle invite with explicit identity (Legal Compliance)
  const handleInvite = useCallback(async () => {
    if (!isFormValid) {
      toast.error("Completa todos los campos requeridos de identidad");
      return;
    }

    setIsInviting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1800));
    
    // Build full name in legal format (Apellido, Nombre)
    const fullName = `${inviteData.lastName}, ${inviteData.firstName}`;
    
    // Add new staff member with explicit identity
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: fullName,
      email: inviteData.email.toLowerCase().trim(),
      role: inviteData.role,
      status: "PENDING",
      assignedCourses: [],
      assignedSubjects: [],
      invitedAt: getTodayLocalISO(),
    };
    
    setStaff((prev) => [...prev, newMember]);
    setIsInviting(false);
    setIsInviteModalOpen(false);
    
    // Reset form
    setInviteData({
      firstName: "",
      lastName: "",
      email: "",
      role: "DOCENTE",
      level: "",
    });
    
    toast.success("Alta de personal registrada exitosamente", {
      description: `Credenciales enviadas a ${inviteData.email} para ${fullName}`,
    });
  }, [inviteData, isFormValid]);

  // Handle revoke access
  const handleRevokeAccess = useCallback((memberId: string, memberName: string) => {
    setStaff((prev) => 
      prev.map((m) => 
        m.id === memberId ? { ...m, status: "SUSPENDED" as StaffStatus } : m
      )
    );
    toast.success(`Acceso revocado para ${memberName}`);
  }, []);

  // ── CRUD: Edit member ──────────────────────────────────────────────
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: StaffRole; phone: string }>({
    name: "",
    email: "",
    role: "DOCENTE",
    phone: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEdit = useCallback((member: StaffMember) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone ?? "",
    });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMember) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error("El nombre y el email son obligatorios");
      return;
    }
    setIsSavingEdit(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStaff((prev) =>
      prev.map((m) =>
        m.id === editingMember.id
          ? { ...m, name: editForm.name.trim(), email: editForm.email.trim(), role: editForm.role, phone: editForm.phone.trim() || undefined }
          : m
      )
    );
    setIsSavingEdit(false);
    setEditingMember(null);
    toast.success("Registro actualizado");
  }, [editingMember, editForm]);

  // ── CRUD: Delete (archive) member ──────────────────────────────────
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingMember) return;
    setStaff((prev) => prev.filter((m) => m.id !== deletingMember.id));
    setDeletingMember(null);
    toast.success("Registro eliminado");
  }, [deletingMember]);

  // Reset modal state when closing
  const handleCloseModal = useCallback(() => {
    setIsInviteModalOpen(false);
    setInviteData({
      firstName: "",
      lastName: "",
      email: "",
      role: "DOCENTE",
      level: "",
    });
  }, []);

  // Open scope management modal
  const handleOpenScopeModal = useCallback((member: StaffMember) => {
    setSelectedMember(member);
    // Build current assignments from member data
    const assignments: Assignment[] = [];
    member.assignedCourses.forEach((course) => {
      member.assignedSubjects.forEach((subject) => {
        assignments.push({ course, subject });
      });
    });
    // If no subjects but has courses, still show courses
    if (member.assignedSubjects.length === 0 && member.assignedCourses.length > 0) {
      member.assignedCourses.forEach((course) => {
        assignments.push({ course, subject: "-" });
      });
    }
    setMemberAssignments(assignments);
    setIsScopeModalOpen(true);
  }, []);

  // Add new assignment
  const handleAddAssignment = useCallback(() => {
    if (!newAssignmentCourse) return;
    const courseName = AVAILABLE_COURSES.find(c => c.id === newAssignmentCourse)?.name || "";
    const subjectName = newAssignmentSubject 
      ? AVAILABLE_SUBJECTS.find(s => s.id === newAssignmentSubject)?.name || "-"
      : "-";
    
    // Check if already exists
    const exists = memberAssignments.some(
      a => a.course === courseName && a.subject === subjectName
    );
    if (exists) {
      toast.error("Esta asignacion ya existe");
      return;
    }
    
    setMemberAssignments(prev => [...prev, { course: courseName, subject: subjectName }]);
    setNewAssignmentCourse("");
    setNewAssignmentSubject("");
  }, [newAssignmentCourse, newAssignmentSubject, memberAssignments]);

  // Remove assignment
  const handleRemoveAssignment = useCallback((index: number) => {
    setMemberAssignments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Save scope changes
  const handleSaveScope = useCallback(async () => {
    if (!selectedMember) return;
    
    setIsSavingScope(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Extract unique courses and subjects
    const courses = [...new Set(memberAssignments.map(a => a.course))];
    const subjects = [...new Set(memberAssignments.map(a => a.subject).filter(s => s !== "-"))];
    
    // Update staff member
    setStaff(prev => prev.map(m => 
      m.id === selectedMember.id 
        ? { ...m, assignedCourses: courses, assignedSubjects: subjects }
        : m
    ));
    
    setIsSavingScope(false);
    setIsScopeModalOpen(false);
    setSelectedMember(null);
    
    toast.success("Asignaciones academicas actualizadas", {
      description: "Los permisos de red se han modificado.",
    });
  }, [selectedMember, memberAssignments]);

  // Open legajo sheet
  const handleOpenLegajo = useCallback((member: StaffMember) => {
    setLegajoMember(member);
    setLegajoTab("datos");
    setIsLegajoOpen(true);
  }, []);

  // Helper: patch a document in the store for a given member
  const patchDocument = useCallback((memberId: string, docId: string, patch: Partial<StaffDocument>) => {
    setDocumentsStore((prev) => {
      const memberDocs = prev[memberId] ?? [];
      return {
        ...prev,
        [memberId]: memberDocs.map((d) => (d.id === docId ? { ...d, ...patch } : d)),
      };
    });
  }, []);

  // Approve a document submitted by the teacher
  const handleApproveDocument = useCallback(async (docId: string) => {
    if (!legajoMember) return;
    setIsValidatingDoc(docId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    patchDocument(legajoMember.id, docId, {
      status: "AL_DIA",
      rejectionReason: undefined,
      uploadedAt: getTodayLocalISO(),
    });
    setIsValidatingDoc(null);
    toast.success("Documento aprobado", {
      description: "El docente fue notificado de la validacion.",
    });
  }, [legajoMember, patchDocument]);

  // Confirm rejection with a reason
  const handleConfirmReject = useCallback(async () => {
    if (!legajoMember || !rejectingDoc) return;
    if (!rejectionReason.trim()) {
      toast.error("Debes indicar el motivo del rechazo");
      return;
    }
    setIsRejecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    patchDocument(legajoMember.id, rejectingDoc.id, {
      status: "RECHAZADO",
      rejectionReason: rejectionReason.trim(),
    });
    setIsRejecting(false);
    setRejectingDoc(null);
    setRejectionReason("");
    toast.success("Documento rechazado", {
      description: "Se notifico al docente con el motivo para que lo vuelva a subir.",
    });
  }, [legajoMember, rejectingDoc, rejectionReason, patchDocument]);

  // Upload a document on behalf of the teacher (physical paper scanned by admin)
  const handleConfirmUploadOnBehalf = useCallback(async () => {
    if (!legajoMember || !uploadingDoc) return;
    setIsUploadingFile(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    patchDocument(legajoMember.id, uploadingDoc.id, {
      status: "AL_DIA",
      rejectionReason: undefined,
      uploadedAt: getTodayLocalISO(),
      uploadedByAdmin: true,
    });
    setIsUploadingFile(false);
    setUploadingDoc(null);
    toast.success("Documento cargado en nombre del docente", {
      description: "Quedo registrado y aprobado por Secretaria.",
    });
  }, [legajoMember, uploadingDoc, patchDocument]);

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
                            <button 
                              onClick={() => handleOpenLegajo(member)}
                              className="text-sm font-medium text-foreground hover:text-[#d0bcff] transition-colors text-left"
                            >
                              {member.name}
                            </button>
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
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleOpenLegajo(member)}
                            >
                              <Eye className="size-4" />
                              Ver Legajo
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => { handleOpenLegajo(member); setLegajoTab("documentacion"); }}
                            >
                              <FileSearch className="size-4" />
                              Auditar Documentacion
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleOpenScopeModal(member)}
                            >
                              <Settings2 className="size-4" />
                              Gestionar Alcance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => handleOpenEdit(member)}
                            >
                              <Edit3 className="size-4" />
                              Editar Registro
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => toast.info(`Procesando accion de Auditar Actividad de ${member.name}...`)}
                            >
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
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer text-[#ffb4ab] focus:text-[#ffb4ab] focus:bg-[#ffb4ab]/10"
                              onClick={() => setDeletingMember(member)}
                            >
                              <Trash2 className="size-4" />
                              Dar de Baja
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

      {/* Staff Identity Registration Modal (Legal Compliance) */}
      <Dialog open={isInviteModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[520px] bg-[#131319] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <UserPlus className="size-5 text-[#d0bcff]" />
              Alta de Personal
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Registra la identidad legal del nuevo miembro. El sistema generara credenciales seguras.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Identity Section */}
            <div className="space-y-4">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Datos de Identidad Legal
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-[#e4e1ea]">Nombre Legal</Label>
                  <Input
                    value={inviteData.firstName}
                    onChange={(e) => setInviteData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Ej: Maria Eugenia"
                    className="bg-white/[0.02] border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-[#e4e1ea]">Apellido</Label>
                  <Input
                    value={inviteData.lastName}
                    onChange={(e) => setInviteData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Ej: Rodriguez"
                    className="bg-white/[0.02] border-white/10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-[#e4e1ea] flex items-center gap-2">
                  <Mail className="size-4 text-white/40" />
                  Correo Electronico (Institucional o Personal)
                </Label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@escuela.edu.ar"
                  className="bg-white/[0.02] border-white/10"
                />
                <p className="text-[10px] text-white/40">
                  Se enviaran las credenciales de acceso a este correo.
                </p>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Rol y Jerarquia
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLE_CARDS.map((role) => {
                  const Icon = role.icon;
                  const isSelected = inviteData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setInviteData(prev => ({ 
                          ...prev, 
                          role: role.value,
                          level: role.value === "ADMINISTRATIVO" ? "" : prev.level
                        }));
                      }}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all duration-200",
                        isSelected ? role.selectedColor : role.color
                      )}
                    >
                      <Icon className={cn("size-5 mb-1.5", role.iconColor)} />
                      <p className="text-sm font-semibold text-[#e4e1ea]">{role.label}</p>
                      <p className="text-[9px] text-white/40 mt-0.5 leading-relaxed line-clamp-2">
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Selection (Conditional) */}
            {(inviteData.role === "DOCENTE" || inviteData.role === "PRECEPTOR") && (
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-white/50">
                  Nivel Educativo de Acceso
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {EDUCATION_LEVELS.map((level) => {
                    const isSelected = inviteData.level === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setInviteData(prev => ({ ...prev, level: level.id }))}
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
            
            {/* Preview Card */}
            {(inviteData.firstName || inviteData.lastName) && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Vista Previa del Registro</p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-[#d0bcff]/30 to-[#d0bcff]/10 flex items-center justify-center text-sm font-bold text-[#d0bcff] border border-[#d0bcff]/20">
                    {inviteData.lastName.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e4e1ea]">
                      {inviteData.lastName ? `${inviteData.lastName}, ${inviteData.firstName}` : inviteData.firstName || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleLabel(inviteData.role)} {inviteData.level && `• ${EDUCATION_LEVELS.find(l => l.id === inviteData.level)?.name}`}
                    </p>
                  </div>
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
              onClick={handleInvite}
              disabled={isInviting || !isFormValid}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
            >
              {isInviting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Registrar y Notificar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope Management Modal (Configuracion de Catedra) */}
      <Dialog open={isScopeModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsScopeModalOpen(false);
          setSelectedMember(null);
          setNewAssignmentCourse("");
          setNewAssignmentSubject("");
        }
      }}>
        <DialogContent className="sm:max-w-[560px] bg-[#131319] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Settings2 className="size-5 text-[#d0bcff]" />
              Configuracion de Catedra
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Gestiona los cursos y materias asignados a {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Current Assignments */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Asignaciones Actuales
              </Label>
              
              {memberAssignments.length === 0 ? (
                <div className="text-center py-6 text-sm text-white/30 bg-white/[0.02] rounded-xl border border-white/5">
                  Sin asignaciones. Agregue cursos y materias abajo.
                </div>
              ) : (
                <div className="space-y-2">
                  {memberAssignments.map((assignment, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-[#d0bcff]/10 flex items-center justify-center">
                          <BookOpen className="size-4 text-[#d0bcff]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#e4e1ea]">
                            {assignment.subject !== "-" ? assignment.subject : "General"}
                          </p>
                          <p className="text-xs text-white/40">{assignment.course}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(index)}
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Assignment */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <Label className="text-xs uppercase tracking-wider text-white/50">
                Anadir Nueva Asignacion
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-white/40">Curso</Label>
                  <Select value={newAssignmentCourse} onValueChange={setNewAssignmentCourse}>
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
                
                <div className="space-y-2">
                  <Label className="text-xs text-white/40">Materia</Label>
                  <Select value={newAssignmentSubject} onValueChange={setNewAssignmentSubject}>
                    <SelectTrigger className="bg-white/[0.02] border-white/10">
                      <SelectValue placeholder="Seleccionar materia..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {AVAILABLE_SUBJECTS.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={handleAddAssignment}
                disabled={!newAssignmentCourse}
                variant="outline"
                className="w-full border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 gap-2"
              >
                <Plus className="size-4" />
                Anadir a la Catedra
              </Button>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsScopeModalOpen(false);
                setSelectedMember(null);
              }}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveScope}
              disabled={isSavingScope}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-2"
            >
              {isSavingScope ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Legajo (360 View) Sheet */}
      <Sheet open={isLegajoOpen} onOpenChange={setIsLegajoOpen}>
        <SheetContent className="w-full sm:max-w-[600px] bg-[#131319] border-l border-white/10 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-gradient-to-br from-[#d0bcff]/30 to-[#d0bcff]/10 flex items-center justify-center text-xl font-bold text-[#d0bcff] border border-[#d0bcff]/20">
                {legajoMember?.name.split(",")[0].charAt(0) || "?"}
              </div>
              <div>
                <SheetTitle className="text-[#e4e1ea] text-lg">{legajoMember?.name}</SheetTitle>
                <SheetDescription className="text-white/50 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${legajoMember ? getRoleColor(legajoMember.role) : ""}`}>
                    {legajoMember ? getRoleLabel(legajoMember.role) : ""}
                  </span>
                  {legajoMember?.cuil && <span className="text-xs font-mono">CUIL: {legajoMember.cuil}</span>}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <Tabs value={legajoTab} onValueChange={setLegajoTab} className="flex-1">
            <TabsList className="w-full justify-start px-6 pt-4 bg-transparent border-b border-white/5">
              <TabsTrigger 
                value="datos" 
                className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] text-white/50"
              >
                Datos y Alcance
              </TabsTrigger>
              <TabsTrigger 
                value="documentacion" 
                className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] text-white/50"
              >
                Documentacion
              </TabsTrigger>
              <TabsTrigger 
                value="asistencia" 
                className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] text-white/50"
              >
                Asistencia
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Datos y Alcance */}
            <TabsContent value="datos" className="px-6 py-5 space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium">Datos de Contacto</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <Mail className="size-4 text-white/40" />
                    <div>
                      <p className="text-[10px] text-white/40">Email</p>
                      <p className="text-sm text-[#e4e1ea]">{legajoMember?.email}</p>
                    </div>
                  </div>
                  {legajoMember?.phone && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <Phone className="size-4 text-white/40" />
                      <div>
                        <p className="text-[10px] text-white/40">Telefono</p>
                        <p className="text-sm text-[#e4e1ea]">{legajoMember.phone}</p>
                      </div>
                    </div>
                  )}
                  {legajoMember?.address && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <MapPin className="size-4 text-white/40" />
                      <div>
                        <p className="text-[10px] text-white/40">Domicilio</p>
                        <p className="text-sm text-[#e4e1ea]">{legajoMember.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Scope */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium">Alcance Academico</h3>
                {legajoMember?.assignedCourses && legajoMember.assignedCourses.length > 0 ? (
                  <div className="space-y-2">
                    <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-[10px] text-white/40 mb-2">Cursos Asignados</p>
                      <div className="flex flex-wrap gap-2">
                        {legajoMember.assignedCourses.map((course, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-[#d0bcff]/10 text-[#d0bcff] border border-[#d0bcff]/20">
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                    {legajoMember.assignedSubjects.length > 0 && (
                      <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <p className="text-[10px] text-white/40 mb-2">Materias</p>
                        <div className="flex flex-wrap gap-2">
                          {legajoMember.assignedSubjects.map((subject, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-white/30 bg-white/[0.02] rounded-xl border border-white/5">
                    Sin asignaciones academicas
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab 2: Documentacion Legal - Auditoria */}
            <TabsContent value="documentacion" className="px-6 py-5 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium">Auditoria de Documentacion</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">Valida lo que subio el docente desde su Portal</p>
                </div>
                {!isAdmin && (
                  <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Solo Lectura
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {legajoDocuments.length === 0 ? (
                  <div className="text-center py-10 text-sm text-white/30 bg-white/[0.02] rounded-xl border border-white/5">
                    Este miembro aun no tiene documentos requeridos cargados.
                  </div>
                ) : legajoDocuments.map((doc) => {
                  const statusConfig = getDocumentStatusConfig(doc.status);
                  const isPending = doc.status === "EN_REVISION";
                  const needsUpload = doc.status === "FALTA_ENTREGAR" || doc.status === "VENCIDO" || doc.status === "RECHAZADO";
                  return (
                    <div 
                      key={doc.id}
                      className="px-4 py-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`size-10 rounded-lg flex items-center justify-center ${statusConfig.bgColor} border`}>
                            <FileText className={`size-5 ${statusConfig.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#e4e1ea]">{doc.name}</p>
                            <p className="text-xs text-white/40 mt-0.5">{doc.description}</p>
                            {doc.uploadedAt && (
                              <p className="text-[10px] text-white/30 mt-1">
                                Cargado: {doc.uploadedAt}
                                {doc.expirationDate && ` | Vence: ${doc.expirationDate}`}
                                {doc.uploadedByAdmin && " | Cargado por Secretaria"}
                              </p>
                            )}
                            {doc.status === "RECHAZADO" && doc.rejectionReason && (
                              <p className="text-[10px] text-red-400/80 mt-1.5 flex items-start gap-1">
                                <Ban className="size-3 shrink-0 mt-px" />
                                Motivo: {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded shrink-0 ${statusConfig.bgColor} ${statusConfig.color} border`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Audit actions */}
                      {isAdmin && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveDocument(doc.id)}
                                disabled={isValidatingDoc === doc.id}
                                className="h-8 text-xs bg-[#4de082]/15 text-[#4de082] border border-[#4de082]/30 hover:bg-[#4de082]/25 gap-1.5"
                              >
                                {isValidatingDoc === doc.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Check className="size-3.5" />
                                )}
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setRejectingDoc(doc); setRejectionReason(""); }}
                                className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                              >
                                <Ban className="size-3.5" />
                                Rechazar
                              </Button>
                            </>
                          )}
                          {needsUpload && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUploadingDoc(doc)}
                              className="h-8 text-xs border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 gap-1.5"
                            >
                              <Upload className="size-3.5" />
                              Subir en nombre del docente
                            </Button>
                          )}
                          {doc.status === "AL_DIA" && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#4de082]/80">
                              <ShieldCheck className="size-3.5" />
                              Documento validado por Secretaria
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Compliance Summary */}
              <div className="mt-6 p-4 rounded-xl bg-white/[0.01] border border-white/5">
                <p className="text-xs text-white/40 mb-3">Resumen de Cumplimiento</p>
                <div className="grid grid-cols-4 gap-3">
                  {(() => {
                    const docs = legajoDocuments;
                    const aprobados = docs.filter(d => d.status === "AL_DIA").length;
                    const revision = docs.filter(d => d.status === "EN_REVISION").length;
                    const rechazados = docs.filter(d => d.status === "RECHAZADO").length;
                    const faltantes = docs.filter(d => d.status === "FALTA_ENTREGAR" || d.status === "VENCIDO").length;
                    return (
                      <>
                        <div className="text-center p-3 rounded-lg bg-[#4de082]/5 border border-[#4de082]/20">
                          <p className="text-xl font-bold text-[#4de082]">{aprobados}</p>
                          <p className="text-[10px] text-white/40">Aprobados</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="text-xl font-bold text-blue-400">{revision}</p>
                          <p className="text-[10px] text-white/40">En Revision</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                          <p className="text-xl font-bold text-red-400">{rechazados}</p>
                          <p className="text-[10px] text-white/40">Rechazados</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="text-xl font-bold text-amber-400">{faltantes}</p>
                          <p className="text-[10px] text-white/40">Faltantes</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Asistencia Anual */}
            <TabsContent value="asistencia" className="px-6 py-5 space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto">
              <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium">Presentismo Anual 2024</h3>
              
              {(() => {
                const attendance = legajoMember && MOCK_ATTENDANCE[legajoMember.id] 
                  ? MOCK_ATTENDANCE[legajoMember.id] 
                  : { year: 2024, totalDays: 120, presentDays: 0, justifiedAbsences: 0, unjustifiedAbsences: 0, lateArrivals: 0 };
                const presentPercentage = Math.round((attendance.presentDays / attendance.totalDays) * 100);
                
                return (
                  <>
                    {/* Presentismo Gauge */}
                    <div className="flex items-center justify-center py-6">
                      <div className="relative size-40">
                        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            className="stroke-white/5"
                            strokeWidth="8"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className={cn(
                              "transition-all duration-500",
                              presentPercentage >= 90 ? "stroke-[#4de082]" : 
                              presentPercentage >= 75 ? "stroke-amber-400" : "stroke-red-400"
                            )}
                            strokeWidth="8"
                            strokeLinecap="round"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                            strokeDasharray={`${presentPercentage * 2.64} 264`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={cn(
                            "text-3xl font-bold",
                            presentPercentage >= 90 ? "text-[#4de082]" : 
                            presentPercentage >= 75 ? "text-amber-400" : "text-red-400"
                          )}>
                            {presentPercentage}%
                          </span>
                          <span className="text-[10px] text-white/40">Presentismo</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="size-4 text-[#4de082]" />
                          <span className="text-xs text-white/40">Dias Presentes</span>
                        </div>
                        <p className="text-2xl font-bold text-[#e4e1ea]">{attendance.presentDays}</p>
                        <p className="text-[10px] text-white/30">de {attendance.totalDays} dias habiles</p>
                      </div>
                      <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="size-4 text-blue-400" />
                          <span className="text-xs text-white/40">Ausencias Justificadas</span>
                        </div>
                        <p className="text-2xl font-bold text-[#e4e1ea]">{attendance.justifiedAbsences}</p>
                        <p className="text-[10px] text-white/30">certificados medicos/licencias</p>
                      </div>
                      <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="size-4 text-red-400" />
                          <span className="text-xs text-white/40">Ausencias Injustificadas</span>
                        </div>
                        <p className="text-2xl font-bold text-[#e4e1ea]">{attendance.unjustifiedAbsences}</p>
                        <p className="text-[10px] text-white/30">sin justificativo</p>
                      </div>
                      <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="size-4 text-amber-400" />
                          <span className="text-xs text-white/40">Llegadas Tarde</span>
                        </div>
                        <p className="text-2xl font-bold text-[#e4e1ea]">{attendance.lateArrivals}</p>
                        <p className="text-[10px] text-white/30">registradas en el ano</p>
                      </div>
                    </div>

                    {/* Warning if low attendance */}
                    {presentPercentage < 85 && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
                        <AlertTriangle className="size-5 text-red-400 shrink-0" />
                        <p className="text-sm text-red-300">
                          El presentismo esta por debajo del umbral minimo requerido (85%). Se requiere atencion.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Reject Document Modal (requires reason) */}
      <Dialog open={rejectingDoc !== null} onOpenChange={(o) => { if (!o) { setRejectingDoc(null); setRejectionReason(""); } }}>
        <DialogContent className="sm:max-w-[440px] bg-[#131319] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Ban className="size-5 text-red-400" />
              Rechazar Documento
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {rejectingDoc?.name}. Indica el motivo; el docente lo recibira para corregir y volver a subir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs text-white/60">Motivo del rechazo</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej: El documento esta vencido / ilegible / no corresponde al periodo actual."
              className="bg-white/[0.02] border-white/10 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingDoc(null); setRejectionReason(""); }} className="border-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-red-500/90 hover:bg-red-500 text-white gap-1.5"
            >
              {isRejecting ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload-on-behalf Modal */}
      <Dialog open={uploadingDoc !== null} onOpenChange={(o) => { if (!o) setUploadingDoc(null); }}>
        <DialogContent className="sm:max-w-[460px] bg-[#131319] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Upload className="size-5 text-[#d0bcff]" />
              Subir en nombre del docente
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {uploadingDoc?.name}. Usa esta opcion cuando el docente entrego el papel fisico y Secretaria lo escaneo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-[#d0bcff]/40 hover:bg-[#d0bcff]/[0.03] transition-colors cursor-pointer text-center">
              <div className="w-12 h-12 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-center justify-center">
                <Upload className="size-6 text-[#d0bcff]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e4e1ea]">Arrastra el archivo escaneado aqui</p>
                <p className="text-[10px] text-white/40 mt-1">PDF o imagen (JPG, PNG) - Max 10MB</p>
              </div>
              <input type="file" accept="application/pdf,image/*" className="hidden" />
            </label>
            <p className="text-[10px] text-white/30 mt-3 text-center">
              Al confirmar, el documento quedara aprobado y registrado como cargado por Secretaria.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadingDoc(null)} className="border-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmUploadOnBehalf}
              disabled={isUploadingFile}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-1.5"
            >
              {isUploadingFile ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Confirmar y Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog (Update) */}
      <Dialog open={editingMember !== null} onOpenChange={(o) => { if (!o) setEditingMember(null); }}>
        <DialogContent className="sm:max-w-[460px] bg-[#131319] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <Edit3 className="size-5 text-[#d0bcff]" />
              Editar Registro
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Modifica los datos del miembro del personal. Los cambios se aplican al instante.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Nombre completo</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="bg-white/[0.02] border-white/10 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                className="bg-white/[0.02] border-white/10 h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Rol</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((p) => ({ ...p, role: v as StaffRole }))}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="DOCENTE">Docente</SelectItem>
                    <SelectItem value="PRECEPTOR">Preceptor</SelectItem>
                    <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Telefono</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+54 11 ..."
                  className="bg-white/[0.02] border-white/10 h-11"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)} className="border-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editForm.name.trim() || !editForm.email.trim()}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-1.5"
            >
              {isSavingEdit ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete (Archive) Confirmation */}
      <AlertDialog open={deletingMember !== null} onOpenChange={(o) => { if (!o) setDeletingMember(null); }}>
        <AlertDialogContent className="bg-[#131319] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <AlertTriangle className="size-5 text-[#ffb4ab]" />
              Dar de baja a {deletingMember?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Esta accion archivara el legajo del miembro y revocara su acceso al sistema. 
              Podras restaurarlo desde el historico, pero dejara de figurar en el listado activo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent hover:bg-white/5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-[#ffb4ab] text-[#1b1b1f] hover:bg-[#ffb4ab]/90"
            >
              <Trash2 className="size-4 mr-1.5" />
              Confirmar Baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Toaster theme="dark" />
    </div>
  );
}
