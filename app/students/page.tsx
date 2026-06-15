"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  ArrowRightLeft, 
  Eye, 
  FileText,
  GraduationCap,
  Loader2,
  Check,
  AlertTriangle,
  FileStack,
  Download,
  ArrowDownToLine,
  ArrowUpFromLine,
  Key,
  Copy,
  ExternalLink,
  Lock,
  Globe,
  ArrowUpCircle,
  Pencil,
  Trash2,
  FileSpreadsheet,
  UploadCloud,
  FileUp,
  Sparkles,
  Printer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";

// ============================================
// COMPLIANCE: Document Export Format Logic
// ============================================

type ExportFormat = "DOCX" | "PDF";

/**
 * Determines the export format based on user role.
 * ADMIN: Editable DOCX format
 * All other roles: Immutable PDF format
 */
function getExportFormat(role: string | null): ExportFormat {
  return role === "ADMIN" ? "DOCX" : "PDF";
}

/**
 * Returns export button label based on role and document type
 */
function getExportButtonLabel(role: string | null, documentType: string): string {
  const format = getExportFormat(role);
  return format === "DOCX" 
    ? `Exportar ${documentType} (DOCX)` 
    : `Descargar ${documentType} (PDF)`;
}

/**
 * Returns toast message for export process based on format
 */
function getExportToastMessage(format: ExportFormat): string {
  return format === "DOCX"
    ? "Generando archivo editable en formato Word..."
    : "Compilando documento PDF cerrado e inmutable...";
}

// ============================================
// MOCK DATA
// ============================================

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  legajo: string;
  photoUrl?: string;
  currentCourse: string;
  currentDivision: string;
  level: "PRIMARY" | "SECONDARY";
  status: "REGULAR" | "CONDICIONAL" | "LIBRE";
}

interface Division {
  id: string;
  name: string;
  course: string;
  level: "PRIMARY" | "SECONDARY";
  studentCount: number;
}

const MOCK_DIVISIONS: Division[] = [
  { id: "1a", name: "1er Ano A", course: "1er Ano", level: "SECONDARY", studentCount: 24 },
  { id: "1b", name: "1er Ano B", course: "1er Ano", level: "SECONDARY", studentCount: 22 },
  { id: "4a", name: "4to Ano A", course: "4to Ano", level: "SECONDARY", studentCount: 28 },
  { id: "4b", name: "4to Ano B", course: "4to Ano", level: "SECONDARY", studentCount: 30 },
  { id: "4c", name: "4to Ano C", course: "4to Ano", level: "SECONDARY", studentCount: 26 },
  { id: "5a", name: "5to Ano A", course: "5to Ano", level: "SECONDARY", studentCount: 25 },
  { id: "5b", name: "5to Ano B", course: "5to Ano", level: "SECONDARY", studentCount: 27 },
];

// Divisiones de ingreso a Secundaria (destino de promocion inter-nivel)
const SECONDARY_ENTRY_DIVISIONS = MOCK_DIVISIONS.filter((d) => d.course === "1er Ano");

// Padron de Primaria (otro nivel de la misma institucion).
// El Admin de Secundaria los ve en modo Solo Lectura y puede asimilar a los de 6to Grado.
const MOCK_PRIMARY_STUDENTS: Student[] = [
  { id: "p6-1", firstName: "Thiago", lastName: "Acosta", legajo: "2024-301", currentCourse: "6to Grado", currentDivision: "6a-prim", level: "PRIMARY", status: "REGULAR" },
  { id: "p6-2", firstName: "Mia", lastName: "Bravo", legajo: "2024-302", currentCourse: "6to Grado", currentDivision: "6a-prim", level: "PRIMARY", status: "REGULAR" },
  { id: "p6-3", firstName: "Bautista", lastName: "Cabrera", legajo: "2024-303", currentCourse: "6to Grado", currentDivision: "6b-prim", level: "PRIMARY", status: "REGULAR" },
  { id: "p6-4", firstName: "Catalina", lastName: "Dominguez", legajo: "2024-304", currentCourse: "6to Grado", currentDivision: "6b-prim", level: "PRIMARY", status: "CONDICIONAL" },
  { id: "p5-1", firstName: "Lautaro", lastName: "Esposito", legajo: "2024-310", currentCourse: "5to Grado", currentDivision: "5a-prim", level: "PRIMARY", status: "REGULAR" },
  { id: "p5-2", firstName: "Renata", lastName: "Figueroa", legajo: "2024-311", currentCourse: "5to Grado", currentDivision: "5a-prim", level: "PRIMARY", status: "REGULAR" },
];

