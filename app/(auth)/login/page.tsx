import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

function LoginFallback() {
  return (
    <div className="flex h-64 w-full max-w-md items-center justify-center rounded-xl border border-border/60 bg-card text-sm text-muted-foreground shadow-lg">
      Yükleniyor…
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
