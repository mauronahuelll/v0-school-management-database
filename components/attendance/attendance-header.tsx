"use client";

import { Users, UserX, Clock, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="px-6 py-4">
        {/* Top row: Course info and date */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {course.year}° Año "{course.divisionName}"
              </h1>
              <Badge variant="secondary" className="text-xs">
                {formatShift(course.shift)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {formattedDate}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onResetAll}
            disabled={isSubmitting}
            className="shrink-0"
          >
            <CalendarCheck className="size-4" />
            Poner todos Presentes
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6">
          <StatBadge
            icon={Users}
            label="Presentes"
            value={stats.present}
            total={stats.total}
            colorClass="bg-status-present text-status-present-foreground"
          />
          <StatBadge
            icon={UserX}
            label="Ausentes"
            value={stats.absent}
            colorClass="bg-status-absent text-status-absent-foreground"
          />
          <StatBadge
            icon={Clock}
            label="Tardes"
            value={stats.tardy}
            colorClass="bg-status-tardy text-status-tardy-foreground"
          />
          {stats.onLicense > 0 && (
            <StatBadge
              icon={CalendarCheck}
              label="En Licencia"
              value={stats.onLicense}
              colorClass="bg-status-license text-status-license-foreground"
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
  colorClass: string;
}

function StatBadge({ icon: Icon, label, value, total, colorClass }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center size-8 rounded-lg ${colorClass}`}>
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">
          {value}
          {total !== undefined && (
            <span className="text-muted-foreground font-normal">/{total}</span>
          )}
        </span>
      </div>
    </div>
  );
}
