"use client";

import { ModuleError } from "@/components/errors/module-error";

type NewServiceRequestErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function NewServiceRequestError({
  error,
  reset,
}: NewServiceRequestErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Yeni servis talebi formu yüklenemedi"
      backHref="/service-requests"
      backLabel="Servis taleplerine dön"
    />
  );
}
