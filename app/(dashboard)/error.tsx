"use client";

import { ModuleError } from "@/components/errors/module-error";

type DashboardSegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardSegmentError({
  error,
  reset,
}: DashboardSegmentErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Sayfa yüklenemedi"
      backHref="/dashboard"
      backLabel="Ana sayfaya dön"
    />
  );
}
