"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import type { ServiceRequestDetail as ServiceRequestDetailData } from "@/lib/api/service-requests/types";
import {
  SERVICE_REQUEST_STEP_LABELS,
  SERVICE_REQUEST_STEPS,
  type ServiceRequestStep,
} from "@/lib/constants/service-request";
import { cn } from "@/lib/utils";

type StepVisualState = "completed" | "active" | "upcoming" | "locked";

const STEP_COUNT = SERVICE_REQUEST_STEPS.length;
const VAN_SIZE_PX = 80;
/** Lottie alt kenarı yol hizası (h-16 yol konteyneri, %50 çizgi) */
const VAN_ROAD_ALIGN_Y = 72;

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

function getStepState(
  step: ServiceRequestStep,
  detail: ServiceRequestDetailData,
): StepVisualState {
  if (detail.status === "tamamlandi") {
    return "completed";
  }

  if (detail.status === "rejected") {
    if (step < 3) return "completed";
    if (step === 3) return "active";
    return "locked";
  }

  if (step < detail.current_step) {
    return "completed";
  }

  if (step === detail.current_step) {
    return "active";
  }

  return "upcoming";
}

function getVanStep(detail: ServiceRequestDetailData): ServiceRequestStep {
  if (detail.status === "tamamlandi") {
    return 5;
  }

  if (detail.status === "rejected") {
    return 3;
  }

  return detail.current_step;
}

function stepToPercent(step: ServiceRequestStep): number {
  return ((step - 1) / (STEP_COUNT - 1)) * 100;
}

type ServiceRequestStepperProps = {
  detail: ServiceRequestDetailData;
};

export function ServiceRequestStepper({ detail }: ServiceRequestStepperProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hasEntered, setHasEntered] = useState(prefersReducedMotion);

  const vanStep = getVanStep(detail);
  const targetPercent = stepToPercent(vanStep);
  const displayPercent = hasEntered ? targetPercent : 0;

  useEffect(() => {
    if (prefersReducedMotion) {
      setHasEntered(true);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setHasEntered(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  const roadStyle = {
    "--sr-van-pos": `${displayPercent}`,
  } as React.CSSProperties;

  const motionClass = prefersReducedMotion ? "" : "sr-stepper-motion";

  return (
    <nav
      aria-label="Servis talebi adımları"
      className="-mx-1 px-1 pb-1 sm:mx-0 sm:px-0"
    >
      <div className="relative w-full">
        <ol className="flex w-full items-stretch gap-1 sm:gap-2">
          {SERVICE_REQUEST_STEPS.map((step) => {
            const state = getStepState(step, detail);

            return (
              <li key={step} className="flex min-w-0 flex-1">
                <div
                  className={cn(
                    "flex h-full w-full min-w-0 flex-col items-center gap-1 rounded-lg border p-1 text-center transition-colors sm:gap-2 sm:p-3",
                    state === "completed" &&
                      "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
                    state === "active" &&
                      "border-primary bg-primary/5 ring-2 ring-primary/20",
                    (state === "upcoming" || state === "locked") &&
                      "border-border bg-muted/30 text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm",
                      state === "completed" &&
                        "bg-emerald-600 text-white dark:bg-emerald-500",
                      state === "active" && "bg-primary text-primary-foreground",
                      (state === "upcoming" || state === "locked") &&
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {state === "completed" ? (
                      <Check className="size-3 sm:size-4" aria-hidden />
                    ) : (
                      step
                    )}
                  </span>
                  <span
                    className={cn(
                      "w-full break-words text-[10px] font-medium leading-tight sm:text-sm",
                      state === "active" && "text-foreground",
                    )}
                  >
                    {SERVICE_REQUEST_STEP_LABELS[step]}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          className="sr-stepper-road relative mx-auto mt-4 h-16 max-w-full overflow-visible"
          style={roadStyle}
        >
          <div
            className="sr-stepper-road-track absolute top-1/2 right-5 left-5 h-1 -translate-y-1/2 rounded-full bg-muted"
            aria-hidden
          />
          <div
            className={cn(
              "sr-stepper-road-progress absolute top-1/2 left-5 h-1.5 -translate-y-1/2 rounded-full bg-emerald-700 dark:bg-emerald-500",
              motionClass,
            )}
            aria-hidden
          />

          <div
            className={cn(
              "sr-stepper-van absolute z-10 -translate-x-1/2",
              motionClass,
            )}
            style={{ top: `calc(50% - ${VAN_ROAD_ALIGN_Y}px)` }}
            aria-hidden
          >
            <div className="relative">
              <div className="sr-stepper-van-shadow" />
              <span
                className="flex items-center justify-center text-5xl leading-none"
                style={{ width: VAN_SIZE_PX, height: VAN_SIZE_PX }}
              >
                🚐
              </span>
            </div>
          </div>
        </div>

        <p className="sr-only">
          Servis aracı şu anda {SERVICE_REQUEST_STEP_LABELS[vanStep]} adımında
        </p>
      </div>
    </nav>
  );
}
