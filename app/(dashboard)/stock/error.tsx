"use client";

import { ModuleError } from "@/components/errors/module-error";

type StockErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StockError({ error, reset }: StockErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Stok yüklenemedi"
      backHref="/stock"
      backLabel="Stoka dön"
    />
  );
}
