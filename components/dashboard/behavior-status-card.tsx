"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSignature,
  FileCheck,
  FileX,
  Clock,
  ChevronDown,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SignatureStatus } from "@/lib/types/dashboard";
import { getSeverityLabel } from "@/lib/types/dashboard";

// ============================================
// SIGNATURE ITEM COMPONENT
// ============================================

interface SignatureItemProps {
  item: SignatureStatus;
  index: number;
}

function SignatureItem({ item, index }: SignatureItemProps) {
  const statusConfig = {
    PENDING: {
      icon: Clock,
      label: "Pendiente",
      className: "bg-status-tardy-soft text-status-tardy-foreground",
    },
    ACKNOWLEDGED: {
      icon: FileCheck,
      label: "Firmada",
      className: "bg-status-present-soft text-status-present-foreground",
    },
    DISPUTED: {
      icon: FileX,
      label: "Disputada",
      className: "bg-status-absent-soft text-status-absent-foreground",
    },
  };

  const config = statusConfig[item.status];
  const StatusIcon = config.icon;

  const severityColors: Record<number, string> = {
    1: "bg-muted text-muted-foreground",
    2: "bg-status-tardy-soft text-status-tardy-foreground",
    3: "bg-status-tardy text-status-tardy-foreground",
    4: "bg-status-absent-soft text-status-absent",
    5: "bg-status-absent text-status-absent-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "hover:bg-accent/50 group",
        item.status === "PENDING" && item.daysWaiting > 3 && "border-l-2 border-status-absent"
      )}
    >
      {/* Status Icon */}
      <div className={cn("p-2 rounded-lg shrink-0", config.className)}>
        <StatusIcon className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">
            {item.studentName}
          </p>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", severityColors[item.severity])}>
            {getSeverityLabel(item.severity)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.courseName}</span>
          <span>-</span>
          <span>{item.category}</span>
        </div>
      </div>

      {/* Time info */}
      <div className="text-right shrink-0">
        {item.status === "PENDING" ? (
          <div className="space-y-0.5">
            <p className={cn(
              "text-sm font-medium",
              item.daysWaiting > 3 ? "text-status-absent" : "text-muted-foreground"
            )}>
              {item.daysWaiting} {item.daysWaiting === 1 ? "dia" : "dias"}
            </p>
            <p className="text-xs text-muted-foreground">esperando</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {item.tutorName}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.acknowledgedAt?.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Link */}
      <Link href={`/sanctions?id=${item.sanctionId}`}>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <ExternalLink className="size-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  signed: number;
  pending: number;
  disputed: number;
}

function ProgressBar({ signed, pending, disputed }: ProgressBarProps) {
  const total = signed + pending + disputed;
  if (total === 0) return null;

  const signedPct = (signed / total) * 100;
  const pendingPct = (pending / total) * 100;
  const disputedPct = (disputed / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${signedPct}%` }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-status-present"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pendingPct}%` }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-status-tardy"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${disputedPct}%` }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-status-absent"
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-status-present" />
          {signed} firmadas
        </span>
        <span className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-status-tardy" />
          {pending} pendientes
        </span>
        <span className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-status-absent" />
          {disputed} disputadas
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface BehaviorStatusCardProps {
  signatures: SignatureStatus[];
  totalThisMonth: number;
}

export function BehaviorStatusCard({
  signatures,
  totalThisMonth,
}: BehaviorStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACKNOWLEDGED" | "DISPUTED">("ALL");

  // Calculate stats
  const signed = signatures.filter(s => s.status === "ACKNOWLEDGED").length;
  const pending = signatures.filter(s => s.status === "PENDING").length;
  const disputed = signatures.filter(s => s.status === "DISPUTED").length;
  const urgentPending = signatures.filter(s => s.status === "PENDING" && s.daysWaiting > 3).length;

  // Filter signatures
  const filteredSignatures = filter === "ALL"
    ? signatures
    : signatures.filter(s => s.status === filter);

  // Sort: pending first (by days waiting), then disputed, then acknowledged
  const sortedSignatures = [...filteredSignatures].sort((a, b) => {
    const statusOrder = { PENDING: 0, DISPUTED: 1, ACKNOWLEDGED: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (a.status === "PENDING") {
      return b.daysWaiting - a.daysWaiting;
    }
    return 0;
  });

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileSignature className="size-5" />
              Firmas Digitales
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalThisMonth} sanciones emitidas este mes
            </p>
          </div>

          {/* Urgent alert */}
          {urgentPending > 0 && (
            <Badge variant="outline" className="bg-status-absent-soft text-status-absent border-status-absent/30">
              <AlertCircle className="size-3 mr-1" />
              {urgentPending} urgentes
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <ProgressBar signed={signed} pending={pending} disputed={disputed} />
      </div>

      {/* Filter tabs */}
      <div className="px-6 py-3 border-b border-border/50 flex items-center gap-2 overflow-x-auto">
        {[
          { id: "ALL", label: "Todas", count: signatures.length },
          { id: "PENDING", label: "Pendientes", count: pending },
          { id: "ACKNOWLEDGED", label: "Firmadas", count: signed },
          { id: "DISPUTED", label: "Disputadas", count: disputed },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={filter === tab.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={cn(
              "shrink-0 gap-1.5",
              filter === tab.id && "font-medium"
            )}
          >
            {tab.label}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                filter === tab.id ? "bg-primary/10 text-primary" : "bg-muted"
              )}
            >
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {sortedSignatures.length > 0 ? (
                sortedSignatures.slice(0, 10).map((item, index) => (
                  <SignatureItem key={item.sanctionId} item={item} index={index} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center"
                >
                  <FileCheck className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No hay sanciones en esta categoria
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {sortedSignatures.length > 10 && (
              <div className="pt-4 text-center">
                <Link href="/sanctions">
                  <Button variant="outline" size="sm">
                    Ver todas ({sortedSignatures.length})
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CollapsibleContent>

        {/* Collapse trigger */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-none border-t border-border/50 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-4 mr-2 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
            {isExpanded ? "Ocultar detalles" : "Mostrar detalles"}
          </Button>
        </CollapsibleTrigger>
      </Collapsible>
    </div>
  );
}
