"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Loader2,
  Play,
  Plus,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  StaffDashboardData,
  StaffDashboardMaintenancePlanItem,
  StaffDashboardPlannedDateUrgency,
  StaffDashboardServiceRequestItem,
} from "@/lib/api/dashboard/types";
import { OnboardingProvider, useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { startMaintenancePlan } from "@/lib/api/maintenance/start-maintenance-plan";
import { cn } from "@/lib/utils";

type StaffDashboardProps = {
  data: StaffDashboardData;
};

const URGENCY_CHIP_CLASSES: Record<StaffDashboardPlannedDateUrgency, string> = {
  overdue: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  urgent:
    "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200",
  warning:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  normal: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const URGENCY_BORDER_CLASSES: Record<StaffDashboardPlannedDateUrgency, string> = {
  overdue: "border-l-red-500",
  urgent: "border-l-orange-500",
  warning: "border-l-amber-400",
  normal: "border-l-slate-200",
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useCountUp(target: number, duration = 800): number {
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    setValue(0);

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reducedMotion]);

  return value;
}

function useAnimatedWidth(target: number, duration = 1000): number {
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    setValue(0);

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reducedMotion]);

  return value;
}

function getGreeting(hour: number, firstName: string): string {
  if (hour >= 6 && hour < 12) {
    return `Günaydın, ${firstName} 👋`;
  }
  if (hour >= 12 && hour < 18) {
    return `İyi günler, ${firstName} 👋`;
  }
  return `İyi akşamlar, ${firstName} 👋`;
}

function getMotivationMessage(data: StaffDashboardData): string {
  const { summary, performance } = data;
  const hasUrgent =
    summary.urgentServiceRequestsCount > 0 ||
    summary.urgentMaintenancePlansCount > 0;

  if (hasUrgent) {
    return "⚡ Dikkat! Acil işlerin var.";
  }
  if (performance.openTotalCount === 0) {
    return "Bugün temiz bir gün! 🎉";
  }
  if (performance.openTotalCount <= 3) {
    return `Bugün ${performance.openTotalCount} işin var. Hadi başlayalım!`;
  }
  return "Yoğun bir gün! Öncelikli işlerden başla.";
}

