import Link from "next/link";
import { Home } from "lucide-react";

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
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          TEKODAK
        </p>
        <p className="mt-1 text-7xl font-bold tabular-nums text-foreground/90">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-3 text-muted-foreground">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ size: "lg" }), "mt-8 gap-2")}
        >
          <Home className="size-4" aria-hidden />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
