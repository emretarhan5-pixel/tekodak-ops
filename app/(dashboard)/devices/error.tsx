"use client";

import { ModuleError } from "@/components/errors/module-error";

type DevicesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DevicesError({ error, reset }: DevicesErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Cihazlar yüklenemedi"
      backHref="/devices"
      backLabel="Cihazlara dön"
    />
  );
}
