"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ChevronLeft, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModuleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description?: string;
  backHref: string;
  backLabel: string;
};

export function ModuleError({
  error,
  reset,
  title,
  description = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
  backHref,
  backLabel,
}: ModuleErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || description}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={reset} className="gap-2">
          <RefreshCw className="size-4" aria-hidden />
          Tekrar dene
        </Button>
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <ChevronLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
