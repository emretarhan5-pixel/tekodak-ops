"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StockDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="border-destructive/40">
      <CardContent className="py-10 text-center">
        <h1 className="text-lg font-semibold text-destructive">
          Stok ürünü yüklenemedi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Beklenmeyen bir hata oluştu."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={() => reset()}
          >
            Tekrar dene
          </button>
          <Link
            href="/stock"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Stok listesine dön
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
