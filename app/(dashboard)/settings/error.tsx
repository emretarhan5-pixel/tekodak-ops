"use client";

import { ModuleError } from "@/components/errors/module-error";

type SettingsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SettingsError({ error, reset }: SettingsErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Ayarlar yüklenemedi"
      backHref="/settings"
      backLabel="Ayarlara dön"
    />
  );
}
