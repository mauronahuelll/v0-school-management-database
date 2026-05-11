"use client";

import { useState, useMemo, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { AttendanceHeader } from "./attendance-header";
import { StudentRow } from "./student-row";
import { LicenseModal } from "./license-modal";
import { ConfirmationModal } from "./confirmation-modal";

import type {
  StudentAttendance,
  AttendanceStatus,
  AttendanceStats,
  CourseInfo,
  LicenseFormData,
  AttendanceSubmission,
} from "@/lib/types/attendance";
import { roundToDecimals, getAbsenceValue, getTardyValue } from "@/lib/types/attendance";
import { cn } from "@/lib/utils";

interface AttendancePageProps {
  initialStudents: StudentAttendance[];
  course: CourseInfo;
  schoolId: string;
  periodId: string;
  userId: string;
  onSubmit: (submission: AttendanceSubmission) => Promise<void>;
  onSaveLicense: (data: LicenseFormData) => Promise<void>;
  onDeactivateLicense: (studentId: string) => Promise<void>;
}

export function AttendancePage({
  initialStudents,
  course,
  schoolId,
  periodId,
  userId,
  onSubmit,
  onSaveLicense,
  onDeactivateLicense,
}: AttendancePageProps) {
  const [students, setStudents] = useState<StudentAttendance[]>(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendance | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort students alphabetically by last name, then first name
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName, "es");
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName, "es");
    });
  }, [students]);

  // Calculate real-time stats
  const stats: AttendanceStats = useMemo(() => {
    const result = {
      present: 0,
      absent: 0,
      tardy: 0,
      onLicense: 0,
      total: students.length,
    };

    students.forEach((student) => {
      if (student.licenseMode?.isActive) {
        result.onLicense++;
      } else {
        switch (student.status) {
          case "PRESENT":
            result.present++;
            break;
          case "ABSENT":
            result.absent++;
            break;
          case "TARDY":
            result.tardy++;
            break;
        }
      }
    });

    return result;
  }, [students]);

  // Handle status change for a student
  const handleStatusChange = useCallback(
    (studentId: string, newStatus: AttendanceStatus) => {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, status: newStatus } : student
        )
      );
    },
    []
  );

  // Reset all students to PRESENT
  const handleResetAll = useCallback(() => {
    setStudents((prev) =>
      prev.map((student) =>
        student.licenseMode?.isActive
          ? student
          : { ...student, status: "PRESENT" as AttendanceStatus }
      )
    );
  }, []);

  // Open license modal for a student
  const handleOpenLicense = useCallback((student: StudentAttendance) => {
    setSelectedStudent(student);
    setIsLicenseModalOpen(true);
  }, []);

  // Handle license save
  const handleSaveLicense = async (data: LicenseFormData) => {
    await onSaveLicense(data);
    
    // Update local state
    setStudents((prev) =>
      prev.map((student) =>
        student.id === data.studentId
          ? {
              ...student,
              licenseMode: {
                isActive: true,
                reason: data.customReason || data.reason,
                category: data.reason,
                startDate: data.startDate,
                endDate: data.endDate,
                approvedBy: userId,
                notifyOnEnd: !data.silenceNotifications,
              },
            }
          : student
      )
    );
  };

  // Handle license deactivation
  const handleDeactivateLicense = async (studentId: string) => {
    await onDeactivateLicense(studentId);
    
    // Update local state
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, licenseMode: undefined, status: "PRESENT" as AttendanceStatus }
          : student
      )
    );
  };

  // Submit attendance
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const dateString = new Date().toISOString().split("T")[0];
      
      const submission: AttendanceSubmission = {
        schoolId,
        courseId: course.id,
        divisionId: course.divisionId,
        date: dateString,
        periodId,
        createdBy: userId,
        records: students
          .filter((s) => !s.licenseMode?.isActive)
          .map((student) => ({
            studentId: student.id,
            status: student.status,
            absenceValue: roundToDecimals(getAbsenceValue(student.status)),
            tardyValue: roundToDecimals(getTardyValue(student.status)),
          })),
      };

      await onSubmit(submission);
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error("Error submitting attendance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDate = new Date();
  const courseName = `${course.year}° Ano "${course.divisionName}"`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with glassmorphism */}
      <AttendanceHeader
        course={course}
        stats={stats}
        currentDate={currentDate}
        onResetAll={handleResetAll}
        isSubmitting={isSubmitting}
      />

      {/* Student list with scroll */}
      <ScrollArea className="flex-1">
        <div className="pb-28">
          {sortedStudents.map((student, index) => (
            <StudentRow
              key={student.id}
              student={student}
              index={index}
              onStatusChange={handleStatusChange}
              onOpenLicense={handleOpenLicense}
              isDisabled={isSubmitting}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Floating submit button with glass gradient */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 p-5 pointer-events-none",
          "bg-gradient-to-t from-background via-background/95 to-transparent"
        )}
      >
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <Button
            size="lg"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={isSubmitting}
            className={cn(
              "w-full h-14 text-base font-semibold shadow-xl",
              "transition-all duration-300 active:scale-[0.98]",
              "shadow-primary/20 hover:shadow-primary/30"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="size-5" />
                <span>Finalizar y Notificar</span>
                {(stats.absent > 0 || stats.tardy > 0) && (
                  <span 
                    className={cn(
                      "ml-3 px-2.5 py-1 rounded-full text-xs font-bold",
                      "bg-primary-foreground/20"
                    )}
                  >
                    {stats.absent + stats.tardy}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => {
          setIsLicenseModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSave={handleSaveLicense}
        onDeactivate={handleDeactivateLicense}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleSubmit}
        stats={stats}
        courseName={courseName}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
