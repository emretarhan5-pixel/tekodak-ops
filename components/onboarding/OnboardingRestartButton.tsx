"use client";

import { useOptionalPageTour } from "@/components/onboarding/PageTourProvider";

export function OnboardingRestartButton() {
  const tour = useOptionalPageTour();
  if (!tour) return null;

  const { restartTour } = tour;

  return (
    <button
      type="button"
      onClick={restartTour}
      className="text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
    >
      ? Turu Tekrar Başlat
    </button>
  );
}
