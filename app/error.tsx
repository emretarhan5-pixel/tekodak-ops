"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDev) {
      console.error(error);
    }
  }, [error, isDev]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
      />
      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Bir Hata Oluştu</h1>
        <p className="mt-3 text-muted-foreground">
          Beklenmeyen bir hata meydana geldi
        </p>

        {isDev ? (
          <pre className="mt-6 w-full max-w-lg overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 text-left text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Hata detayı:</span>
            {"\n"}
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : null}
          </pre>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" size="lg" onClick={reset} className="gap-2">
            <RefreshCw className="size-4" aria-hidden />
            Tekrar Dene
          </Button>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
          >
            <Home className="size-4" aria-hidden />
            Dashboard&apos;a Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
