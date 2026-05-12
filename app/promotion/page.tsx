"use client";

import { PromotionWizard } from "@/components/promotion";
import { AppShell } from "@/components/layout";

export default function PromotionPage() {
  return (
    <AppShell schoolName="Escuela Tecnica N°5">
      <div className="min-h-screen bg-background">
        <PromotionWizard />
      </div>
    </AppShell>
  );
}
