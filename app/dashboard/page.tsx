"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  GlobalStatsGrid,
  AttendanceHeatmap,
  BehaviorStatusCard,
  TransferAlertsCard,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import type {
  DashboardStats,
  CourseAttendanceSummary,
  AttendanceTrendPoint,
  SignatureStatus,
  TransferAlert,
} from "@/lib/types/dashboard";

// ============================================
// MOCK DATA
// ============================================

const MOCK_STATS: DashboardStats = {
  attendance: {
    totalStudents: 842,
    presentToday: 756,
    absentToday: 52,
    tardyToday: 28,
    onLicense: 6,
    presenceRate: 89.8,
  },
  behavior: {
    totalSanctionsThisMonth: 23,
    pendingSignatures: 8,
    signedSanctions: 12,
    signatureRate: 52.2,
    disputedSanctions: 3,
  },
  academic: {
    averageGrade: 7.2,
    passingRate: 76.5,
    gradesPublished: 145,
    gradesPending: 32,
  },
  transfers: {
    incomingPending: 2,
    outgoingPending: 1,
    completedThisMonth: 4,
  },
  system: {
    status: "OPERATIONAL",
    lastSync: new Date(),
    pendingTasks: 2,
    storageUsed: 45,
  },
};

const MOCK_TREND_DATA: AttendanceTrendPoint[] = [
  { date: "2024-03-04", dateLabel: "Lun 4", present: 780, absent: 45, tardy: 17, total: 842, presenceRate: 92.6 },
  { date: "2024-03-05", dateLabel: "Mar 5", present: 765, absent: 55, tardy: 22, total: 842, presenceRate: 90.9 },
  { date: "2024-03-06", dateLabel: "Mie 6", present: 790, absent: 35, tardy: 17, total: 842, presenceRate: 93.8 },
  { date: "2024-03-07", dateLabel: "Jue 7", present: 772, absent: 48, tardy: 22, total: 842, presenceRate: 91.7 },
  { date: "2024-03-08", dateLabel: "Vie 8", present: 745, absent: 68, tardy: 29, total: 842, presenceRate: 88.5 },
  { date: "2024-03-11", dateLabel: "Lun 11", present: 768, absent: 52, tardy: 22, total: 842, presenceRate: 91.2 },
  { date: "2024-03-12", dateLabel: "Mar 12", present: 756, absent: 52, tardy: 28, total: 842, presenceRate: 89.8 },
];

const MOCK_COURSES: CourseAttendanceSummary[] = [
  { courseId: "1a", courseName: "1ro", divisionId: "a", divisionName: "A", shift: "MORNING", totalStudents: 32, presentCount: 28, absentCount: 4, tardyCount: 0, licenseCount: 0, presenceRate: 87.5, hasAlerts: true },
  { courseId: "2b", courseName: "2do", divisionId: "b", divisionName: "B", shift: "MORNING", totalStudents: 30, presentCount: 27, absentCount: 2, tardyCount: 1, licenseCount: 0, presenceRate: 90.0, hasAlerts: false },
  { courseId: "3a", courseName: "3ro", divisionId: "a", divisionName: "A", shift: "AFTERNOON", totalStudents: 28, presentCount: 22, absentCount: 5, tardyCount: 1, licenseCount: 0, presenceRate: 78.6, hasAlerts: true },
  { courseId: "4c", courseName: "4to", divisionId: "c", divisionName: "C", shift: "MORNING", totalStudents: 35, presentCount: 33, absentCount: 1, tardyCount: 1, licenseCount: 0, presenceRate: 94.3, hasAlerts: false },
  { courseId: "5a", courseName: "5to", divisionId: "a", divisionName: "A", shift: "AFTERNOON", totalStudents: 31, presentCount: 28, absentCount: 2, tardyCount: 1, licenseCount: 0, presenceRate: 90.3, hasAlerts: false },
  { courseId: "6b", courseName: "6to", divisionId: "b", divisionName: "B", shift: "MORNING", totalStudents: 29, presentCount: 26, absentCount: 2, tardyCount: 1, licenseCount: 0, presenceRate: 89.7, hasAlerts: false },
  { courseId: "1b", courseName: "1ro", divisionId: "b", divisionName: "B", shift: "AFTERNOON", totalStudents: 33, presentCount: 27, absentCount: 4, tardyCount: 2, licenseCount: 0, presenceRate: 81.8, hasAlerts: true },
  { courseId: "2a", courseName: "2do", divisionId: "a", divisionName: "A", shift: "MORNING", totalStudents: 30, presentCount: 28, absentCount: 1, tardyCount: 1, licenseCount: 0, presenceRate: 93.3, hasAlerts: false },
];

