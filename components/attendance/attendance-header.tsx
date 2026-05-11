"use client";

import Link from "next/link";
import { Users, UserX, Clock, CalendarCheck, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggleCompact } from "@/components/theme-toggle";
import type { CourseInfo, AttendanceStats } from "@/lib/types/attendance";
import { formatShift } from "@/lib/types/attendance";

interface AttendanceHeaderProps {
  course: CourseInfo;
  stats: AttendanceStats;
  currentDate: Date;
  onResetAll: () => void;
  isSubmitting?: boolean;
}

export function AttendanceHeader({
  course,
  stats,
  currentDate,
  onResetAll,
  isSubmitting = false,
}: AttendanceHeaderProps) {
  const formattedDate = currentDate.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="glass sticky top-0 z-20 border-b border-glass-border">
      <div className="px-6 py-5 lg:px-8">
        {/* Top row: Course info, date and actions */}
        <div className="flex items-start justify-between gap-6 mb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight text-balance">
                {course.year}° Ano "{course.divisionName}"
              </h1>
              <Badge 
                variant="secondary" 
                className="text-xs font-medium bg-secondary/80"
              >
                {formatShift(course.shift)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground capitalize leading-relaxed">
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleCompact />
            <Link href="/sanctions">
              <Button
                variant="outline"
                className="shrink-0 transition-theme gap-2"
              >
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Convivencia</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={onResetAll}
              disabled={isSubmitting}
              className="shrink-0 transition-theme"
            >
              <CalendarCheck className="size-4" />
              <span className="hidden sm:inline">Poner todos Presentes</span>
              <span className="sm:hidden">Reset</span>
            </Button>
          </div>
        </div>

        {/* Stats row with generous spacing */}
        <div className="flex flex-wrap items-center gap-5 lg:gap-8">
          <StatBadge
            icon={Users}
            label="Presentes"
            value={stats.present}
            total={stats.total}
            variant="present"
          />
          <StatBadge
            icon={UserX}
            label="Ausentes"
            value={stats.absent}
            variant="absent"
          />
          <StatBadge
            icon={Clock}
            label="Tardes"
            value={stats.tardy}
            variant="tardy"
          />
          {stats.onLicense > 0 && (
            <StatBadge
              icon={CalendarCheck}
              label="En Licencia"
              value={stats.onLicense}
              variant="license"
            />
          )}
        </div>
      </div>
    </header>
  );
}

interface StatBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total?: number;
  variant: "present" | "absent" | "tardy" | "license";
}

function StatBadge({ icon: Icon, label, value, total, variant }: StatBadgeProps) {
  const variantStyles = {
    present: "bg-status-present text-status-present-foreground shadow-status-present/20",
    absent: "bg-status-absent text-status-absent-foreground shadow-status-absent/20",
    tardy: "bg-status-tardy text-status-tardy-foreground shadow-status-tardy/20",
    license: "bg-status-license text-status-license-foreground shadow-status-license/20",
  };

  return (
    <div className="flex items-center gap-3">
      <div 
        className={`
          flex items-center justify-center size-10 rounded-xl shadow-lg
          transition-theme ${variantStyles[variant]}
        `}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          {label}
        </span>
        <span className="text-base font-semibold text-foreground tabular-nums leading-none">
          {value}
          {total !== undefined && (
            <span className="text-muted-foreground font-normal text-sm">/{total}</span>
          )}
        </span>
      </div>
    </div>
  );
}
