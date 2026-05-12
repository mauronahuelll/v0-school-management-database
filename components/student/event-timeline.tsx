"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserX,
  Clock,
  FileCheck,
  BookOpen,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Award,
  Calendar,
  LogOut,
  LogIn,
  ArrowRight,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TimelineEvent, EventType } from "@/lib/types/student";
import { getEventTypeLabel } from "@/lib/types/student";

interface EventTimelineProps {
  events: TimelineEvent[];
  maxVisible?: number;
}

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  ATTENDANCE_ABSENT: <UserX className="size-4" />,
  ATTENDANCE_TARDY: <Clock className="size-4" />,
  ATTENDANCE_JUSTIFIED: <FileCheck className="size-4" />,
  GRADE_PUBLISHED: <BookOpen className="size-4" />,
  GRADE_RECOVERY: <RefreshCw className="size-4" />,
  BEHAVIOR_OBSERVATION: <MessageSquare className="size-4" />,
  BEHAVIOR_SANCTION: <AlertTriangle className="size-4" />,
  BEHAVIOR_MERIT: <Award className="size-4" />,
  LICENSE_START: <LogOut className="size-4" />,
  LICENSE_END: <LogIn className="size-4" />,
  ENROLLMENT: <Calendar className="size-4" />,
  TRANSFER: <ArrowRight className="size-4" />,
};

const EVENT_COLORS: Record<TimelineEvent["color"], string> = {
  present: "bg-status-present text-status-present-foreground",
  absent: "bg-status-absent text-status-absent-foreground",
  tardy: "bg-status-tardy text-status-tardy-foreground",
  primary: "bg-primary text-primary-foreground",
  warning: "bg-amber-500 text-white",
  success: "bg-emerald-500 text-white",
  muted: "bg-muted text-muted-foreground",
};

const EVENT_LINE_COLORS: Record<TimelineEvent["color"], string> = {
  present: "bg-status-present/30",
  absent: "bg-status-absent/30",
  tardy: "bg-status-tardy/30",
  primary: "bg-primary/30",
  warning: "bg-amber-500/30",
  success: "bg-emerald-500/30",
  muted: "bg-border",
};

type FilterCategory = "attendance" | "grades" | "behavior" | "other";

const EVENT_CATEGORIES: Record<EventType, FilterCategory> = {
  ATTENDANCE_ABSENT: "attendance",
  ATTENDANCE_TARDY: "attendance",
  ATTENDANCE_JUSTIFIED: "attendance",
  GRADE_PUBLISHED: "grades",
  GRADE_RECOVERY: "grades",
  BEHAVIOR_OBSERVATION: "behavior",
  BEHAVIOR_SANCTION: "behavior",
  BEHAVIOR_MERIT: "behavior",
  LICENSE_START: "other",
  LICENSE_END: "other",
  ENROLLMENT: "other",
  TRANSFER: "other",
};

export function EventTimeline({ events, maxVisible = 10 }: EventTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterCategory[]>([
    "attendance", "grades", "behavior", "other"
  ]);

  const filteredEvents = events.filter(
    (event) => filters.includes(EVENT_CATEGORIES[event.type])
  );

  const visibleEvents = expanded 
    ? filteredEvents 
    : filteredEvents.slice(0, maxVisible);

  const hasMore = filteredEvents.length > maxVisible;

  const toggleFilter = (category: FilterCategory) => {
    setFilters((prev) =>
      prev.includes(category)
        ? prev.filter((f) => f !== category)
        : [...prev, category]
    );
  };

  // Group events by date
  const groupedEvents = visibleEvents.reduce((acc, event) => {
    const dateKey = event.date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <h3 className="text-base font-semibold text-foreground">
          Historial de Eventos
        </h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-3.5" />
              Filtrar
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuCheckboxItem
              checked={filters.includes("attendance")}
              onCheckedChange={() => toggleFilter("attendance")}
            >
              Asistencia
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.includes("grades")}
              onCheckedChange={() => toggleFilter("grades")}
            >
              Calificaciones
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.includes("behavior")}
              onCheckedChange={() => toggleFilter("behavior")}
            >
              Convivencia
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.includes("other")}
              onCheckedChange={() => toggleFilter("other")}
            >
              Otros
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Timeline */}
      <div className="p-5">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="size-10 mx-auto mb-3 opacity-50" />
            <p>No hay eventos para mostrar</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedEvents).map(([date, dateEvents], groupIndex) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="space-y-3"
                >
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 -mx-5 px-5 py-2 bg-card/80 backdrop-blur-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {date}
                    </p>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-2 pl-1">
                    {dateEvents.map((event, eventIndex) => (
                      <TimelineItem
                        key={event.id}
                        event={event}
                        isLast={eventIndex === dateEvents.length - 1}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Show More Button */}
        {hasMore && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="gap-2"
            >
              <ChevronDown 
                className={cn(
                  "size-4 transition-transform",
                  expanded && "rotate-180"
                )} 
              />
              {expanded 
                ? "Ver menos" 
                : `Ver ${filteredEvents.length - maxVisible} eventos mas`
              }
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

function TimelineItem({ event, isLast }: TimelineItemProps) {
  return (
    <div className="relative flex gap-4 pb-4">
      {/* Timeline line */}
      {!isLast && (
        <div 
          className={cn(
            "absolute left-[15px] top-9 bottom-0 w-0.5",
            EVENT_LINE_COLORS[event.color]
          )}
        />
      )}

      {/* Icon */}
      <div 
        className={cn(
          "relative z-10 flex items-center justify-center size-8 rounded-full shrink-0 shadow-sm",
          EVENT_COLORS[event.color]
        )}
      >
        {EVENT_ICONS[event.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {event.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {event.description}
            </p>
          </div>
          
          <span className="text-xs text-muted-foreground shrink-0">
            {event.date.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Metadata badges */}
        {event.metadata && (
          <div className="flex flex-wrap gap-2 mt-2">
            {event.metadata.subjectName && (
              <Badge variant="outline" className="text-xs">
                {event.metadata.subjectName}
              </Badge>
            )}
            {event.metadata.gradeValue !== undefined && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  event.metadata.gradeValue >= 6 
                    ? "border-status-present/50 text-status-present"
                    : "border-status-absent/50 text-status-absent"
                )}
              >
                Nota: {event.metadata.gradeValue}
              </Badge>
            )}
            {event.metadata.severity && (
              <Badge variant="outline" className="text-xs">
                Gravedad: {event.metadata.severity}/5
              </Badge>
            )}
            {event.metadata.isRecovery && (
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                Recuperatorio
              </Badge>
            )}
            {event.metadata.requiresAcknowledgment && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  event.metadata.acknowledgmentStatus === "ACKNOWLEDGED"
                    ? "border-status-present/50 text-status-present"
                    : event.metadata.acknowledgmentStatus === "DISPUTED"
                      ? "border-status-absent/50 text-status-absent"
                      : "border-amber-500/50 text-amber-600"
                )}
              >
                {event.metadata.acknowledgmentStatus === "ACKNOWLEDGED" 
                  ? "Firmado"
                  : event.metadata.acknowledgmentStatus === "DISPUTED"
                    ? "Disputado"
                    : "Pendiente de firma"
                }
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
