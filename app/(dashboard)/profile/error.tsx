"use client";

import { ModuleError } from "@/components/errors/module-error";

type ProfileErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProfileError({ error, reset }: ProfileErrorProps) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      title="Profil yüklenemedi"
      backHref="/dashboard"
      backLabel="Ana sayfaya dön"
    />
  );
}
