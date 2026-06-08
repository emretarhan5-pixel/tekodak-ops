"use client";

import { PageTourProvider } from "@/components/onboarding/PageTourProvider";
import { NOTIFICATIONS_ONBOARDING_STEPS } from "@/components/onboarding/onboarding-steps";

type NotificationsPageShellProps = {
  children: React.ReactNode;
};

export function NotificationsPageShell({
  children,
}: NotificationsPageShellProps) {
  return (
    <PageTourProvider
      tourKey="notifications"
      steps={NOTIFICATIONS_ONBOARDING_STEPS}
      completeButtonLabel="Anladım! ✓"
      showConfettiOnComplete={false}
    >
      {children}
    </PageTourProvider>
  );
}
