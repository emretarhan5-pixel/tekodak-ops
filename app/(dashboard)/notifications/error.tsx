"use client";

import { ModuleError } from "@/components/errors/module-error";

type NotificationsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function NotificationsError({
  error,
  reset,
}: NotificationsErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Bildirimler yüklenemedi"
      backHref="/notifications"
      backLabel="Bildirimlere dön"
    />
  );
}
