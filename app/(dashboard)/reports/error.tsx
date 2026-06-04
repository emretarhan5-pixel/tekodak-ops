"use client";

import { ModuleError } from "@/components/errors/module-error";

type ReportsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ReportsError({ error, reset }: ReportsErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Raporlar yüklenemedi"
      backHref="/reports"
      backLabel="Raporlara dön"
    />
  );
}
