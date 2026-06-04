import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

function ResetPasswordFallback() {
  return (
    <div className="flex h-64 w-full max-w-md items-center justify-center rounded-xl border border-border/60 bg-card text-sm text-muted-foreground shadow-lg">
      Yükleniyor…
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
