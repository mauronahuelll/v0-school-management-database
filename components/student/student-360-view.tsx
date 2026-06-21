"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, BarChart2, CalendarCheck, ShieldCheck, Users, ClipboardList, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentProfileHeader } from "./student-profile-header";
import { StatsOverview } from "./stats-overview";
import { EventTimeline } from "./event-timeline";
import { MedicalContactCard } from "./medical-contact-card";
import { StudentTrayectoria } from "./student-trayectoria";
import { StudentFamilyNetwork } from "./student-family-network";
import { StudentComplementaryData } from "./student-complementary-data";
import type { Student360Data } from "@/lib/types/student";
import { useActiveRole, useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";

interface Student360ViewProps {
  data: Student360Data;
  backUrl?: string;
  onExportPDF?: () => void;
}

export function Student360View({ 
  data, 
  backUrl = "/attendance",
  onExportPDF,
}: Student360ViewProps) {
  const [activeTab, setActiveTab] = useState("resumen");
  const { role } = useActiveRole();
  const { activeContext } = useAuth();
  const router = useRouter();

  // RBAC: deriva si el usuario es familia para ocultarle acciones administrativas
  const isFamilia = activeContext?.role === "FAMILIA";

  // RBAC: FAMILIA siempre vuelve a su dashboard multihijo; el personal vuelve
  // a la página anterior de la que vino (Secretaría, Notas, Parte Diario, etc.)
  const handleBack = useCallback(() => {
    if (isFamilia) {
      router.push("/dashboard");
    } else {
      router.back();
    }
  }, [isFamilia, router]);

  // Count pending subjects for badge
  const pendingSubjectsCount = 2; // This would come from data in real implementation
  const hasRestrictions = true;   // Mock: would come from contacts data

  // Export complete historial handler — solo personal administrativo
  const handleExportHistorial = useCallback(() => {
    toast.success(
      "Legajo consolidado exportado en PDF. Incluye trayectoria desde Nivel Inicial a la fecha.",
      { duration: 5000 }
    );
  }, []);

  return (
    <div className="min-h-screen pb-8">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 md:p-6"
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-6 space-y-6 max-w-6xl mx-auto">
        {/* Profile Header */}
        <StudentProfileHeader
          profile={data.profile}
          onExportPDF={isFamilia ? undefined : onExportPDF}
          onExportHistorial={isFamilia ? undefined : handleExportHistorial}
          isReadOnly={isFamilia}
        />

        {/* ── Tabs estandarizadas ── */}
        {/* Orden definitivo: Resumen · Calificaciones · Asistencia · Comportamiento · Red Familiar · Datos Complementarios/Médicos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-white/[0.02] border border-white/5 rounded-xl p-1 gap-1 flex-wrap h-auto">

            {/* 1 — Resumen */}
            <TabsTrigger
              value="resumen"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <User className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>

            {/* 2 — Calificaciones (Trayectoria académica) */}
            <TabsTrigger
              value="calificaciones"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Calificaciones
              {pendingSubjectsCount > 0 && !isFamilia && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30 text-[10px] px-1.5"
                >
                  {pendingSubjectsCount}
                </Badge>
              )}
            </TabsTrigger>

            {/* 3 — Asistencia */}
            <TabsTrigger
              value="asistencia"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Asistencia
            </TabsTrigger>

            {/* 4 — Comportamiento */}
            <TabsTrigger
              value="comportamiento"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Comportamiento
            </TabsTrigger>

            {/* 5 — Red Familiar */}
            <TabsTrigger
              value="red-familiar"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <Users className="h-4 w-4 mr-2" />
              Red Familiar
              {hasRestrictions && !isFamilia && (
                <ShieldAlert className="h-3.5 w-3.5 ml-1.5 text-red-400" />
              )}
            </TabsTrigger>

            {/* 6 — Datos Complementarios / Médicos */}
            <TabsTrigger
              value="datos-complementarios"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Datos Complementarios
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Resumen ── */}
          <TabsContent value="resumen" className="mt-6 space-y-6">
            <StatsOverview stats={data.stats} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <EventTimeline events={data.timeline} maxVisible={8} />
              </div>
              <div className="lg:col-span-2">
                <MedicalContactCard
                  medical={data.medical}
                  tutors={data.tutors}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 2: Calificaciones ── */}
          {/* StudentTrayectoria deriva su propio canEdit desde activeContext.role internamente */}
          <TabsContent value="calificaciones" className="mt-6">
            <StudentTrayectoria
              studentName={`${data.profile.firstName} ${data.profile.lastName}`}
            />
          </TabsContent>

          {/* ── Tab 3: Asistencia ── */}
          <TabsContent value="asistencia" className="mt-6">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  Registro de Asistencia
                </h3>
                {/* Botón de nueva sanción — solo personal administrativo */}
                {!isFamilia && (
                  <Badge variant="outline" className="text-[10px] text-white/40 border-white/10">
                    Solo lectura en demo
                  </Badge>
                )}
              </div>
              {/* Timeline reutilizado filtrando eventos de asistencia */}
              <EventTimeline
                events={data.timeline.filter(e =>
                  ["absence", "attendance", "tardy"].includes(e.type)
                )}
                maxVisible={20}
              />
            </div>
          </TabsContent>

          {/* ── Tab 4: Comportamiento ── */}
          <TabsContent value="comportamiento" className="mt-6">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Registro de Comportamiento
                </h3>
                {/* Botón "+ Nueva Sanción" — solo personal NO familia */}
                {!isFamilia && (
                  <button
                    onClick={() => toast.info("Modulo de sanciones proximamente.")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    + Nueva Sancion
                  </button>
                )}
              </div>
              <EventTimeline
                events={data.timeline.filter(e =>
                  ["sanction", "behavior", "note"].includes(e.type)
                )}
                maxVisible={20}
              />
            </div>
          </TabsContent>

          {/* ── Tab 5: Red Familiar ── */}
          {/* canEdit=false para FAMILIA → StudentFamilyNetwork oculta dropdown de admin actions */}
          <TabsContent value="red-familiar" className="mt-6">
            <StudentFamilyNetwork
              studentName={`${data.profile.firstName} ${data.profile.lastName}`}
              userRole={role ?? undefined}
              canEdit={!isFamilia}
            />
          </TabsContent>

          {/* ── Tab 6: Datos Complementarios / Médicos ── */}
          <TabsContent value="datos-complementarios" className="mt-6">
            <StudentComplementaryData
              studentName={`${data.profile.firstName} ${data.profile.lastName}`}
              userRole={role ?? undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
