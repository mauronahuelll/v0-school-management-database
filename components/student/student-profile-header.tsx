"use client";

import { motion } from "framer-motion";
import { 
  Calendar,
  FileText,
  User,
  Shield,
  Clock,
  MapPin,
  Download,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudentProfile } from "@/lib/types/student";
import { getStatusLabel, getStatusColor } from "@/lib/types/student";

interface StudentProfileHeaderProps {
  profile: StudentProfile;
  onExportPDF?: () => void;
  onExportHistorial?: () => void;
  /** Si true, oculta todos los botones de acción administrativa (FAMILIA) */
  isReadOnly?: boolean;
}

export function StudentProfileHeader({ profile, onExportPDF, onExportHistorial, isReadOnly = false }: StudentProfileHeaderProps) {
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  const age = new Date().getFullYear() - profile.birthDate.getFullYear();
  
  const shiftLabels = {
    MORNING: "Turno Manana",
    AFTERNOON: "Turno Tarde",
    NIGHT: "Turno Noche",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar Section */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Avatar className="size-28 md:size-32 ring-2 ring-[#8A2BE2]/50 ring-offset-2 ring-offset-[#0A0A0F] shadow-[0_0_25px_rgba(138,43,226,0.2)]">
              <AvatarImage src={profile.photoUrl} alt={profile.firstName} />
              <AvatarFallback className="bg-[#8A2BE2]/20 text-[#D0BCFF] text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Info Section */}
          <div className="flex-1 space-y-4">
            {/* Name & Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#E4E1EA] text-balance">
                  {profile.lastName}, {profile.firstName}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={cn("text-sm px-3 py-1", getStatusColor(profile.status))}>
                    {getStatusLabel(profile.status)}
                  </Badge>
                  {profile.licenseMode?.isActive && (
                    <Badge variant="outline" className="text-sm px-3 py-1 border-status-license text-status-license-foreground bg-status-license-soft">
                      <Clock className="size-3 mr-1.5" />
                      Licencia hasta {profile.licenseMode.endDate?.toLocaleDateString("es-AR")}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Export Buttons — solo personal administrativo, oculto para FAMILIA */}
              {!isReadOnly && (
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={onExportHistorial}
                    className="gap-2 transition-theme bg-[#d0bcff]/10 border-[#d0bcff]/20 text-[#d0bcff] hover:bg-[#d0bcff]/20"
                  >
                    <Download className="size-4" />
                    Exportar Analitico / Historial Completo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onExportPDF}
                    className="gap-2 transition-theme"
                  >
                    <FileText className="size-4" />
                    Exportar Legajo PDF
                  </Button>
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <InfoItem
                icon={<User className="size-4" />}
                label="DNI"
                value={profile.dni}
              />
              <InfoItem
                icon={<FileText className="size-4" />}
                label="Legajo"
                value={profile.enrollmentNumber}
              />
              <InfoItem
                icon={<Calendar className="size-4" />}
                label="Edad"
                value={`${age} anos`}
              />
              <InfoItem
                icon={<Shield className="size-4" />}
                label="Ciclo"
                value={profile.academicYear.toString()}
              />
            </div>

            {/* Course Info */}
            <div className="flex items-center gap-2 pt-2 text-white/50">
              <MapPin className="size-4" />
              <span className="text-sm">
                <span className="font-medium text-[#E4E1EA]">
                  {profile.courseName} "{profile.divisionName}"
                </span>
                {" - "}
                {shiftLabels[profile.shift]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper component for metadata items
function InfoItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-[#8A2BE2]/25 transition-all duration-200">
      <div className="text-[#D0BCFF]/60">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-white/40 truncate">{label}</p>
        <p className="text-sm font-semibold text-[#E4E1EA] truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}
