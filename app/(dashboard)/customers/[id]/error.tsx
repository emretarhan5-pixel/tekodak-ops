"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ChevronLeft, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CustomerDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CustomerDetailError({
  error,
  reset,
}: CustomerDetailErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Müşteri yüklenemedi</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || "Beklenmeyen bir hata oluştu."}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="default" onClick={reset} className="gap-2">
          <RefreshCw className="size-4" />
          Tekrar dene
        </Button>
        <Link
          href="/customers"
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <ChevronLeft className="size-4" />
          Müşterilere dön
        </Link>
      </div>
    </div>
  );
}
