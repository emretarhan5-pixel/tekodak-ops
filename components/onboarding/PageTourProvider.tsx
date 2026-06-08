"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import type { OnboardingStep } from "@/components/onboarding/onboarding-steps";
import {
  type OnboardingTourKey,
  useTourStorage,
} from "@/hooks/use-onboarding";
import { useDashboardUser } from "@/components/providers/dashboard-user-provider";

type PageTourContextValue = {
  restartTour: () => void;
};

const PageTourContext = createContext<PageTourContextValue | null>(null);

export function usePageTour(): PageTourContextValue {
  const context = useContext(PageTourContext);
  if (!context) {
    throw new Error("usePageTour must be used within PageTourProvider");
  }
  return context;
}

export function useOptionalPageTour(): PageTourContextValue | null {
  return useContext(PageTourContext);
}

type PageTourProviderProps = {
  tourKey: OnboardingTourKey;
  steps: OnboardingStep[];
  completeButtonLabel?: string;
  showConfettiOnComplete?: boolean;
  children: React.ReactNode;
};

export function PageTourProvider({
  tourKey,
  steps,
  completeButtonLabel = "Anladım! ✓",
  showConfettiOnComplete = false,
  children,
}: PageTourProviderProps) {
  const user = useDashboardUser();
  const isStaff = user?.role === "staff";
  const { hydrated, completed, complete, reset } = useTourStorage(tourKey);
  const [tourActive, setTourActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPrompted, setAutoPrompted] = useState(false);

  useEffect(() => {
    if (!isStaff || !hydrated || completed || autoPrompted) return;

    const timer = window.setTimeout(() => {
      setStepIndex(0);
      setTourActive(true);
      setAutoPrompted(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [isStaff, hydrated, completed, autoPrompted]);

  const closeTour = useCallback(() => {
    setTourActive(false);
    setStepIndex(0);
  }, []);

  const finishTour = useCallback(() => {
    complete();
    closeTour();
  }, [complete, closeTour]);

  const restartTour = useCallback(() => {
    reset();
    setAutoPrompted(true);
    setStepIndex(0);
    setTourActive(true);
  }, [reset]);

  const handleNext = useCallback(() => {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [steps.length]);

  const handlePrev = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const value = useMemo(() => ({ restartTour }), [restartTour]);

  if (!isStaff) {
    return <>{children}</>;
  }

  return (
    <PageTourContext.Provider value={value}>
      {children}

      <OnboardingTour
        steps={steps}
        active={tourActive}
        stepIndex={stepIndex}
        completeButtonLabel={completeButtonLabel}
        showConfettiOnComplete={showConfettiOnComplete}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={finishTour}
        onComplete={finishTour}
      />
    </PageTourContext.Provider>
  );
}
