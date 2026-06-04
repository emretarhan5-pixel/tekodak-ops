"use client";

import { ModuleError } from "@/components/errors/module-error";

type CustomersErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CustomersError({ error, reset }: CustomersErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Müşteriler yüklenemedi"
      backHref="/customers"
      backLabel="Müşterilere dön"
    />
  );
}
