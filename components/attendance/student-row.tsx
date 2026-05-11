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
      PRESENT:
        "bg-status-present text-status-present-foreground hover:bg-status-present/90",
      ABSENT:
        "bg-status-absent text-status-absent-foreground hover:bg-status-absent/90",
      TARDY:
        "bg-status-tardy text-status-tardy-foreground hover:bg-status-tardy/90",
    };
    return styles[status];
  };

  // Show warning if student is close to absence limit
  const absenceWarning = student.stats.totalAbsences >= 15;

  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 border-b border-border transition-colors",
        isOnLicense
          ? "bg-muted/50 opacity-75"
          : "hover:bg-accent/50",
        index % 2 === 0 ? "bg-card" : "bg-background"
      )}
    >
      {/* Row number */}
      <span className="w-6 text-xs text-muted-foreground text-center tabular-nums">
        {index + 1}
      </span>

      {/* Avatar */}
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Student info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {student.lastName}, {student.firstName}
          </span>
          {absenceWarning && !isOnLicense && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="size-4 text-status-absent shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Atención: {roundToDecimals(student.stats.totalAbsences)} faltas acumuladas
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Legajo: {student.enrollmentNumber}
        </span>
      </div>

      {/* Absence counter */}
      <div className="hidden sm:flex flex-col items-end mr-2">
        <span className="text-xs text-muted-foreground">Faltas</span>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
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
          className="bg-status-license text-status-license-foreground min-w-24 justify-center"
        >
          LICENCIA
        </Badge>
      ) : (
        <Button
          variant="ghost"
          size="lg"
          onClick={handleStatusClick}
          disabled={isDisabled}
          className={cn(
            "min-w-24 font-semibold transition-all",
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
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Calendar className="size-4" />
              <span className="sr-only">Gestionar licencia</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnLicense ? "Ver licencia activa" : "Programar licencia"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});
