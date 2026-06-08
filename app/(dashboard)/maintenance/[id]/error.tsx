"use client";

import { ModuleError } from "@/components/errors/module-error";

type MaintenanceDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MaintenanceDetailError({
  error,
  reset,
}: MaintenanceDetailErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Bakım planı yüklenemedi"
      backHref="/contracts"
      backLabel="Sözleşmelere dön"
    />
  );
}
