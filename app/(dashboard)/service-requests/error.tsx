"use client";

import { ModuleError } from "@/components/errors/module-error";

type ServiceRequestsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ServiceRequestsError({
  error,
  reset,
}: ServiceRequestsErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Servis talepleri yüklenemedi"
      backHref="/service-requests"
      backLabel="Servis taleplerine dön"
    />
  );
}
