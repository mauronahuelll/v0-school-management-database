"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, History, FileText, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentProfileHeader } from "./student-profile-header";
import { StatsOverview } from "./stats-overview";
import { EventTimeline } from "./event-timeline";
import { MedicalContactCard } from "./medical-contact-card";
import { StudentTrayectoria } from "./student-trayectoria";
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
  const [activeTab, setActiveTab] = useState("general");

  // Count pending subjects for badge
  const pendingSubjectsCount = 2; // This would come from data in real implementation

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

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-white/[0.02] border border-white/5 rounded-xl p-1 gap-1 flex-wrap">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <User className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="trayectoria"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <History className="h-4 w-4 mr-2" />
              Trayectoria
              {pendingSubjectsCount > 0 && (
                <Badge 
                  variant="outline" 
                  className="ml-2 bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30 text-[10px] px-1.5"
                >
                  {pendingSubjectsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="historial"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* General Tab - Original Content */}
          <TabsContent value="general" className="mt-6 space-y-6">
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
          </TabsContent>

          {/* Trayectoria Tab - New Content */}
          <TabsContent value="trayectoria" className="mt-6">
            <StudentTrayectoria 
              studentName={`${data.profile.firstName} ${data.profile.lastName}`}
              canEdit={true}
            />
          </TabsContent>

          {/* Historial Tab - Timeline focused */}
          <TabsContent value="historial" className="mt-6">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Historial Academico Completo
              </h3>
              <EventTimeline events={data.timeline} maxVisible={20} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
