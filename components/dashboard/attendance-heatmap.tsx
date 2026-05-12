"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  CourseAttendanceSummary,
  AttendanceTrendPoint,
} from "@/lib/types/dashboard";
import { getShiftLabel } from "@/lib/types/dashboard";

// ============================================
// CHART CONFIG
// ============================================

const chartConfig = {
  present: {
    label: "Presentes",
    color: "var(--status-present)",
  },
  absent: {
    label: "Ausentes",
    color: "var(--status-absent)",
  },
  tardy: {
    label: "Tarde",
    color: "var(--status-tardy)",
  },
} satisfies ChartConfig;

// ============================================
// COURSE ROW COMPONENT
// ============================================

interface CourseRowProps {
  course: CourseAttendanceSummary;
  index: number;
}

function CourseRow({ course, index }: CourseRowProps) {
  const alertThreshold = 3;
  const hasAlert = course.absentCount >= alertThreshold;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
        "hover:bg-accent/50 group",
        hasAlert && "bg-status-absent-soft/30"
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Alert indicator */}
        {hasAlert && (
          <div className="shrink-0">
            <AlertTriangle className="size-4 text-status-absent animate-pulse" />
          </div>
        )}

        {/* Course info */}
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {course.courseName} {course.divisionName}
          </p>
          <p className="text-xs text-muted-foreground">
            {getShiftLabel(course.shift)} - {course.totalStudents} alumnos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Presence indicators */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="outline" className="bg-status-present-soft text-status-present-foreground border-0 font-medium">
            {course.presentCount}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "border-0 font-medium",
              hasAlert 
                ? "bg-status-absent text-status-absent-foreground" 
                : "bg-status-absent-soft text-status-absent"
            )}
          >
            {course.absentCount}
          </Badge>
          {course.tardyCount > 0 && (
            <Badge variant="outline" className="bg-status-tardy-soft text-status-tardy-foreground border-0 font-medium">
              {course.tardyCount}
            </Badge>
          )}
        </div>

        {/* Presence rate */}
        <div className="w-16 text-right">
          <span
            className={cn(
              "text-sm font-semibold",
              course.presenceRate >= 90
                ? "text-status-present"
                : course.presenceRate >= 75
                ? "text-status-tardy"
                : "text-status-absent"
            )}
          >
            {course.presenceRate.toFixed(0)}%
          </span>
        </div>

        {/* Link */}
        <Link href={`/attendance?course=${course.courseId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="size-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface AttendanceHeatmapProps {
  trendData: AttendanceTrendPoint[];
  courseSummaries: CourseAttendanceSummary[];
  alertThreshold?: number;
}

export function AttendanceHeatmap({
  trendData,
  courseSummaries,
  alertThreshold = 3,
}: AttendanceHeatmapProps) {
  const [showAllCourses, setShowAllCourses] = useState(false);

  // Sort by alert status and absence count
  const sortedCourses = [...courseSummaries].sort((a, b) => {
    const aAlert = a.absentCount >= alertThreshold ? 1 : 0;
    const bAlert = b.absentCount >= alertThreshold ? 1 : 0;
    if (bAlert !== aAlert) return bAlert - aAlert;
    return b.absentCount - a.absentCount;
  });

  const alertCourses = sortedCourses.filter(c => c.absentCount >= alertThreshold);
  const displayCourses = showAllCourses ? sortedCourses : sortedCourses.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Trend Chart */}
      <section className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Tendencia Semanal de Asistencia
          </h3>
          <p className="text-sm text-muted-foreground">
            Evolucion de presencialidad en los ultimos 7 dias
          </p>
        </div>

        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--status-present)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--status-present)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--status-absent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--status-absent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="present"
                stroke="var(--status-present)"
                strokeWidth={2}
                fill="url(#gradientPresent)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="var(--status-absent)"
                strokeWidth={2}
                fill="url(#gradientAbsent)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </section>

      {/* Course List with Alerts */}
      <section className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="size-5" />
              Asistencia por Curso
            </h3>
            <p className="text-sm text-muted-foreground">
              {alertCourses.length > 0
                ? `${alertCourses.length} curso(s) con ${alertThreshold}+ ausentes`
                : "Todos los cursos dentro del rango normal"}
            </p>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-status-present" />
              <span className="text-muted-foreground">Presentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-status-absent" />
              <span className="text-muted-foreground">Ausentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-status-tardy" />
              <span className="text-muted-foreground">Tarde</span>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alertCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-3 rounded-xl bg-status-absent-soft/50 border border-status-absent/20"
          >
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-status-absent shrink-0" />
              <span className="text-status-absent font-medium">
                Atencion: {alertCourses.length} curso(s) superan el umbral de {alertThreshold} ausentes
              </span>
            </div>
          </motion.div>
        )}

        {/* Course List */}
        <div className="space-y-1">
          {displayCourses.map((course, index) => (
            <CourseRow key={course.courseId} course={course} index={index} />
          ))}
        </div>

        {/* Show more/less */}
        {sortedCourses.length > 6 && (
          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCourses(!showAllCourses)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showAllCourses
                ? "Mostrar menos"
                : `Ver ${sortedCourses.length - 6} cursos mas`}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
