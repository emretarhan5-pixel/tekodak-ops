"use client";

import { ModuleError } from "@/components/errors/module-error";

type ServiceRequestDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ServiceRequestDetailError({
  error,
  reset,
}: ServiceRequestDetailErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Servis talebi yüklenemedi"
      backHref="/service-requests"
      backLabel="Servis taleplerine dön"
    />
  );
}
