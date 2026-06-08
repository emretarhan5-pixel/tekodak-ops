"use client";

import { useCallback, useEffect, useState } from "react";

export const ONBOARDING_STORAGE_KEYS = {
  dashboard: "tekodak_onboarding_v1",
  serviceRequests: "tekodak_service_requests_tour_v1",
  notifications: "tekodak_notifications_tour_v1",
} as const;

/** @deprecated Use ONBOARDING_STORAGE_KEYS.dashboard */
export const ONBOARDING_STORAGE_KEY = ONBOARDING_STORAGE_KEYS.dashboard;

export type OnboardingTourKey = keyof typeof ONBOARDING_STORAGE_KEYS;

type OnboardingStorageValue = {
  completed: boolean;
};

function readStorage(storageKey: string): OnboardingStorageValue | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingStorageValue;
    if (typeof parsed.completed !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isTourCompleted(tourKey: OnboardingTourKey): boolean {
  return readStorage(ONBOARDING_STORAGE_KEYS[tourKey])?.completed === true;
}

export function markTourCompleted(tourKey: OnboardingTourKey): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    ONBOARDING_STORAGE_KEYS[tourKey],
    JSON.stringify({ completed: true } satisfies OnboardingStorageValue),
  );
}

export function clearTourStorage(tourKey: OnboardingTourKey): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDING_STORAGE_KEYS[tourKey]);
}

export function isDashboardTourCompleted(): boolean {
  return isTourCompleted("dashboard");
}

export function isServiceRequestsTourCompleted(): boolean {
  return isTourCompleted("serviceRequests");
}

export function isNotificationsTourCompleted(): boolean {
  return isTourCompleted("notifications");
}

/** @deprecated Use markTourCompleted('dashboard') */
export function markOnboardingCompleted(): void {
  markTourCompleted("dashboard");
}

/** @deprecated Use clearTourStorage('dashboard') */
export function clearOnboardingStorage(): void {
  clearTourStorage("dashboard");
}

/** @deprecated Use isDashboardTourCompleted */
export function isOnboardingCompleted(): boolean {
  return isDashboardTourCompleted();
}

export function useTourStorage(tourKey: OnboardingTourKey) {
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isTourCompleted(tourKey));
    setHydrated(true);
  }, [tourKey]);

  const complete = useCallback(() => {
    markTourCompleted(tourKey);
    setCompleted(true);
  }, [tourKey]);

  const reset = useCallback(() => {
    clearTourStorage(tourKey);
    setCompleted(false);
  }, [tourKey]);

  return {
    hydrated,
    completed,
    complete,
    reset,
  };
}

/** @deprecated Use useTourStorage('dashboard') */
export function useOnboardingStorage() {
  return useTourStorage("dashboard");
}
