"use client";

import { ModuleError } from "@/components/errors/module-error";

type TargetsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TargetsError({ error, reset }: TargetsErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Hedefler yüklenemedi"
      backHref="/targets"
      backLabel="Hedeflere dön"
    />
  );
}
