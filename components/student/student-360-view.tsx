"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StudentProfileHeader } from "./student-profile-header";
import { StatsOverview } from "./stats-overview";
import { EventTimeline } from "./event-timeline";
import { MedicalContactCard } from "./medical-contact-card";
import type { Student360Data } from "@/lib/types/student";

interface Student360ViewProps {
  data: Student360Data;
  backUrl?: string;
  onExportPDF?: () => void;
}

export function Student360View({ 
  data, 
  backUrl = "/attendance",
  onExportPDF,
}: Student360ViewProps) {
  return (
    <div className="min-h-screen pb-8">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 md:p-6"
      >
        <Link href={backUrl}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        </Link>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-6 space-y-6 max-w-6xl mx-auto">
        {/* Profile Header */}
        <StudentProfileHeader 
          profile={data.profile} 
          onExportPDF={onExportPDF}
        />

        {/* Stats Overview */}
        <StatsOverview stats={data.stats} />

        {/* Two Column Layout for Timeline and Medical */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Timeline - Takes more space */}
          <div className="lg:col-span-3">
            <EventTimeline events={data.timeline} maxVisible={8} />
          </div>

          {/* Medical & Contacts - Sidebar */}
          <div className="lg:col-span-2">
            <MedicalContactCard 
              medical={data.medical} 
              tutors={data.tutors} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
