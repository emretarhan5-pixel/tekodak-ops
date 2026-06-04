"use client";

import { ModuleError } from "@/components/errors/module-error";

type WorkOrdersErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkOrdersError({ error, reset }: WorkOrdersErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="İş emirleri yüklenemedi"
      backHref="/work-orders"
      backLabel="İş emirlerine dön"
    />
  );
}
