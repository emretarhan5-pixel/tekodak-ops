"use client";

import { ModuleError } from "@/components/errors/module-error";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Kontrol paneli yüklenemedi"
      backHref="/dashboard"
      backLabel="Ana sayfaya dön"
    />
  );
}
