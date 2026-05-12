"use client";

import { motion } from "framer-motion";
import { Check, FolderInput, ClipboardCheck, FolderOutput, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROMOTION_STEPS, getStepIndex, type PromotionStep } from "@/lib/types/promotion";

// ============================================
// BESPOKE HORIZONTAL STEPPER
// Minimalist design with precision borders and deep shadows
// ============================================

interface WizardStepperProps {
  currentStep: PromotionStep;
  onStepClick?: (step: PromotionStep) => void;
  completedSteps?: PromotionStep[];
  className?: string;
}

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderInput,
  ClipboardCheck,
  FolderOutput,
  Rocket,
};

export function WizardStepper({
  currentStep,
  onStepClick,
  completedSteps = [],
  className,
}: WizardStepperProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          {/* Progress Line - Background */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-border/50" />
          
          {/* Progress Line - Active */}
          <motion.div
            className="absolute top-6 left-0 h-0.5 bg-primary"
            initial={{ width: "0%" }}
            animate={{
              width: `${(currentIndex / (PROMOTION_STEPS.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {PROMOTION_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[step.icon];
            const isCompleted = completedSteps.includes(step.id) || index < currentIndex;
            const isCurrent = step.id === currentStep;
            const isClickable = onStepClick && (isCompleted || index <= currentIndex);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col items-center"
              >
                {/* Step Circle */}
                <motion.button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex items-center justify-center",
                    "size-12 rounded-2xl",
                    "transition-all duration-300",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isCompleted && "bg-status-present text-status-present-foreground shadow-lg",
                    isCurrent && !isCompleted && "bg-primary text-primary-foreground shadow-xl scale-110",
                    !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                    isClickable && "cursor-pointer hover:scale-105",
                    !isClickable && "cursor-default"
                  )}
                  whileHover={isClickable ? { scale: 1.05 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="size-5" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <Icon className="size-5" />
                  )}
                </motion.button>

                {/* Step Label */}
                <div className="mt-4 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isCurrent && "text-primary",
                      isCompleted && "text-status-present",
                      !isCurrent && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper - Compact Pills */}
      <div className="md:hidden">
        <div className="flex items-center justify-center gap-2">
          {PROMOTION_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id) || index < currentIndex;
            const isCurrent = step.id === currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-full",
                  "transition-all duration-300",
                  isCurrent && "glass-panel shadow-lg",
                  !isCurrent && "bg-transparent"
                )}
              >
                {/* Dot indicator */}
                <div
                  className={cn(
                    "size-2.5 rounded-full transition-colors",
                    isCompleted && "bg-status-present",
                    isCurrent && !isCompleted && "bg-primary",
                    !isCurrent && !isCompleted && "bg-border"
                  )}
                />
                
                {isCurrent && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    className="text-xs font-medium text-foreground whitespace-nowrap"
                  >
                    {step.shortLabel}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Current step description */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Paso {currentIndex + 1} de {PROMOTION_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
