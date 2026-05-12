"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Phone,
  Mail,
  AlertCircle,
  Pill,
  Droplets,
  Shield,
  CheckCircle2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MedicalInfo, TutorContact } from "@/lib/types/student";
import { getRelationshipLabel } from "@/lib/types/student";

interface MedicalContactCardProps {
  medical: MedicalInfo;
  tutors: TutorContact[];
}

export function MedicalContactCard({ medical, tutors }: MedicalContactCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAllergies = medical.allergies.length > 0;
  const hasConditions = medical.chronicConditions.length > 0;
  const hasMedications = medical.medications.length > 0;
  const hasMedicalInfo = hasAllergies || hasConditions || hasMedications || medical.bloodType;

  const primaryTutor = tutors.find((t) => t.isPrimaryContact);
  const otherTutors = tutors.filter((t) => !t.isPrimaryContact);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden"
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Heart className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Ficha Medica y Contactos
            </h3>
            <p className="text-sm text-muted-foreground">
              {tutors.length} contacto{tutors.length !== 1 ? "s" : ""} de emergencia
              {hasAllergies && " - Tiene alergias"}
            </p>
          </div>
        </div>
        
        <ChevronDown 
          className={cn(
            "size-5 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )} 
        />
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-6 border-t border-border/50 pt-5">
              {/* Medical Info */}
              {hasMedicalInfo && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    Informacion Medica
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Blood Type */}
                    {medical.bloodType && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border/30">
                        <Droplets className="size-5 text-status-absent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Grupo Sanguineo</p>
                          <p className="text-sm font-semibold text-foreground">
                            {medical.bloodType}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Health Insurance */}
                    {medical.healthInsurance && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border/30">
                        <Shield className="size-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Obra Social</p>
                          <p className="text-sm font-semibold text-foreground">
                            {medical.healthInsurance.provider}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            N° {medical.healthInsurance.memberId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Allergies */}
                  {hasAllergies && (
                    <div className="p-4 rounded-xl bg-status-absent-soft/30 border border-status-absent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="size-4 text-status-absent" />
                        <span className="text-sm font-semibold text-status-absent">
                          Alergias
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {medical.allergies.map((allergy, i) => (
                          <Badge 
                            key={i}
                            variant="outline"
                            className="bg-white/50 dark:bg-black/20 border-status-absent/30"
                          >
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chronic Conditions */}
                  {hasConditions && (
                    <div className="p-4 rounded-xl bg-status-tardy-soft/30 border border-status-tardy/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="size-4 text-status-tardy" />
                        <span className="text-sm font-semibold text-status-tardy-foreground">
                          Condiciones Cronicas
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {medical.chronicConditions.map((condition, i) => (
                          <Badge 
                            key={i}
                            variant="outline"
                            className="bg-white/50 dark:bg-black/20 border-status-tardy/30"
                          >
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {hasMedications && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="size-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          Medicacion
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {medical.medications.map((med, i) => (
                          <Badge 
                            key={i}
                            variant="outline"
                            className="bg-white/50 dark:bg-black/20 border-primary/30"
                          >
                            {med}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emergency Notes */}
                  {medical.emergencyNotes && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        Notas de Emergencia
                      </p>
                      <p className="text-sm text-foreground">
                        {medical.emergencyNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Contacts */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  Contactos de Emergencia
                </h4>

                <div className="space-y-3">
                  {/* Primary Contact */}
                  {primaryTutor && (
                    <TutorCard tutor={primaryTutor} isPrimary />
                  )}

                  {/* Other Contacts */}
                  {otherTutors.map((tutor) => (
                    <TutorCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface TutorCardProps {
  tutor: TutorContact;
  isPrimary?: boolean;
}

function TutorCard({ tutor, isPrimary }: TutorCardProps) {
  return (
    <div 
      className={cn(
        "p-4 rounded-xl border transition-colors",
        isPrimary 
          ? "bg-primary/5 border-primary/20" 
          : "bg-accent/30 border-border/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "p-2 rounded-full",
              isPrimary ? "bg-primary/10" : "bg-muted"
            )}
          >
            <User className={cn("size-4", isPrimary ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {tutor.name}
              </p>
              {tutor.isVerified && (
                <CheckCircle2 className="size-3.5 text-status-present" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {getRelationshipLabel(tutor.relationship)}
              {isPrimary && " - Contacto Principal"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="size-8 p-0"
            asChild
          >
            <a href={`tel:${tutor.phone}`}>
              <Phone className="size-3.5" />
            </a>
          </Button>
          {tutor.email && (
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0"
              asChild
            >
              <a href={`mailto:${tutor.email}`}>
                <Mail className="size-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Phone className="size-3.5" />
          {tutor.phone}
        </span>
        {tutor.email && (
          <span className="flex items-center gap-1.5 truncate">
            <Mail className="size-3.5" />
            {tutor.email}
          </span>
        )}
      </div>
    </div>
  );
}
