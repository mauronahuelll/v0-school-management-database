"use client";

import { memo } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StudentAttendance, AttendanceStatus } from "@/lib/types/attendance";
import { formatStatus, getNextStatus, roundToDecimals } from "@/lib/types/attendance";
import { cn } from "@/lib/utils";

interface StudentRowProps {
  student: StudentAttendance;
  index: number;
  onStatusChange: (studentId: string, newStatus: AttendanceStatus) => void;
  onOpenLicense: (student: StudentAttendance) => void;
  isDisabled?: boolean;
}

export const StudentRow = memo(function StudentRow({
  student,
  index,
  onStatusChange,
  onOpenLicense,
  isDisabled = false,
}: StudentRowProps) {
  const isOnLicense = student.licenseMode?.isActive ?? false;
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  const handleStatusClick = () => {
    if (isOnLicense || isDisabled) return;
    const newStatus = getNextStatus(student.status);
    onStatusChange(student.id, newStatus);
  };

  const getStatusStyles = (status: AttendanceStatus): string => {
    const styles: Record<AttendanceStatus, string> = {
      PRESENT: cn(
        "bg-status-present text-status-present-foreground",
        "hover:bg-status-present/90 shadow-sm shadow-status-present/20"
      ),
      ABSENT: cn(
        "bg-status-absent text-status-absent-foreground",
        "hover:bg-status-absent/90 shadow-sm shadow-status-absent/20"
      ),
      TARDY: cn(
        "bg-status-tardy text-status-tardy-foreground",
        "hover:bg-status-tardy/90 shadow-sm shadow-status-tardy/20"
      ),
    };
    return styles[status];
  };

  // Show warning if student is close to absence limit
  const absenceWarning = student.stats.totalAbsences >= 15;

  return (
    <div
      className={cn(
        // Base styles with generous padding for "breathing room"
        "group flex items-center gap-5 px-6 py-4 lg:px-8",
        "border-b border-border/60 transition-theme",
        // License mode: diagonal stripes pattern + reduced opacity
        isOnLicense && "license-stripes opacity-70",
        // Normal hover state
        !isOnLicense && "hover:bg-accent/40",
        // Subtle alternating rows
        !isOnLicense && index % 2 === 0 && "bg-card/50"
      )}
    >
      {/* Row number with better visibility */}
      <span className="w-7 text-sm text-muted-foreground text-center tabular-nums font-medium">
        {index + 1}
      </span>

      {/* Avatar with subtle ring */}
      <Avatar className="size-11 shrink-0 ring-2 ring-border/50">
        <AvatarImage 
          src={student.photoUrl} 
          alt={`${student.firstName} ${student.lastName}`} 
        />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Student info with improved typography */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-foreground truncate text-[15px] leading-snug">
            {student.lastName}, {student.firstName}
          </span>
          {absenceWarning && !isOnLicense && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center size-5 rounded-full bg-status-absent-soft">
                    <AlertCircle className="size-3.5 text-status-absent" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="glass">
                  <p className="text-sm">
                    Atencion: {roundToDecimals(student.stats.totalAbsences)} faltas acumuladas
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-xs text-muted-foreground leading-relaxed">
          Legajo: {student.enrollmentNumber}
        </span>
      </div>

      {/* Absence counter with color coding */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 mr-3">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Faltas
        </span>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            student.stats.totalAbsences >= 20
              ? "text-status-absent"
              : student.stats.totalAbsences >= 15
              ? "text-status-tardy"
              : "text-foreground"
          )}
        >
          {roundToDecimals(student.stats.totalAbsences)}
        </span>
      </div>

      {/* Status button or License badge */}
      {isOnLicense ? (
        <Badge
          variant="secondary"
          className={cn(
            "min-w-28 justify-center py-2 px-4 text-xs font-semibold",
            "bg-status-license/80 text-status-license-foreground border border-status-license"
          )}
        >
          EN LICENCIA
        </Badge>
      ) : (
        <Button
          variant="ghost"
          size="lg"
          onClick={handleStatusClick}
          disabled={isDisabled}
          className={cn(
            "min-w-28 font-semibold text-sm tracking-wide transition-all",
            "active:scale-95",
            getStatusStyles(student.status)
          )}
        >
          {formatStatus(student.status).toUpperCase()}
        </Button>
      )}

      {/* License calendar button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenLicense(student)}
              disabled={isDisabled}
              className={cn(
                "shrink-0 size-10 rounded-xl transition-theme",
                "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Calendar className="size-4" />
              <span className="sr-only">Gestionar licencia</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="glass">
            <p className="text-sm">
              {isOnLicense ? "Ver licencia activa" : "Programar licencia"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});
