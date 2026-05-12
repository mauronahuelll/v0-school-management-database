"use client";

import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransferAlert } from "@/lib/types/dashboard";
import { getTransferStatusLabel } from "@/lib/types/dashboard";

// ============================================
// TRANSFER ITEM
// ============================================

interface TransferItemProps {
  transfer: TransferAlert;
  index: number;
}

function TransferItem({ transfer, index }: TransferItemProps) {
  const isIncoming = transfer.type === "INCOMING";

  const statusConfig = {
    PENDING_DOCS: { icon: FileText, color: "text-status-tardy" },
    PENDING_APPROVAL: { icon: Clock, color: "text-status-tardy" },
    IN_TRANSIT: { icon: ArrowRightLeft, color: "text-primary" },
    COMPLETED: { icon: CheckCircle, color: "text-status-present" },
  };

  const config = statusConfig[transfer.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: isIncoming ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
        "hover:bg-accent/50 group"
      )}
    >
      {/* Direction icon */}
      <div
        className={cn(
          "p-2.5 rounded-xl shrink-0",
          isIncoming
            ? "bg-status-present-soft"
            : "bg-status-tardy-soft"
        )}
      >
        {isIncoming ? (
          <ArrowDownLeft className="size-5 text-status-present" />
        ) : (
          <ArrowUpRight className="size-5 text-status-tardy" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground">
              {transfer.studentName}
            </p>
            <p className="text-xs text-muted-foreground">
              DNI: {transfer.studentDni}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {transfer.daysInProcess} dias
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{isIncoming ? "Desde:" : "Hacia:"}</span>
          <span className="font-medium text-foreground truncate">
            {isIncoming ? transfer.fromSchool : transfer.toSchool}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <StatusIcon className={cn("size-3.5", config.color)} />
          <span className="text-xs text-muted-foreground">
            {getTransferStatusLabel(transfer.status)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface TransferAlertsCardProps {
  transfers: TransferAlert[];
}

export function TransferAlertsCard({ transfers }: TransferAlertsCardProps) {
  const incoming = transfers.filter(t => t.type === "INCOMING" && t.status !== "COMPLETED");
  const outgoing = transfers.filter(t => t.type === "OUTGOING" && t.status !== "COMPLETED");
  const pendingCount = incoming.length + outgoing.length;

  if (pendingCount === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-muted">
            <ArrowRightLeft className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Pasaporte Educativo</h3>
            <p className="text-sm text-muted-foreground">Pases entre escuelas</p>
          </div>
        </div>
        
        <div className="py-8 text-center">
          <CheckCircle className="size-12 mx-auto text-status-present/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay pases pendientes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <ArrowRightLeft className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Pasaporte Educativo</h3>
              <p className="text-sm text-muted-foreground">
                {pendingCount} pase(s) en proceso
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-status-tardy-soft text-status-tardy border-0">
              <AlertCircle className="size-3 mr-1" />
              Requiere atencion
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-border/50">
        {/* Incoming */}
        {incoming.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-4">
              Entrantes ({incoming.length})
            </p>
            <div className="space-y-1">
              {incoming.map((transfer, index) => (
                <TransferItem key={transfer.id} transfer={transfer} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Outgoing */}
        {outgoing.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-4">
              Salientes ({outgoing.length})
            </p>
            <div className="space-y-1">
              {outgoing.map((transfer, index) => (
                <TransferItem key={transfer.id} transfer={transfer} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <Button variant="outline" size="sm" className="w-full">
          Gestionar Pases
        </Button>
      </div>
    </div>
  );
}