const MOCK_STUDENTS: Student[] = [
  { id: "s1", firstName: "Sofia", lastName: "Alvarez", legajo: "2024-001", currentCourse: "4to Ano", currentDivision: "4a", level: "SECONDARY", status: "REGULAR" },
  { id: "s2", firstName: "Mateo", lastName: "Benitez", legajo: "2024-002", currentCourse: "4to Ano", currentDivision: "4a", level: "SECONDARY", status: "REGULAR" },
  { id: "s3", firstName: "Valentina", lastName: "Castro", legajo: "2024-003", currentCourse: "4to Ano", currentDivision: "4a", level: "SECONDARY", status: "CONDICIONAL" },
  { id: "s4", firstName: "Lucas", lastName: "Diaz", legajo: "2024-004", currentCourse: "4to Ano", currentDivision: "4b", level: "SECONDARY", status: "REGULAR" },
  { id: "s5", firstName: "Martina", lastName: "Fernandez", legajo: "2024-005", currentCourse: "4to Ano", currentDivision: "4b", level: "SECONDARY", status: "REGULAR" },
  { id: "s6", firstName: "Benjamin", lastName: "Garcia", legajo: "2024-006", currentCourse: "5to Ano", currentDivision: "5a", level: "SECONDARY", status: "REGULAR" },
  { id: "s7", firstName: "Emma", lastName: "Hernandez", legajo: "2024-007", currentCourse: "5to Ano", currentDivision: "5a", level: "SECONDARY", status: "LIBRE" },
  { id: "s8", firstName: "Joaquin", lastName: "Lopez", legajo: "2024-008", currentCourse: "5to Ano", currentDivision: "5b", level: "SECONDARY", status: "REGULAR" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function StudentsPage() {
  const [mounted, setMounted] = useState(false);
  const { activeContext } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  
  // State
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState<string>("all");
  
  // Transfer dialog state
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [targetDivision, setTargetDivision] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Padron view state: "MI_NIVEL" (alumnos del nivel del admin) | "GLOBAL" (toda la institucion, solo lectura)
  const [padronView, setPadronView] = useState<"MI_NIVEL" | "GLOBAL">("MI_NIVEL");

  // Promocion Inter-Nivel dialog state
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [studentToPromote, setStudentToPromote] = useState<Student | null>(null);
  const [promoteTargetDivision, setPromoteTargetDivision] = useState<string>("");
  const [isPromoting, setIsPromoting] = useState(false);

  // Boletin generator dialog state
  const [isBoletinDialogOpen, setIsBoletinDialogOpen] = useState(false);
  const [boletinCourse, setBoletinCourse] = useState<string>("");
  const [isGeneratingBoletin, setIsGeneratingBoletin] = useState(false);

  // Importador de Matricula (Excel/CSV) state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // Pases state
  const [activeTab, setActiveTab] = useState("alumnos");
  const [incomingToken, setIncomingToken] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [selectedStudentForPase, setSelectedStudentForPase] = useState<Student | null>(null);

  // Mock data for pending pases (students leaving)
  const [pendingPases] = useState<Student[]>([
    { id: "p1", firstName: "Carolina", lastName: "Martinez", legajo: "2024-099", currentCourse: "3er Ano", currentDivision: "3a", level: "SECONDARY", status: "REGULAR" },
    { id: "p2", firstName: "Federico", lastName: "Romero", legajo: "2024-087", currentCourse: "5to Ano", currentDivision: "5b", level: "SECONDARY", status: "REGULAR" },
  ]);

  // ── CRUD: Edit student (Update) ────────────────────────────────────
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<{ firstName: string; lastName: string; currentDivision: string; status: Student["status"] }>({
    firstName: "",
    lastName: "",
    currentDivision: "",
    status: "REGULAR",
  });
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  const handleOpenEditStudent = useCallback((student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      firstName: student.firstName,
      lastName: student.lastName,
      currentDivision: student.currentDivision,
      status: student.status,
    });
  }, []);

  const handleSaveStudent = useCallback(async () => {
    if (!editingStudent) return;
    if (!studentForm.firstName.trim() || !studentForm.lastName.trim()) {
      toast.error("El nombre y el apellido son obligatorios");
      return;
    }
    setIsSavingStudent(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const targetDiv = MOCK_DIVISIONS.find((d) => d.id === studentForm.currentDivision);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              firstName: studentForm.firstName.trim(),
              lastName: studentForm.lastName.trim(),
              currentDivision: studentForm.currentDivision,
              currentCourse: targetDiv?.course ?? s.currentCourse,
              status: studentForm.status,
            }
          : s
      )
    );
    setIsSavingStudent(false);
    setEditingStudent(null);
    toast.success("Registro actualizado");
  }, [editingStudent, studentForm]);

  // ── CRUD: Delete (archive) student ─────────────────────────────────
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const handleConfirmDeleteStudent = useCallback(() => {
    if (!deletingStudent) return;
    setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
    setDeletingStudent(null);
    toast.success("Registro eliminado");
  }, [deletingStudent]);

  // ── Importador de Matricula (Excel/CSV) ────────────────────────────
  const isValidImportFile = (file: File) => /\.(xlsx|xls|csv)$/i.test(file.name);

  const handleFileSelected = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!isValidImportFile(file)) {
      toast.error("Formato no valido", { description: "Solo se aceptan archivos .xlsx, .xls o .csv" });
      return;
    }
    setImportFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelected(e.dataTransfer.files?.[0]);
  }, [handleFileSelected]);

  const handleDownloadTemplate = useCallback(() => {
    toast.info("Generando plantilla base...", {
      description: "Incluye las columnas estandar mas los campos personalizados definidos en Configuracion.",
    });
  }, []);

  const handleProcessImport = useCallback(async () => {
    if (!importFile) return;
    setIsProcessingImport(true);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    setIsProcessingImport(false);
    setImportFile(null);
    setIsImportOpen(false);
    toast.success("Matricula importada correctamente", {
      description: `Se proceso "${importFile.name}". Los alumnos fueron incorporados al padron.`,
    });
  }, [importFile]);

  useEffect(() => {
    setMounted(true);
    // Blindaje de estado: fallback seguro a ADMIN para evitar que la barra de
    // acciones primarias se oculte durante la hidratacion del cliente.
    const role = activeContext?.role || localStorage.getItem("sequency_dev_role") || "ADMIN";
    setCurrentRole(role);
  }, [activeContext]);

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.legajo.includes(searchQuery);
    
    const matchesDivision = filterDivision === "all" || student.currentDivision === filterDivision;
    
    return matchesSearch && matchesDivision;
  });

  // Padron Global: une el alumnado del nivel propio (Secundaria) con el de otros
  // niveles de la institucion (Primaria), compartiendo la misma base de datos.
  const globalRoster = [...students, ...MOCK_PRIMARY_STUDENTS];
  const filteredGlobalStudents = globalRoster.filter((student) => {
    const q = searchQuery.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(q) ||
      student.lastName.toLowerCase().includes(q) ||
      student.legajo.includes(searchQuery)
    );
  });

  // Check permissions
  // Blindaje de estado: rol seguro para renderizar la Barra de Acciones Primarias
  // sin que Next.js la esconda durante la hidratacion del cliente.
  const safeRole = activeContext?.role || currentRole || "ADMIN";
  const canTransfer = currentRole === "ADMIN" || currentRole === "PRECEPTOR";
  const isAdmin = safeRole === "ADMIN";
  const exportFormat = getExportFormat(currentRole);

  // Generate boletines with compliance-aware format (DOCX for ADMIN, PDF for others)
  const handleGenerateBoletines = useCallback(async () => {
    if (!boletinCourse) return;
    
    setIsGeneratingBoletin(true);
    const selectedDiv = MOCK_DIVISIONS.find((d) => d.id === boletinCourse);
    
    // Show format-specific loading toast
    toast.loading(getExportToastMessage(exportFormat), { id: "boletin-export" });
    
    // Simulate document compilation (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    if (exportFormat === "DOCX") {
      // Generate DOCX content (simplified mock)
      const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>BOLETINES OFICIALES - SEQUENCY</w:t></w:r></w:p>
    <w:p><w:r><w:t>Curso: ${selectedDiv?.name || "N/A"}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Total Alumnos: ${selectedDiv?.studentCount || 0}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Periodo: 1er Trimestre 2026</w:t></w:r></w:p>
    <w:p><w:r><w:t>Formato: Editable (Uso exclusivo administrativo)</w:t></w:r></w:p>
  </w:body>
</w:document>`;
      
      const blob = new Blob([docxContent], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Boletines_Oficiales_${selectedDiv?.name?.replace(/\s+/g, "_") || "Lote"}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss("boletin-export");
      toast.success(
        "Documento Word generado",
        {
          description: `Se exportaron ${selectedDiv?.studentCount || 0} boletines editables para ${selectedDiv?.name}`,
          duration: 5000,
        }
      );
    } else {
      // Generate PDF content (immutable)
      const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 350 >> stream
BT
/F1 24 Tf
50 700 Td
(BOLETINES OFICIALES - SEQUENCY) Tj
0 -50 Td
/F1 14 Tf
(Curso: ${selectedDiv?.name || "N/A"}) Tj
0 -25 Td
(Total Alumnos: ${selectedDiv?.studentCount || 0}) Tj
0 -25 Td
(Periodo: 1er Trimestre 2026) Tj
0 -25 Td
(Incluye: Notas TEA/TEP/TED y Calificaciones Finales) Tj
0 -40 Td
/F1 10 Tf
(Documento oficial - Formato cerrado e inmutable) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
trailer << /Size 6 /Root 1 0 R >>
startxref
650
%%EOF`;
      
      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Boletines_Oficiales_${selectedDiv?.name?.replace(/\s+/g, "_") || "Lote"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss("boletin-export");
      toast.success(
        "PDF generado correctamente",
        {
          description: `Se descargaron ${selectedDiv?.studentCount || 0} boletines oficiales para ${selectedDiv?.name}`,
          duration: 5000,
        }
      );
    }
    
    setIsGeneratingBoletin(false);
    setIsBoletinDialogOpen(false);
    setBoletinCourse("");
  }, [boletinCourse, exportFormat]);

  // Validate incoming transfer token
  const handleValidateToken = useCallback(async () => {
    if (!incomingToken.trim()) return;
    
    setIsValidatingToken(true);
    
    // Simulate token validation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsValidatingToken(false);
    setIncomingToken("");
    
    toast.success(
      "Legajo digital importado exitosamente",
      {
        description: "Se importo el historial completo del alumno desde la escuela de origen.",
        duration: 5000,
      }
    );
  }, [incomingToken]);

  // Generate outgoing transfer token
  const handleGeneratePaseToken = useCallback((student: Student) => {
    // Generate a random token
    const token = `TR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setGeneratedToken(token);
    setSelectedStudentForPase(student);
    setIsTokenDialogOpen(true);
  }, []);

  // Copy token to clipboard
  const handleCopyToken = useCallback(() => {
    navigator.clipboard.writeText(generatedToken);
    toast.success("Token copiado al portapapeles");
  }, [generatedToken]);

  // Open transfer dialog
  const handleOpenTransfer = (student: Student) => {
    setSelectedStudent(student);
    setTargetDivision("");
    setIsTransferDialogOpen(true);
  };

  // Execute transfer
  const handleTransfer = useCallback(async () => {
    if (!selectedStudent || !targetDivision) return;
    
    setIsTransferring(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Update local state
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudent.id
          ? { ...s, currentDivision: targetDivision }
          : s
      )
    );
    
    const targetDiv = MOCK_DIVISIONS.find((d) => d.id === targetDivision);
    
    setIsTransferring(false);
    setIsTransferDialogOpen(false);
    setSelectedStudent(null);
    setTargetDivision("");
    
    toast.success(
      `Alumno reasignado de division. Se recalcularon las listas de asistencia automaticamente.`,
      {
        description: `${selectedStudent.firstName} ${selectedStudent.lastName} ahora pertenece a ${targetDiv?.name}`,
        duration: 5000,
      }
    );
  }, [selectedStudent, targetDivision]);

  // Get available divisions for transfer (same course, different division)
  const getAvailableDivisions = (student: Student) => {
    return MOCK_DIVISIONS.filter(
      (d) => d.course === student.currentCourse && d.id !== student.currentDivision
    );
  };

  // Open inter-level promotion dialog (asimilar alumno de otro nivel a Secundaria)
  const handleOpenPromote = (student: Student) => {
    setStudentToPromote(student);
    setPromoteTargetDivision("");
    setIsPromoteDialogOpen(true);
  };

  // Execute inter-level promotion: incorpora al alumno a la matricula de Secundaria
  const handlePromote = useCallback(async () => {
    if (!studentToPromote || !promoteTargetDivision) return;

    setIsPromoting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const targetDiv = MOCK_DIVISIONS.find((d) => d.id === promoteTargetDivision);

    // Incorpora a la matricula propia del nivel (Secundaria), actualizando curso y division.
    setStudents((prev) => {
      if (prev.some((s) => s.id === studentToPromote.id)) return prev;
      return [
        ...prev,
        {
          ...studentToPromote,
          level: "SECONDARY",
          currentCourse: targetDiv?.course ?? studentToPromote.currentCourse,
          currentDivision: promoteTargetDivision,
          status: "REGULAR",
        },
      ];
    });

    setIsPromoting(false);
    setIsPromoteDialogOpen(false);
    setStudentToPromote(null);
    setPromoteTargetDivision("");

    toast.success(
      "Alumno promovido e incorporado a la matricula de Secundaria exitosamente.",
      {
        description: `${studentToPromote.firstName} ${studentToPromote.lastName} ahora cursa en ${targetDiv?.name}`,
        duration: 5000,
      }
    );
  }, [studentToPromote, promoteTargetDivision]);

  const getStatusBadge = (status: Student["status"]) => {
    const config = {
      REGULAR: { label: "Regular", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      CONDICIONAL: { label: "Condicional", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      LIBRE: { label: "Libre", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    return config[status];
  };

  // Nivel educativo del Admin actual (en este escenario, Secundaria).
  const OWN_LEVEL: Student["level"] = "SECONDARY";

  const getLevelBadge = (level: Student["level"]) => {
    return level === "SECONDARY"
      ? { label: "Secundaria", className: "bg-[#d0bcff]/15 text-[#d0bcff] border-[#d0bcff]/30" }
      : { label: "Primaria", className: "bg-sky-500/15 text-sky-300 border-sky-500/30" };
  };

  // Un alumno es "asimilable" si pertenece a otro nivel y esta en el ultimo grado (6to Grado).
  const canAssimilate = (student: Student) =>
    student.level !== OWN_LEVEL && student.currentCourse === "6to Grado";

  if (!mounted || !currentRole) return null;

  return (
    <div className="space-y-6">
      {/* Header - Module Action Bar estandarizado */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Gestion de Alumnado
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gestion de matricula, pases y documentacion oficial
          </p>
        </div>

        {/* Barra de Acciones Primarias */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {isAdmin && (
            <>
              {/* Accion primaria destacada: Importar Matricula (Excel) */}
              <Button
                onClick={() => setIsImportOpen(true)}
                className="gap-2 bg-emerald-500 text-[#0a160f] hover:bg-emerald-400 font-semibold shadow-lg shadow-emerald-500/20"
              >
                <Download className="size-4" />
                Importar Matricula (Excel)
              </Button>

              {/* Accion secundaria: Emitir Boletines */}
              <Button
                variant="outline"
                onClick={() => setIsBoletinDialogOpen(true)}
                className="gap-2 border-[#d0bcff]/30 bg-[#d0bcff]/5 text-[#d0bcff] hover:bg-[#d0bcff]/15 hover:text-[#d0bcff]"
              >
                <Printer className="size-4" />
                Emitir Boletines
              </Button>
            </>
          )}

          {/* Boletines para roles no-admin (solo lectura, formato segun rol) */}
          {!isAdmin && (
            <Button
              onClick={() => setIsBoletinDialogOpen(true)}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Lock className="size-4" />
              {getExportButtonLabel(currentRole, "Boletines")}
            </Button>
          )}

          <Badge variant="outline" className="bg-[#d0bcff]/10 border-[#d0bcff]/20 text-[#d0bcff]">
            <GraduationCap className="size-3.5 mr-1.5" />
            Vista: {safeRole}
          </Badge>
        </div>
      </header>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-white/[0.02] border border-white/5 rounded-xl p-1 gap-1">
          <TabsTrigger
            value="alumnos"
            className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] rounded-lg"
          >
            <Users className="size-4 mr-2" />
            Gestion de Alumnos
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="pases"
              className="data-[state=active]:bg-[#d0bcff]/20 data-[state=active]:text-[#d0bcff] rounded-lg"
            >
              <ArrowRightLeft className="size-4 mr-2" />
              Pases Inter-Escolares
            </TabsTrigger>
          )}
        </TabsList>

        {/* Alumnos Tab Content */}
        <TabsContent value="alumnos" className="mt-6 space-y-6">
          {/* Selector de Padron (solo ADMIN): Mi Nivel vs Padron Global Institucional */}
          {isAdmin && (
            <div className="flex flex-col gap-3">
              <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
                <button
                  type="button"
                  onClick={() => setPadronView("MI_NIVEL")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    padronView === "MI_NIVEL"
                      ? "bg-[#d0bcff]/20 text-[#d0bcff]"
                      : "text-white/50 hover:text-white/80"
                  )}
                >
                  <GraduationCap className="size-4" />
                  Mi Nivel
                </button>
                <button
                  type="button"
                  onClick={() => setPadronView("GLOBAL")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    padronView === "GLOBAL"
                      ? "bg-[#d0bcff]/20 text-[#d0bcff]"
                      : "text-white/50 hover:text-white/80"
                  )}
                >
                  <Globe className="size-4" />
                  Padron Global
                </button>
              </div>
              {padronView === "GLOBAL" && (
                <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3">
                  <Lock className="mt-0.5 size-4 shrink-0 text-sky-300" />
                  <p className="text-xs leading-relaxed text-sky-200/70">
                    Padron compartido a nivel institucional (Solo Lectura). Los alumnos de{" "}
                    <strong className="text-sky-300">6to Grado - Primaria</strong> pueden ser
                    asimilados a tu nivel mediante la accion de promocion inter-nivel.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <Input
            placeholder="Buscar por nombre o legajo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.02] border-white/10"
          />
        </div>
        
        {padronView === "MI_NIVEL" && (
          <Select value={filterDivision} onValueChange={setFilterDivision}>
            <SelectTrigger className="w-[180px] bg-white/[0.02] border-white/10">
              <SelectValue placeholder="Filtrar division" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">Todas las divisiones</SelectItem>
              {MOCK_DIVISIONS.map((div) => (
                <SelectItem key={div.id} value={div.id}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ============ VISTA: MI NIVEL ============ */}
      {padronView === "MI_NIVEL" && (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Legajo
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student) => {
                const initials = `${student.firstName[0]}${student.lastName[0]}`;
                const currentDiv = MOCK_DIVISIONS.find((d) => d.id === student.currentDivision);
                const statusConfig = getStatusBadge(student.status);
                
                return (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 ring-2 ring-white/10">
                          <AvatarImage src={student.photoUrl} />
                          <AvatarFallback className="bg-[#d0bcff]/10 text-[#d0bcff] font-semibold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[#e4e1ea]">
                            {student.lastName}, {student.firstName}
                          </p>
                          <p className="text-xs text-white/40">
                            {student.currentCourse}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-mono text-white/60">{student.legajo}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="bg-white/[0.02] border-white/10 text-white/70">
                        {currentDiv?.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={cn("border", statusConfig.className)}>
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 hover:bg-white/5">
                            <MoreHorizontal className="size-4 text-white/60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10">
                          <DropdownMenuItem 
                            onClick={() => toast.info(`Procesando accion de Ver Perfil de ${student.firstName} ${student.lastName}...`)}
                            className="text-white/80 hover:bg-white/5 cursor-pointer"
                          >
                            <Eye className="size-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toast.info(`Procesando accion de Ver Legajo de ${student.firstName} ${student.lastName}...`)}
                            className="text-white/80 hover:bg-white/5 cursor-pointer"
                          >
                            <FileText className="size-4 mr-2" />
                            Ver Legajo
                          </DropdownMenuItem>
                          
                          {canTransfer && (
                            <>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={() => handleOpenTransfer(student)}
                                className="text-[#d0bcff] hover:bg-[#d0bcff]/10 cursor-pointer"
                              >
                                <ArrowRightLeft className="size-4 mr-2" />
                                Cambiar de Division
                              </DropdownMenuItem>
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleOpenEditStudent(student)}
                                className="text-white/80 hover:bg-white/5 cursor-pointer"
                              >
                                <Pencil className="size-4 mr-2" />
                                Editar Registro
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={() => setDeletingStudent(student)}
                                className="text-[#ffb4ab] focus:text-[#ffb4ab] focus:bg-[#ffb4ab]/10 cursor-pointer"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Dar de Baja
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="size-12 text-white/20 mb-4" />
            <h3 className="text-lg font-medium text-[#e4e1ea] mb-1">
              No se encontraron alumnos
            </h3>
            <p className="text-sm text-white/40">
              Intenta ajustar los filtros de busqueda
            </p>
          </div>
        )}
      </div>
      )}

      {/* ============ VISTA: PADRON GLOBAL (Solo Lectura) ============ */}
      {padronView === "GLOBAL" && (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Legajo
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Curso Actual
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGlobalStudents.map((student) => {
                const initials = `${student.firstName[0]}${student.lastName[0]}`;
                const levelBadge = getLevelBadge(student.level);
                const assimilable = canAssimilate(student);
                const isOwnLevel = student.level === OWN_LEVEL;

                return (
                  <tr key={`global-${student.id}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 ring-2 ring-white/10">
                          <AvatarImage src={student.photoUrl} />
                          <AvatarFallback className={cn(
                            "font-semibold text-sm",
                            isOwnLevel ? "bg-[#d0bcff]/10 text-[#d0bcff]" : "bg-sky-500/10 text-sky-300"
                          )}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[#e4e1ea]">
                            {student.lastName}, {student.firstName}
                          </p>
                          <p className="text-xs text-white/40">
                            {isOwnLevel ? "Matricula propia" : "Otro nivel institucional"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-mono text-white/60">{student.legajo}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={cn("border", levelBadge.className)}>
                        {levelBadge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-white/70">{student.currentCourse}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {assimilable ? (
                        <Button
                          onClick={() => handleOpenPromote(student)}
                          size="sm"
                          className="bg-[#d0bcff]/10 text-[#d0bcff] hover:bg-[#d0bcff]/20 border border-[#d0bcff]/20"
                        >
                          <ArrowUpCircle className="size-3.5 mr-1.5" />
                          Asimilar a Mi Nivel
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-white/30">
                          <Lock className="size-3.5" />
                          Solo lectura
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredGlobalStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Globe className="size-12 text-white/20 mb-4" />
            <h3 className="text-lg font-medium text-[#e4e1ea] mb-1">
              Sin coincidencias en el padron global
            </h3>
            <p className="text-sm text-white/40">
              Intenta ajustar la busqueda
            </p>
          </div>
        )}
      </div>
      )}
        </TabsContent>

        {/* Pases Inter-Escolares Tab Content */}
        {isAdmin && (
          <TabsContent value="pases" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bandeja de Entrada - Solicitar Pase Entrante */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <ArrowDownToLine className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#e4e1ea]">Solicitar Pase Entrante</h3>
                    <p className="text-xs text-white/40">Importar legajo desde otra escuela</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <p className="text-xs text-emerald-200/70 leading-relaxed">
                    Ingrese el <strong>Token de Traslado</strong> entregado por la familia que viene de 
                    otra escuela con Sequency para importar el legajo digital completo.
                  </p>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                      <Input
                        placeholder="Ej: TR-8F92A"
                        value={incomingToken}
                        onChange={(e) => setIncomingToken(e.target.value.toUpperCase())}
                        className="pl-9 bg-white/[0.02] border-white/10 font-mono uppercase"
                      />
                    </div>
                    <Button
                      onClick={handleValidateToken}
                      disabled={!incomingToken.trim() || isValidatingToken}
                      className="bg-emerald-500 text-white hover:bg-emerald-500/90 shrink-0"
                    >
                      {isValidatingToken ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="size-4 mr-2" />
                          Validar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bandeja de Salida - Emitir Pase Saliente */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl backdrop-blur-md p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <ArrowUpFromLine className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#e4e1ea]">Emitir Pase Saliente</h3>
                    <p className="text-xs text-white/40">Alumnos en proceso de baja</p>
                  </div>
                </div>

                {pendingPases.length > 0 ? (
                  <div className="space-y-2">
                    {pendingPases.map((student) => (
                      <div 
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 ring-2 ring-amber-500/20">
                            <AvatarFallback className="bg-amber-500/10 text-amber-400 font-semibold text-xs">
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-[#e4e1ea]">
                              {student.lastName}, {student.firstName}
                            </p>
                            <p className="text-xs text-white/40">
                              {student.currentCourse} - Legajo: {student.legajo}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleGeneratePaseToken(student)}
                          size="sm"
                          className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                        >
                          <ExternalLink className="size-3.5 mr-1.5" />
                          Generar Pase
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="size-10 text-white/20 mb-3" />
                    <p className="text-sm text-white/40">No hay alumnos pendientes de pase</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-[#d0bcff]" />
              Cambiar de Division
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Reasigna al alumno a otra division del mismo curso
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-5 py-4">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <Avatar className="size-12 ring-2 ring-[#d0bcff]/20">
                  <AvatarFallback className="bg-[#d0bcff]/10 text-[#d0bcff] font-semibold">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#e4e1ea]">
                    {selectedStudent.lastName}, {selectedStudent.firstName}
                  </p>
                  <p className="text-xs text-white/40">
                    Legajo: {selectedStudent.legajo}
                  </p>
                </div>
              </div>

              {/* Current Division */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Division Actual
                </label>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-sm font-medium text-[#e4e1ea]">
                    {MOCK_DIVISIONS.find((d) => d.id === selectedStudent.currentDivision)?.name}
                  </p>
                </div>
              </div>

              {/* Target Division */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Division de Destino
                </label>
                <Select value={targetDivision} onValueChange={setTargetDivision}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar division..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {getAvailableDivisions(selectedStudent).map((div) => (
                      <SelectItem key={div.id} value={div.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{div.name}</span>
                          <span className="text-xs text-white/40">{div.studentCount} alumnos</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="size-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-200/70 leading-relaxed">
                  Este cambio actualizara las listas de asistencia y calificaciones. 
                  El historial academico se mantendra intacto.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTransferDialogOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!targetDivision || isTransferring}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Confirmar Traspaso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boletin Generator Dialog */}
      <Dialog open={isBoletinDialogOpen} onOpenChange={setIsBoletinDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              {isAdmin ? (
                <FileText className="size-5 text-[#d0bcff]" />
              ) : (
                <Lock className="size-5 text-blue-400" />
              )}
              {isAdmin ? "Exportar Boletines (Editable)" : "Descargar Boletines (Solo Lectura)"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {isAdmin 
                ? "Genera boletines en formato Word editable para revision administrativa."
                : "Descarga boletines oficiales en formato PDF cerrado e inmutable."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Format Info Badge */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl border",
              isAdmin 
                ? "bg-[#d0bcff]/10 border-[#d0bcff]/20" 
                : "bg-blue-500/10 border-blue-500/20"
            )}>
              {isAdmin ? (
                <FileText className="size-5 text-[#d0bcff]" />
              ) : (
                <Lock className="size-5 text-blue-400" />
              )}
              <div>
                <p className={cn("text-sm font-medium", isAdmin ? "text-[#d0bcff]" : "text-blue-400")}>
                  Formato: {exportFormat}
                </p>
                <p className="text-[10px] text-white/40">
                  {isAdmin 
                    ? "Documento editable - Uso exclusivo administrativo" 
                    : "Documento oficial cerrado - No modificable"
                  }
                </p>
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">
                Seleccionar Curso y Division
              </label>
              <Select value={boletinCourse} onValueChange={setBoletinCourse}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Seleccionar curso..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {MOCK_DIVISIONS.map((div) => (
                    <SelectItem key={div.id} value={div.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{div.name}</span>
                        <span className="text-xs text-white/40">{div.studentCount} alumnos</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Panel */}
            <div className="p-4 rounded-xl bg-[#d0bcff]/5 border border-[#d0bcff]/20 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="size-5 text-[#d0bcff] mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#e4e1ea]">
                    Contenido del Boletin
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    El sistema compilara exclusivamente las <strong className="text-[#d0bcff]">Notas Preliminares (TEA/TEP/TED)</strong> y 
                    las <strong className="text-[#d0bcff]">Calificaciones Numericas Finales</strong> de los periodos cerrados, 
                    excluyendo notas parciales de la cursada.
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Course Summary */}
            {boletinCourse && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#e4e1ea]">
                      {MOCK_DIVISIONS.find((d) => d.id === boletinCourse)?.name}
                    </p>
                    <p className="text-xs text-white/40">
                      Nivel Secundario
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-[#4de082]/10 border-[#4de082]/20 text-[#4de082]">
                    {MOCK_DIVISIONS.find((d) => d.id === boletinCourse)?.studentCount} boletines
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBoletinDialogOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateBoletines}
              disabled={!boletinCourse || isGeneratingBoletin}
              className={cn(
                isAdmin 
                  ? "bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isGeneratingBoletin ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {isAdmin ? "Generando Word..." : "Compilando PDF..."}
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  {isAdmin ? "Exportar Lote (DOCX)" : "Descargar Lote (PDF)"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token Generated Dialog */}
      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <Key className="size-5 text-amber-400" />
              Token de Traslado Generado
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Pase para {selectedStudentForPase?.firstName} {selectedStudentForPase?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Token Display */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-xs text-amber-200/70 mb-2">Token de Traslado</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-amber-400 tracking-wider">
                  {generatedToken}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyToken}
                  className="size-8 hover:bg-amber-500/20"
                >
                  <Copy className="size-4 text-amber-400" />
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#e4e1ea]">
                    Instrucciones para la familia
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Entregue este token a la familia para que la escuela de destino reclame 
                    el legajo digital en su base de datos. <strong className="text-amber-400">Los datos 
                    quedaran bloqueados aqui</strong> una vez que el traslado sea completado.
                  </p>
                </div>
              </div>
            </div>

            {/* Lock warning */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <Lock className="size-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-200/70">
                El legajo sera de solo lectura tras el traspaso exitoso.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsTokenDialogOpen(false)}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90 w-full"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promocion Inter-Nivel Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <ArrowUpCircle className="size-5 text-[#d0bcff]" />
              Promover al Nivel Secundario
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {studentToPromote
                ? `Promover a ${studentToPromote.firstName} ${studentToPromote.lastName} al Nivel Secundario`
                : "Asimilar alumno a tu nivel"}
            </DialogDescription>
          </DialogHeader>

          {studentToPromote && (
            <div className="space-y-5 py-4">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <Avatar className="size-12 ring-2 ring-sky-500/20">
                  <AvatarFallback className="bg-sky-500/10 text-sky-300 font-semibold">
                    {studentToPromote.firstName[0]}{studentToPromote.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#e4e1ea]">
                    {studentToPromote.lastName}, {studentToPromote.firstName}
                  </p>
                  <p className="text-xs text-white/40">
                    Origen: {studentToPromote.currentCourse} - Primaria
                  </p>
                </div>
              </div>

              {/* Target Course */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Curso de Destino (Secundaria)
                </label>
                <Select value={promoteTargetDivision} onValueChange={setPromoteTargetDivision}>
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Seleccionar curso..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {SECONDARY_ENTRY_DIVISIONS.map((div) => (
                      <SelectItem key={div.id} value={div.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{div.name}</span>
                          <span className="text-xs text-white/40">{div.studentCount} alumnos</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#d0bcff]/10 border border-[#d0bcff]/20">
                <GraduationCap className="size-4 text-[#d0bcff] mt-0.5 shrink-0" />
                <p className="text-xs text-[#d0bcff]/80 leading-relaxed">
                  El legajo digital y el historial academico del alumno se conservan intactos
                  gracias a la base de datos institucional compartida. Solo cambia su matricula activa.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPromoteDialogOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePromote}
              disabled={!promoteTargetDivision || isPromoting}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isPromoting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Promoviendo...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="size-4 mr-2" />
                  Confirmar Promocion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog (Update) */}
      <Dialog open={editingStudent !== null} onOpenChange={(o) => { if (!o) setEditingStudent(null); }}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#e4e1ea] flex items-center gap-2">
              <Pencil className="size-5 text-[#d0bcff]" />
              Editar Registro
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Modifica los datos del alumno. Los cambios se aplican de inmediato al padron.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Nombre</Label>
                <Input
                  value={studentForm.firstName}
                  onChange={(e) => setStudentForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="bg-white/[0.02] border-white/10 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/60">Apellido</Label>
                <Input
                  value={studentForm.lastName}
                  onChange={(e) => setStudentForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="bg-white/[0.02] border-white/10 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Curso / Division</Label>
              <Select value={studentForm.currentDivision} onValueChange={(v) => setStudentForm((p) => ({ ...p, currentDivision: v }))}>
                <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                  <SelectValue placeholder="Seleccionar division" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {MOCK_DIVISIONS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Condicion</Label>
              <Select value={studentForm.status} onValueChange={(v) => setStudentForm((p) => ({ ...p, status: v as Student["status"] }))}>
                <SelectTrigger className="bg-white/[0.02] border-white/10 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="CONDICIONAL">Condicional</SelectItem>
                  <SelectItem value="LIBRE">Libre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingStudent(null)} className="border-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveStudent}
              disabled={isSavingStudent || !studentForm.firstName.trim() || !studentForm.lastName.trim()}
              className="bg-[#d0bcff] text-[#1b1b1f] hover:bg-[#d0bcff]/90 gap-1.5"
            >
              {isSavingStudent ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete (Archive) Student Confirmation */}
      <AlertDialog open={deletingStudent !== null} onOpenChange={(o) => { if (!o) setDeletingStudent(null); }}>
        <AlertDialogContent className="bg-[#131319] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#e4e1ea]">
              <AlertTriangle className="size-5 text-[#ffb4ab]" />
              Dar de baja a {deletingStudent?.firstName} {deletingStudent?.lastName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Esta accion archivara el legajo del alumno (N.deg {deletingStudent?.legajo}) y lo quitara 
              del padron activo. El historico academico se conserva y puede restaurarse desde Secretaria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent hover:bg-white/5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteStudent}
              className="bg-[#ffb4ab] text-[#1b1b1f] hover:bg-[#ffb4ab]/90"
            >
              <Trash2 className="size-4 mr-1.5" />
              Confirmar Baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Importador de Matricula (Excel/CSV) */}
      <Dialog open={isImportOpen} onOpenChange={(o) => { if (!isProcessingImport) { setIsImportOpen(o); if (!o) setImportFile(null); } }}>
        <DialogContent className="bg-[#131319] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#e4e1ea] flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-emerald-400" />
              Importar Matricula
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Carga masiva del padron de alumnos desde una planilla. Soporta Excel (.xlsx, .xls) y CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Drag & Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
                isDragging
                  ? "border-emerald-400 bg-emerald-500/10"
                  : importFile
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-white/15 bg-white/[0.02] hover:border-white/25"
              )}
            >
              {importFile ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="size-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#e4e1ea]">{importFile.name}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {(importFile.size / 1024).toFixed(1)} KB · Listo para procesar
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImportFile(null)}
                    className="text-white/50 hover:text-white hover:bg-white/5"
                  >
                    Quitar archivo
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <UploadCloud className="size-7 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e4e1ea]">
                      Arrastra y suelta tu archivo aqui
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">o selecciona desde tu equipo</p>
                  </div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                      <FileUp className="size-4" />
                      Seleccionar archivo
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="sr-only"
                      onChange={(e) => handleFileSelected(e.target.files?.[0])}
                    />
                  </label>
                </>
              )}
            </div>

            {/* Plantilla base */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#d0bcff]/10 border border-[#d0bcff]/20 flex items-center justify-center shrink-0">
                  <Sparkles className="size-4 text-[#d0bcff]" />
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed max-w-sm">
                  El sistema requerira las columnas estandar mas los campos personalizados que haya 
                  definido en la Configuracion.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="border-[#d0bcff]/30 text-[#d0bcff] hover:bg-[#d0bcff]/10 hover:text-[#d0bcff] shrink-0 gap-2"
              >
                <Download className="size-4" />
                Descargar Plantilla Base
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsImportOpen(false); setImportFile(null); }}
              disabled={isProcessingImport}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessImport}
              disabled={!importFile || isProcessingImport}
              className="bg-emerald-500 text-[#0a160f] hover:bg-emerald-400 font-semibold gap-2"
            >
              {isProcessingImport ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="size-4" />
                  Importar Padron
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