function shortDateLabel(
  plannedDate: string | null,
  daysRemaining: number | null,
): string {
  if (!plannedDate) return "—";
  if (daysRemaining === null) {
    try {
      return format(parseISO(plannedDate), "d MMM", { locale: tr });
    } catch {
      return plannedDate;
    }
  }
  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)}g gecikti`;
  }
  if (daysRemaining === 0) {
    return "Bugün";
  }
  return `${daysRemaining}g`;
}

function UrgencyChip({
  urgency,
  label,
}: {
  urgency: StaffDashboardPlannedDateUrgency;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        URGENCY_CHIP_CLASSES[urgency],
      )}
    >
      {label}
    </span>
  );
}

function CompactAction({
  href,
  onClick,
  loading,
  loadingText,
  children,
  variant = "default",
}: {
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const className = cn(
    buttonVariants({ variant, size: "sm" }),
    "group h-7 shrink-0 gap-1 px-2 text-xs transition-transform active:scale-[0.98] [&_svg]:size-3 [&_svg]:transition-transform group-hover:[&_svg]:translate-x-0.5",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={className}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function CompactRow({
  urgency,
  children,
  actions,
}: {
  urgency: StaffDashboardPlannedDateUrgency;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border-b border-slate-100 border-l-2 px-2 py-2 transition-colors last:border-0 hover:bg-slate-50/80 md:flex md:h-12 md:items-center md:gap-2 md:px-3 md:py-0",
        URGENCY_BORDER_CLASSES[urgency],
      )}
    >
      <div className="min-w-0 flex-1 space-y-1 text-xs md:truncate md:space-y-0">
        {children}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:mt-0 md:shrink-0 md:flex-nowrap">
        {actions}
      </div>
    </div>
  );
}

function StaffDashboardHeader({ data }: { data: StaffDashboardData }) {
  const { restartOnboarding } = useOnboarding();
  const firstName = data.userName.trim().split(/\s+/)[0] || data.userName;
  const [greeting, setGreeting] = useState(`Merhaba, ${firstName} 👋`);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours(), firstName));
    setTodayLabel(
      now.toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, [firstName]);

  const motivation = useMemo(() => getMotivationMessage(data), [data]);

  return (
    <header className="group staff-dash-fade-down relative -mx-3 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white px-3 py-4 md:-mx-6 md:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="min-w-0 space-y-0.5"
          data-onboarding-target="dashboard-header"
        >
          <h1
            className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
            suppressHydrationWarning
          >
            {greeting}
          </h1>
          <p className="truncate text-xs text-slate-600 md:text-sm">
            {motivation}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="text-left text-xs lg:text-right">
            <p
              className="font-medium capitalize text-slate-800"
              suppressHydrationWarning
            >
              {todayLabel}
            </p>
            <p className="text-slate-500">{data.branchName}</p>
          </div>
          <Link
            href="/service-requests/new"
            data-onboarding="new-request-btn"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden h-8 gap-1.5 px-3 text-xs md:inline-flex",
            )}
          >
            <Plus className="size-3.5" />
            Yeni Talep
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={restartOnboarding}
        className="absolute right-4 bottom-2 text-[11px] text-slate-400 opacity-0 transition-opacity hover:text-slate-600 group-hover:opacity-100 md:right-6"
      >
        ? Turu Tekrar Başlat
      </button>
    </header>
  );
}

function SummaryStatCard({
  index,
  icon: Icon,
  iconClassName,
  value,
  label,
  urgentCount,
  success,
}: {
  index: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  value: number;
  label: string;
  urgentCount?: number;
  success?: boolean;
}) {
  const displayValue = useCountUp(value);
  const hasUrgent = (urgentCount ?? 0) > 0;

  return (
    <div
      className={cn(
        "staff-dash-stagger-card flex items-center gap-2 overflow-hidden rounded-lg border bg-white px-2 py-2.5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md md:gap-3 md:px-3 md:py-3",
        success && "border-emerald-200",
        hasUrgent && "staff-dash-urgent-pulse border-red-300",
        !success && !hasUrgent && "border-slate-200/80",
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          iconClassName,
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold leading-none tabular-nums text-slate-900">
          {displayValue}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{label}</p>
      </div>
      {hasUrgent ? (
        <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
          {urgentCount} acil
        </span>
      ) : null}
    </div>
  );
}

function ServiceRequestRow({ item }: { item: StaffDashboardServiceRequestItem }) {
  return (
    <CompactRow
      urgency={item.urgency}
      actions={
        <>
          <UrgencyChip
            urgency={item.urgency}
            label={shortDateLabel(item.planned_date, item.days_remaining)}
          />
          <CompactAction href={`/service-requests/${item.id}`}>
            Devam Et
            <ArrowRight />
          </CompactAction>
        </>
      }
    >
      <div className="min-w-0">
        <Link
          href={`/service-requests/${item.id}`}
          className="font-mono font-semibold text-blue-600 hover:underline"
        >
          {item.request_number}
        </Link>
        <span className="text-slate-400"> · </span>
        <span className="font-medium text-slate-800">{item.company_name}</span>
      </div>
      <p className="text-muted-foreground md:hidden">{item.step_label}</p>
      <span className="hidden md:contents">
        <span className="text-slate-400"> · </span>
        <span className="text-muted-foreground">{item.step_label}</span>
      </span>
    </CompactRow>
  );
}

function MaintenanceRow({ item }: { item: StaffDashboardMaintenancePlanItem }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const isPlanned = item.status === "planned";

  async function handleStart() {
    if (!isPlanned) {
      router.push(`/maintenance/${item.id}`);
      return;
    }

    setStarting(true);
    try {
      const result = await startMaintenancePlan({ plan_id: item.id });
      if (!result.success) {
        toast.error(result.error ?? "Bakım başlatılamadı");
        return;
      }
      router.push(`/maintenance/${item.id}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setStarting(false);
    }
  }

  return (
    <CompactRow
      urgency={item.urgency}
      actions={
        <>
          <UrgencyChip
            urgency={item.urgency}
            label={shortDateLabel(item.planned_date, item.days_remaining)}
          />
          <CompactAction
            onClick={handleStart}
            loading={starting}
            loadingText="…"
          >
            {isPlanned ? (
              <>
                <Play />
                Başlat
              </>
            ) : (
              <>
                Devam Et
                <ArrowRight />
              </>
            )}
          </CompactAction>
        </>
      }
    >
      <div className="min-w-0">
        <span className="font-mono font-semibold text-slate-900">
          {item.contract_number}
        </span>
        <span className="text-slate-400"> · </span>
        <span className="font-medium text-slate-800">{item.customer_name}</span>
      </div>
      <p className="text-muted-foreground md:hidden">{item.device_count} cihaz</p>
      <span className="hidden md:contents">
        <span className="text-slate-400"> · </span>
        <span className="text-muted-foreground">{item.device_count} cihaz</span>
      </span>
    </CompactRow>
  );
}

