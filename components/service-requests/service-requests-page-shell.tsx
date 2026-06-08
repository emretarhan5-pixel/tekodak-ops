"use client";

import { PageTourProvider } from "@/components/onboarding/PageTourProvider";
import { SERVICE_REQUESTS_ONBOARDING_STEPS } from "@/components/onboarding/onboarding-steps";

type ServiceRequestsPageShellProps = {
  children: React.ReactNode;
};

export function ServiceRequestsPageShell({
  children,
}: ServiceRequestsPageShellProps) {
  return (
    <PageTourProvider
      tourKey="serviceRequests"
      steps={SERVICE_REQUESTS_ONBOARDING_STEPS}
      completeButtonLabel="Anladım! ✓"
      showConfettiOnComplete={false}
    >
      {children}
    </PageTourProvider>
  );
}
