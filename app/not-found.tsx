import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
      />
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" aria-hidden />
        </div>
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Sayfa bulunamadı
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          404 - Sayfa Bulunamadı
        </h1>
        <p className="mt-3 text-muted-foreground">
          Aradığınız sayfa mevcut değil
        </p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ size: "lg" }), "mt-8 gap-2")}
        >
          <Home className="size-4" aria-hidden />
          Dashboard&apos;a Dön
        </Link>
      </div>
    </div>
  );
}