function MobileScrollableList({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  const updateCanScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setCanScroll(element.scrollHeight > element.clientHeight + 2);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    updateCanScroll();

    const resizeObserver = new ResizeObserver(updateCanScroll);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateCanScroll);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateCanScroll);
    };
  }, [children, updateCanScroll]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!scrollElement || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setAtBottom(entry.isIntersecting);
      },
      { root: scrollElement, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [children]);

  const showScrollHint = canScroll && !atBottom;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="max-h-64 overflow-x-hidden overflow-y-auto md:max-h-[10.5rem]"
      >
        {children}
        <div ref={sentinelRef} className="h-px shrink-0 md:hidden" aria-hidden />
      </div>

      {showScrollHint ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 md:hidden"
          aria-hidden
        >
          <div
            className="h-12"
            style={{
              background: "linear-gradient(to bottom, transparent, white)",
            }}
          />
          <p className="absolute inset-x-0 bottom-1 text-center text-xs text-muted-foreground">
            ↓ daha fazla
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ListSection({
  title,
  count,
  emptyMessage,
  emptyClassName,
  onboardingTarget,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  emptyClassName?: string;
  onboardingTarget?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className="staff-dash-fade-up overflow-hidden border-slate-200/80 bg-white shadow-sm"
      data-onboarding-target={onboardingTarget}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 overflow-hidden border-b border-slate-100 bg-slate-50/50 px-3 py-2.5 md:px-4">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
          {count} açık
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {count === 0 ? (
          <p
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-3 text-xs",
              emptyClassName ?? "text-muted-foreground",
            )}
          >
            {emptyMessage}
          </p>
        ) : (
          <MobileScrollableList>{children}</MobileScrollableList>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceSection({ data }: { data: StaffDashboardData }) {
  const progressWidth = useAnimatedWidth(
    data.activeTarget?.completion_percentage ?? 0,
  );

  return (
    <Card className="staff-dash-fade-up overflow-hidden border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="space-y-0 overflow-hidden border-b border-slate-100 bg-slate-50/50 px-3 py-2.5 md:px-4">
        <CardTitle className="text-sm font-semibold">🎯 Hedef & Performans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-hidden p-2 md:p-3">
        <dl className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-slate-200 bg-slate-50/50 px-2 py-2 text-center">
            <dt className="text-[10px] text-muted-foreground">Tamamlanan</dt>
            <dd className="text-lg font-bold tabular-nums leading-tight">
              {data.performance.completedThisMonth}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50/50 px-2 py-2 text-center">
            <dt className="text-[10px] text-muted-foreground">Devam Eden</dt>
            <dd className="text-lg font-bold tabular-nums leading-tight">
              {data.performance.inProgressCount}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50/50 px-2 py-2 text-center">
            <dt className="text-[10px] text-muted-foreground">Açık</dt>
            <dd className="text-lg font-bold tabular-nums leading-tight">
              {data.performance.openTotalCount}
            </dd>
          </div>
        </dl>

        {data.activeTarget ? (
          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50/30 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-xs font-medium text-slate-900">
                {data.activeTarget.name}
              </p>
              <Link
                href={`/targets/${data.activeTarget.id}`}
                className="shrink-0 text-[10px] font-medium text-blue-600 hover:underline"
              >
                Detay
              </Link>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>İlerleme</span>
              <span className="font-medium tabular-nums text-slate-700">
                %{data.activeTarget.completion_percentage}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={progressWidth}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {data.activeTarget.days_remaining >= 0
                ? `${data.activeTarget.days_remaining} gün kaldı`
                : `${Math.abs(data.activeTarget.days_remaining)} gün gecikti`}
            </p>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 px-2 py-3 text-center text-xs text-muted-foreground">
            Henüz hedef atanmadı
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function NewServiceRequestFab() {
  return (
    <Link
      href="/service-requests/new"
      data-onboarding="new-request-btn"
      className="fixed bottom-20 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-100 md:hidden"
    >
      <Plus className="size-4" />
      Yeni Talep
    </Link>
  );
}

function StaffDashboardContent({ data }: StaffDashboardProps) {
  return (
    <>
      <style>{`
        @keyframes staff-dash-fade-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes staff-dash-stagger-in {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes staff-dash-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes staff-dash-urgent-pulse {
          0%, 100% { border-color: rgb(252 165 165); box-shadow: 0 0 0 0 rgb(239 68 68 / 0); }
          50% { border-color: rgb(239 68 68); box-shadow: 0 0 0 3px rgb(239 68 68 / 0.08); }
        }
        .staff-dash-fade-down { animation: staff-dash-fade-down 0.3s ease-out both; }
        .staff-dash-stagger-card { animation: staff-dash-stagger-in 0.35s ease-out both; }
        .staff-dash-fade-up { animation: staff-dash-fade-up 0.35s ease-out both; }
        .staff-dash-urgent-pulse { animation: staff-dash-urgent-pulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .staff-dash-fade-down, .staff-dash-stagger-card, .staff-dash-fade-up, .staff-dash-urgent-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="space-y-3 overflow-x-hidden pb-4">
        <StaffDashboardHeader data={data} />

        <section className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
          <SummaryStatCard
            index={0}
            icon={Wrench}
            iconClassName="bg-orange-100 text-orange-600"
            value={data.summary.openServiceRequestsCount}
            label="Servis Talebi"
            urgentCount={data.summary.urgentServiceRequestsCount}
          />
          <SummaryStatCard
            index={1}
            icon={Calendar}
            iconClassName="bg-blue-100 text-blue-600"
            value={data.summary.openMaintenancePlansCount}
            label="Periyodik Bakım"
            urgentCount={data.summary.urgentMaintenancePlansCount}
          />
          <SummaryStatCard
            index={2}
            icon={CheckCircle2}
            iconClassName="bg-emerald-100 text-emerald-600"
            value={data.summary.completedServiceRequestsThisMonth}
            label="Tamamlanan"
            success
          />
        </section>

        <div className="staff-dash-fade-up grid gap-3 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <ListSection
              title="🔧 Servis Talepleri"
              count={data.summary.openServiceRequestsCount}
              emptyMessage="✓ Tüm servisler tamamlandı"
              emptyClassName="font-medium text-emerald-700"
              onboardingTarget="service-requests-section"
            >
              {data.openServiceRequests.map((item) => (
                <ServiceRequestRow key={item.id} item={item} />
              ))}
            </ListSection>

            <ListSection
              title="📅 Periyodik Bakımlar"
              count={data.summary.openMaintenancePlansCount}
              emptyMessage="✓ Planlanmış bakım yok"
              emptyClassName="font-medium text-emerald-700"
              onboardingTarget="maintenance-section"
            >
              {data.openMaintenancePlans.map((item) => (
                <MaintenanceRow key={item.id} item={item} />
              ))}
            </ListSection>
          </div>

          <div className="space-y-3">
            <PerformanceSection data={data} />
          </div>
        </div>
      </div>

      <NewServiceRequestFab />
    </>
  );
}

export function StaffDashboard({ data }: StaffDashboardProps) {
  return (
    <OnboardingProvider>
      <StaffDashboardContent data={data} />
    </OnboardingProvider>
  );
}
