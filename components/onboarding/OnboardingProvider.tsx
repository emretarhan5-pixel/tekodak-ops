"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { DASHBOARD_ONBOARDING_STEPS } from "@/components/onboarding/onboarding-steps";
import { useTourStorage } from "@/hooks/use-onboarding";

type OnboardingContextValue = {
  restartOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

type OnboardingProviderProps = {
  children: React.ReactNode;
};

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { hydrated, completed, complete, reset } = useTourStorage("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPrompted, setAutoPrompted] = useState(false);

  useEffect(() => {
    if (!hydrated || completed || autoPrompted) return;

    const timer = window.setTimeout(() => {
      setModalOpen(true);
      setAutoPrompted(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [hydrated, completed, autoPrompted]);

  const closeTour = useCallback(() => {
    setTourActive(false);
    setStepIndex(0);
  }, []);

  const finishOnboarding = useCallback(() => {
    complete();
    closeTour();
    setModalOpen(false);
  }, [complete, closeTour]);

  const startTour = useCallback(() => {
    setModalOpen(false);
    setStepIndex(0);
    setTourActive(true);
  }, []);

  const dismissWelcome = useCallback(() => {
    setModalOpen(false);
  }, []);

  const restartOnboarding = useCallback(() => {
    reset();
    setAutoPrompted(true);
    setTourActive(false);
    setStepIndex(0);
    setModalOpen(true);
  }, [reset]);

  const handleNext = useCallback(() => {
    setStepIndex((current) =>
      Math.min(current + 1, DASHBOARD_ONBOARDING_STEPS.length - 1),
    );
  }, []);

  const handlePrev = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    finishOnboarding();
  }, [finishOnboarding]);

  const value = useMemo(
    () => ({
      restartOnboarding,
    }),
    [restartOnboarding],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}

      <OnboardingModal
        open={modalOpen}
        onStartTour={startTour}
        onDismiss={dismissWelcome}
      />

      <OnboardingTour
        steps={DASHBOARD_ONBOARDING_STEPS}
        active={tourActive}
        stepIndex={stepIndex}
        completeButtonLabel="Tamamla 🎉"
        showConfettiOnComplete
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onComplete={finishOnboarding}
      />
    </OnboardingContext.Provider>
  );
}