const MOCK_SIGNATURES: SignatureStatus[] = [
  { sanctionId: "s1", studentName: "Martinez, Juan", courseName: "3ro A", category: "Conducta", severity: 2, createdAt: new Date("2024-03-08"), status: "PENDING", daysWaiting: 4 },
  { sanctionId: "s2", studentName: "Lopez, Maria", courseName: "2do B", category: "Uniforme", severity: 1, createdAt: new Date("2024-03-10"), status: "PENDING", daysWaiting: 2 },
  { sanctionId: "s3", studentName: "Garcia, Pedro", courseName: "5to A", category: "Inasistencia", severity: 3, createdAt: new Date("2024-03-05"), status: "ACKNOWLEDGED", daysWaiting: 0, tutorName: "Carlos Garcia", acknowledgedAt: new Date("2024-03-07") },
  { sanctionId: "s4", studentName: "Rodriguez, Ana", courseName: "4to C", category: "Conducta", severity: 4, createdAt: new Date("2024-03-06"), status: "DISPUTED", daysWaiting: 6 },
  { sanctionId: "s5", studentName: "Fernandez, Luis", courseName: "1ro A", category: "Uniforme", severity: 1, createdAt: new Date("2024-03-11"), status: "PENDING", daysWaiting: 1 },
  { sanctionId: "s6", studentName: "Sanchez, Clara", courseName: "6to B", category: "Responsabilidad", severity: 2, createdAt: new Date("2024-03-04"), status: "ACKNOWLEDGED", daysWaiting: 0, tutorName: "Marta Sanchez", acknowledgedAt: new Date("2024-03-06") },
];

const MOCK_TRANSFERS: TransferAlert[] = [
  { id: "t1", type: "INCOMING", studentName: "Perez, Sofia", studentDni: "45.678.901", fromSchool: "Esc. Tecnica N°3 - San Martin", requestDate: new Date("2024-03-01"), status: "PENDING_DOCS", daysInProcess: 11 },
  { id: "t2", type: "INCOMING", studentName: "Ruiz, Tomas", studentDni: "46.123.456", fromSchool: "Colegio Nacional - Lanus", requestDate: new Date("2024-03-08"), status: "PENDING_APPROVAL", daysInProcess: 4 },
  { id: "t3", type: "OUTGOING", studentName: "Diaz, Lucia", studentDni: "44.567.890", toSchool: "Esc. Media N°12 - Quilmes", requestDate: new Date("2024-03-05"), status: "IN_TRANSIT", daysInProcess: 7 },
];

// ============================================
// PAGE COMPONENT
// ============================================

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell schoolName="Escuela Tecnica N°5">
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-strong border-b border-border/50">
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-1"
                >
                  <div className="p-2 rounded-xl bg-primary/10">
                    <LayoutDashboard className="size-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Panel Institucional
                  </h1>
                </motion.div>
                <p className="text-sm text-muted-foreground capitalize pl-12">
                  {today}
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="size-4" />
                  Actualizar
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-10">
          {/* Global Stats */}
          <GlobalStatsGrid stats={MOCK_STATS} />

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Attendance Heatmap - Takes more space */}
            <div className="lg:col-span-3">
              <AttendanceHeatmap
                trendData={MOCK_TREND_DATA}
                courseSummaries={MOCK_COURSES}
                alertThreshold={3}
              />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Behavior Status */}
              <BehaviorStatusCard
                signatures={MOCK_SIGNATURES}
                totalThisMonth={MOCK_STATS.behavior.totalSanctionsThisMonth}
              />

              {/* Transfer Alerts */}
              <TransferAlertsCard transfers={MOCK_TRANSFERS} />
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
