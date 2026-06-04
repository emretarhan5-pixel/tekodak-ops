"use client";

import { ModuleError } from "@/components/errors/module-error";

type ContractsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ContractsError({ error, reset }: ContractsErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Sözleşmeler yüklenemedi"
      backHref="/contracts"
      backLabel="Sözleşmelere dön"
    />
  );
}
