"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Settings, 
  GraduationCap, 
  ClipboardList,
  Save,
  School,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
            <p className="text-xs text-white/40">Politicas academicas y parametros del sistema</p>
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
          <TabsList className="bg-black/40 border border-white/5 p-1 rounded-2xl">
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
              Valoraciones Preliminares
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
                      Esto permite a los docentes registrar valoraciones intermedias y 
                      a las familias recibir informes de progreso antes del cierre oficial.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-[10px] font-mono rounded-lg border border-purple-500/20">
                        TEA: Trayectoria Escolar Avanzada
                      </span>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-300 text-[10px] font-mono rounded-lg border border-blue-500/20">
                        TEP: Trayectoria Escolar en Proceso
                      </span>
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-300 text-[10px] font-mono rounded-lg border border-amber-500/20">
                        TED: Trayectoria Escolar con Dificultades
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
                    valoraciones TEA/TEP/TED en las ventanas configuradas y las familias 
                    recibiran notificaciones automaticas con el estado de trayectoria de sus hijos.
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
    </div>
  );
}
