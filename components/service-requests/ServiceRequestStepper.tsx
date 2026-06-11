"use client";

import { Check } from "lucide-react";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

import type { ServiceRequestDetail as ServiceRequestDetailData } from "@/lib/api/service-requests/types";
import {
  SERVICE_REQUEST_STEP_LABELS,
  SERVICE_REQUEST_STEPS,
  type ServiceRequestStep,
} from "@/lib/constants/service-request";
import { cn } from "@/lib/utils";
import truckAnimation from "@/public/animations/service-truck.json";

type StepVisualState = "completed" | "active" | "upcoming" | "locked";

const STEP_COUNT = SERVICE_REQUEST_STEPS.length;
const VAN_TRAVEL_TRANSITION = "left 0.8s ease";
const ROAD_PROGRESS_TRANSITION = "width 0.8s ease";

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
  const leftPercent = hasEntered ? stepToPercent(vanStep) : 0;

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
          className="relative mx-auto mt-4 w-full overflow-visible"
          style={{ position: "relative", height: "60px", width: "100%" }}
        >
          <div
            className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-muted"
            aria-hidden
          />
          <div
            className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-emerald-700 dark:bg-emerald-500"
            style={{
              width: `${leftPercent}%`,
              transition: prefersReducedMotion ? undefined : ROAD_PROGRESS_TRANSITION,
            }}
            aria-hidden
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: `${leftPercent}%`,
              top: "50%",
              transform: "translateX(-50%) translateY(-50%)",
              zIndex: 10,
              transition: prefersReducedMotion ? undefined : VAN_TRAVEL_TRANSITION,
            }}
          >
            <Lottie
              animationData={truckAnimation}
              loop
              autoplay
              style={{ width: 60, height: 60 }}
            />
          </div>
        </div>

        <p className="sr-only">
          Servis aracı şu anda {SERVICE_REQUEST_STEP_LABELS[vanStep]} adımında
        </p>
      </div>
    </nav>
  );
}
