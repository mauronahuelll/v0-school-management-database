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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";

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
  { id: "4a", name: "4to Ano A", course: "4to Ano", level: "SECONDARY", studentCount: 28 },
  { id: "4b", name: "4to Ano B", course: "4to Ano", level: "SECONDARY", studentCount: 30 },
  { id: "4c", name: "4to Ano C", course: "4to Ano", level: "SECONDARY", studentCount: 26 },
  { id: "5a", name: "5to Ano A", course: "5to Ano", level: "SECONDARY", studentCount: 25 },
  { id: "5b", name: "5to Ano B", course: "5to Ano", level: "SECONDARY", studentCount: 27 },
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

  // Boletin generator dialog state
  const [isBoletinDialogOpen, setIsBoletinDialogOpen] = useState(false);
  const [boletinCourse, setBoletinCourse] = useState<string>("");
  const [isGeneratingBoletin, setIsGeneratingBoletin] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    const role = activeContext?.role || localStorage.getItem("sequency_dev_role") || "PRECEPTOR";
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

  // Check permissions
  const canTransfer = currentRole === "ADMIN" || currentRole === "PRECEPTOR";
  const isAdmin = currentRole === "ADMIN";

  // Generate boletines with real PDF download
  const handleGenerateBoletines = useCallback(async () => {
    if (!boletinCourse) return;
    
    setIsGeneratingBoletin(true);
    
    // Simulate PDF compilation (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const selectedDiv = MOCK_DIVISIONS.find((d) => d.id === boletinCourse);
    
    // Generate fake PDF content
    const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 300 >> stream
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
0 -50 Td
(Documento generado automaticamente por Sequency.) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
trailer << /Size 6 /Root 1 0 R >>
startxref
600
%%EOF`;
    
    // Create Blob and trigger native browser download
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Boletines_Oficiales_${selectedDiv?.name?.replace(/\s+/g, "_") || "Lote"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsGeneratingBoletin(false);
    setIsBoletinDialogOpen(false);
    setBoletinCourse("");
    
    toast.success(
      "Descarga completada",
      {
        description: `Se generaron ${selectedDiv?.studentCount || 0} boletines para ${selectedDiv?.name}`,
        duration: 5000,
      }
    );
  }, [boletinCourse]);

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

  const getStatusBadge = (status: Student["status"]) => {
    const config = {
      REGULAR: { label: "Regular", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      CONDICIONAL: { label: "Condicional", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      LIBRE: { label: "Libre", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    return config[status];
  };

  if (!mounted || !currentRole) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e4e1ea]">
            Secretaria
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gestion de matricula, pases y documentacion oficial
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              onClick={() => setIsBoletinDialogOpen(true)}
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              <FileStack className="size-4 mr-2" />
              Emitir Boletines Oficiales
            </Button>
          )}
          <Badge variant="outline" className="bg-[#d0bcff]/10 border-[#d0bcff]/20 text-[#d0bcff]">
            <GraduationCap className="size-3.5 mr-1.5" />
            Vista: {currentRole}
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
      </div>

      {/* Students Table */}
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
                          <DropdownMenuItem className="text-white/80 hover:bg-white/5 cursor-pointer">
                            <Eye className="size-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white/80 hover:bg-white/5 cursor-pointer">
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
              <FileStack className="size-5 text-[#d0bcff]" />
              Emitir Boletines Oficiales
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Genera boletines oficiales para un curso completo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
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
              className="bg-[#d0bcff] text-[#1a1a2e] hover:bg-[#d0bcff]/90"
            >
              {isGeneratingBoletin ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Compilando datos historicos...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  Generar y Exportar Lote (PDF)
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

      <Toaster theme="dark" />
    </div>
  );
}
