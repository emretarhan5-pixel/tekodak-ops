"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import type {
  OnboardingStep,
  OnboardingTooltipPosition,
} from "@/components/onboarding/onboarding-steps";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipPlacement = {
  mode: "desktop" | "mobile" | "center";
  top?: number;
  left?: number;
};

type OnboardingTourProps = {
  steps: OnboardingStep[];
  active: boolean;
  stepIndex: number;
  completeButtonLabel?: string;
  showConfettiOnComplete?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
};

const HIGHLIGHT_PADDING = 8;
const TOOLTIP_GAP = 14;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 180;
const VIEWPORT_MARGIN = 16;
const MOBILE_BREAKPOINT = 768;
const MOBILE_TOOLTIP_BOTTOM = 80;
const SCROLL_SETTLE_MS = 300;
const STEP_TRANSITION_MS = 150;

type StepDirection = "forward" | "backward";
type StepTransitionPhase = "idle" | "out" | "in";

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

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

function isOnboardingTargetVisible(element: HTMLElement): boolean {
  if (!element.isConnected) return false;

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getTargetElement(targetId: string): HTMLElement | null {
  const selectors = [
    `[data-onboarding="${targetId}"]`,
    `[data-onboarding-target="${targetId}"]`,
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    for (const element of elements) {
      if (isOnboardingTargetVisible(element)) {
        return element;
      }
    }
  }

  return null;
}

function scrollTargetIntoView(
  element: HTMLElement,
  behavior: ScrollBehavior,
): void {
  element.scrollIntoView({ behavior, block: "center", inline: "nearest" });

  const main = document.querySelector("main");
  if (!main) return;

  const mainStyle = window.getComputedStyle(main);
  if (mainStyle.overflowY !== "auto" && mainStyle.overflowY !== "scroll") {
    return;
  }

  const mainRect = main.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetTop =
    main.scrollTop +
    (elementRect.top - mainRect.top) -
    mainRect.height / 2 +
    elementRect.height / 2;

  main.scrollTo({
    top: Math.max(0, targetTop),
    behavior,
  });
}

function measureHighlightRect(targetId: string): TargetRect | null {
  const element = getTargetElement(targetId);
  if (!element) return null;

  const rect = element.getBoundingClientRect();

  return {
    top: rect.top - HIGHLIGHT_PADDING,
    left: rect.left - HIGHLIGHT_PADDING,
    width: rect.width + HIGHLIGHT_PADDING * 2,
    height: rect.height + HIGHLIGHT_PADDING * 2,
  };
}

function getElementRect(targetId: string): DOMRect | null {
  const element = getTargetElement(targetId);
  return element ? element.getBoundingClientRect() : null;
}

function getAvailableSpace(rect: DOMRect) {
  return {
    hasSpaceRight:
      rect.right + TOOLTIP_WIDTH + VIEWPORT_MARGIN < window.innerWidth,
    hasSpaceLeft: rect.left - TOOLTIP_WIDTH - VIEWPORT_MARGIN > 0,
    hasSpaceBelow:
      rect.bottom + TOOLTIP_HEIGHT + VIEWPORT_MARGIN < window.innerHeight,
    hasSpaceAbove: rect.top - TOOLTIP_HEIGHT - VIEWPORT_MARGIN > 0,
  };
}

function positionFits(
  position: OnboardingTooltipPosition,
  space: ReturnType<typeof getAvailableSpace>,
): boolean {
  switch (position) {
    case "right":
      return space.hasSpaceRight;
    case "left":
      return space.hasSpaceLeft;
    case "bottom":
      return space.hasSpaceBelow;
    case "top":
      return space.hasSpaceAbove;
  }
}

function buildPositionCandidates(
  rect: DOMRect,
  preferred?: OnboardingTooltipPosition,
): OnboardingTooltipPosition[] {
  const isRightSide = rect.left + rect.width / 2 > window.innerWidth * 0.55;
  const isTopSide = rect.top < window.innerHeight * 0.25;

  const fallbacks: OnboardingTooltipPosition[] = isRightSide
    ? ["left", "bottom", "top", "right"]
    : isTopSide
      ? ["bottom", "right", "left", "top"]
      : ["bottom", "right", "left", "top"];

  const ordered: OnboardingTooltipPosition[] = [];
  if (preferred) ordered.push(preferred);

  for (const position of fallbacks) {
    if (!ordered.includes(position)) {
      ordered.push(position);
    }
  }

  return ordered;
}

function pickBestPosition(
  rect: DOMRect,
  preferred?: OnboardingTooltipPosition,
): OnboardingTooltipPosition {
  const space = getAvailableSpace(rect);
  const candidates = buildPositionCandidates(rect, preferred);

  for (const position of candidates) {
    if (positionFits(position, space)) {
      return position;
    }
  }

  return candidates[0] ?? "bottom";
}

function clampTooltipPosition(
  top: number,
  left: number,
): { top: number; left: number } {
  const maxLeft = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - TOOLTIP_HEIGHT - VIEWPORT_MARGIN;

  return {
    top: Math.max(VIEWPORT_MARGIN, Math.min(top, maxTop)),
    left: Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft)),
  };
}

function computeDesktopPlacement(
  rect: DOMRect,
  preferred?: OnboardingTooltipPosition,
): TooltipPlacement {
  const position = pickBestPosition(rect, preferred);

  let top = 0;
  let left = 0;

  switch (position) {
    case "bottom":
      top = rect.bottom + TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case "top":
      top = rect.top - TOOLTIP_GAP - TOOLTIP_HEIGHT;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2;
      left = rect.left - TOOLTIP_GAP - TOOLTIP_WIDTH;
      break;
    case "right":
      top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2;
      left = rect.right + TOOLTIP_GAP;
      break;
  }

  const clamped = clampTooltipPosition(top, left);

  return {
    mode: "desktop",
    top: clamped.top,
    left: clamped.left,
  };
}

function computeTooltipPlacement(
  step: OnboardingStep,
): TooltipPlacement | null {
  const mobile = isMobileViewport();

  if (step.variant === "center") {
    return { mode: mobile ? "mobile" : "center" };
  }

  if (!step.target) return null;

  if (mobile) {
    return { mode: "mobile" };
  }

  const rect = getElementRect(step.target);
  if (!rect) return null;

  return computeDesktopPlacement(rect, step.position);
}

function OnboardingConfetti() {
  const colors = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ef4444"];
  const particles = Array.from({ length: 28 }, (_, index) => ({
    id: index,
    left: `${8 + Math.random() * 84}%`,
    delay: `${Math.random() * 0.35}s`,
    duration: `${0.9 + Math.random() * 0.8}s`,
    color: colors[index % colors.length],
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="onboarding-confetti pointer-events-none fixed inset-0 z-[120] overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="onboarding-confetti-particle absolute bottom-1/3 rounded-full"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

type CompletionOverlayProps = {
  showConfetti: boolean;
  onDone: () => void;
};

function CompletionOverlay({ showConfetti, onDone }: CompletionOverlayProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, showConfetti ? 2400 : 1200);
    return () => window.clearTimeout(timer);
  }, [onDone, showConfetti]);

  return createPortal(
    <>
      {showConfetti ? <OnboardingConfetti /> : null}
      <div className="onboarding-overlay-enter fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
        <div className="onboarding-tooltip-enter max-w-sm rounded-xl border border-border bg-background p-6 text-center shadow-xl">
          <p className="text-3xl">🎉</p>
          <p className="mt-3 text-lg font-semibold">Harika!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Artık sistemi kullanmaya hazırsın.
          </p>
        </div>
      </div>
    </>,
    document.body,
  );
}

type TourTooltipProps = {
  stepIndex: number;
  totalSteps: number;
  title: string;
  description: string;
  isLastStep: boolean;
  placement: TooltipPlacement;
  completeButtonLabel: string;
  transitionPhase: StepTransitionPhase;
  direction: StepDirection;
  enterReady: boolean;
  isInitialOpen: boolean;
  isNavigating: boolean;
  isMobile: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
};

function getTooltipTransitionClass(
  phase: StepTransitionPhase,
  direction: StepDirection,
  enterReady: boolean,
  isInitialOpen: boolean,
  isMobile: boolean,
): string {
  if (isInitialOpen) {
    return isMobile
      ? "onboarding-tooltip-mobile-initial-enter"
      : "onboarding-tooltip-initial-enter";
  }

  if (phase === "out") {
    if (isMobile) {
      return "onboarding-tooltip-mobile-exit";
    }
    return direction === "forward"
      ? "onboarding-tooltip-exit-forward"
      : "onboarding-tooltip-exit-backward";
  }

  if (phase === "in") {
    if (isMobile) {
      return enterReady
        ? "onboarding-tooltip-mobile-enter-to"
        : "onboarding-tooltip-mobile-enter-from";
    }
    if (!enterReady) {
      return direction === "forward"
        ? "onboarding-tooltip-enter-from-forward"
        : "onboarding-tooltip-enter-from-backward";
    }
    return "onboarding-tooltip-enter-to";
  }

  return isMobile
    ? "onboarding-tooltip-mobile-enter-to"
    : "onboarding-tooltip-enter-to";
}

function TourTooltip({
  stepIndex,
  totalSteps,
  title,
  description,
  isLastStep,
  placement,
  completeButtonLabel,
  transitionPhase,
  direction,
  enterReady,
  isInitialOpen,
  isNavigating,
  isMobile,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TourTooltipProps) {
  const panelClassName = getTooltipTransitionClass(
    transitionPhase,
    direction,
    enterReady,
    isInitialOpen,
    isMobile,
  );

  const desktopContent = (
    <>
      <p className="text-xs font-medium text-muted-foreground">
        {stepIndex + 1}/{totalSteps}
      </p>
      <h3 id="onboarding-step-title" className="mt-1 text-base font-semibold">
        {title}
      </h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onSkip}
        >
          Atla
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={stepIndex === 0 || isNavigating}
            onClick={onPrev}
          >
            Geri
          </Button>
          {isLastStep ? (
            <Button
              type="button"
              size="sm"
              disabled={isNavigating}
              onClick={onComplete}
            >
              {completeButtonLabel}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isNavigating}
              onClick={onNext}
            >
              İleri
            </Button>
          )}
        </div>
      </div>
    </>
  );

  const mobileContent = (
    <>
      <p className="text-center text-xs font-medium text-muted-foreground">
        {stepIndex + 1}/{totalSteps}
      </p>
      <h3
        id="onboarding-step-title"
        className="mt-2 text-base font-semibold leading-snug"
      >
        {title}
      </h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1 text-sm"
          disabled={stepIndex === 0 || isNavigating}
          onClick={onPrev}
        >
          Geri
        </Button>
        {isLastStep ? (
          <Button
            type="button"
            className="min-h-11 flex-1 text-sm"
            disabled={isNavigating}
            onClick={onComplete}
          >
            {completeButtonLabel}
          </Button>
        ) : (
          <Button
            type="button"
            className="min-h-11 flex-1 text-sm"
            disabled={isNavigating}
            onClick={onNext}
          >
            İleri
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="mt-1 min-h-10 w-full text-sm text-muted-foreground"
        onClick={onSkip}
      >
        Atla
      </Button>
    </>
  );

  const panel = (
    <div
      className={`onboarding-tooltip-panel w-full rounded-xl border border-border bg-background p-4 shadow-xl ${panelClassName}`}
      role="dialog"
      aria-labelledby="onboarding-step-title"
    >
      {placement.mode === "mobile" ? mobileContent : desktopContent}
    </div>
  );

  if (placement.mode === "mobile") {
    return (
      <div
        className="onboarding-tooltip-mobile fixed z-[101]"
        style={{
          bottom: MOBILE_TOOLTIP_BOTTOM,
          left: VIEWPORT_MARGIN,
          right: VIEWPORT_MARGIN,
        }}
      >
        {panel}
      </div>
    );
  }

  if (placement.mode === "center") {
    return (
      <div className="absolute inset-0 z-[101] flex items-center justify-center p-4">
        <div className="w-full max-w-xs">{panel}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-[101] max-w-xs"
      style={{
        top: placement.top,
        left: placement.left,
        width: TOOLTIP_WIDTH,
      }}
    >
      {panel}
    </div>
  );
}

export function OnboardingTour({
  steps,
  active,
  stepIndex,
  completeButtonLabel = "Tamamla 🎉",
  showConfettiOnComplete = true,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingTourProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPlacement, setTooltipPlacement] =
    useState<TooltipPlacement | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [transitionPhase, setTransitionPhase] =
    useState<StepTransitionPhase>("idle");
  const [direction, setDirection] = useState<StepDirection>("forward");
  const [enterReady, setEnterReady] = useState(true);
  const [isInitialOpen, setIsInitialOpen] = useState(false);
  const [highlightVisible, setHighlightVisible] = useState(true);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isCenterStep = step?.variant === "center";
  const isNavigating = transitionPhase !== "idle";

  const applyLayout = useCallback((currentStep: OnboardingStep) => {
    if (currentStep.variant === "center") {
      setTargetRect(null);
      setTooltipPlacement(computeTooltipPlacement(currentStep));
      setLayoutReady(true);
      return;
    }

    if (!currentStep.target) {
      setTargetRect(null);
      setTooltipPlacement(null);
      setLayoutReady(true);
      return;
    }

    setTargetRect(measureHighlightRect(currentStep.target));
    setTooltipPlacement(computeTooltipPlacement(currentStep));
    setLayoutReady(true);
  }, []);

  const updateLayout = useCallback(() => {
    if (!step) {
      setTargetRect(null);
      setTooltipPlacement(null);
      setLayoutReady(false);
      return;
    }

    setLayoutReady(false);

    if (step.variant === "center") {
      applyLayout(step);
      return;
    }

    if (step.target) {
      const element = getTargetElement(step.target);
      if (element) {
        scrollTargetIntoView(
          element,
          prefersReducedMotion ? "auto" : "smooth",
        );
      }
    }

    window.setTimeout(() => {
      applyLayout(step);
    }, SCROLL_SETTLE_MS);
  }, [applyLayout, prefersReducedMotion, step]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) {
      setIsInitialOpen(false);
      setTransitionPhase("idle");
      setEnterReady(true);
      setHighlightVisible(true);
      return;
    }

    setIsInitialOpen(true);
    const timer = window.setTimeout(() => setIsInitialOpen(false), 220);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (transitionPhase !== "in") return;

    setEnterReady(false);
    const frame = requestAnimationFrame(() => {
      setEnterReady(true);
    });

    const timer = window.setTimeout(() => {
      setTransitionPhase("idle");
    }, STEP_TRANSITION_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [transitionPhase, stepIndex]);

  useEffect(() => {
    if (!active || !step) {
      setTargetRect(null);
      setTooltipPlacement(null);
      setLayoutReady(false);
      return;
    }

    updateLayout();

    const handleLayoutChange = () => {
      if (!step.target || step.variant === "center") {
        applyLayout(step);
        return;
      }

      setTargetRect(measureHighlightRect(step.target));
      setTooltipPlacement(computeTooltipPlacement(step));
    };

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [active, applyLayout, isMobile, step, stepIndex, updateLayout]);

  const navigateStep = useCallback(
    (nextDirection: StepDirection, action: () => void) => {
      if (prefersReducedMotion || transitionPhase !== "idle") {
        action();
        return;
      }

      setDirection(nextDirection);
      setTransitionPhase("out");
      setHighlightVisible(false);

      window.setTimeout(() => {
        action();
        setTransitionPhase("in");
        setHighlightVisible(true);
      }, STEP_TRANSITION_MS);
    },
    [prefersReducedMotion, transitionPhase],
  );

  const handleNext = useCallback(() => {
    if (isLastStep) return;
    navigateStep("forward", onNext);
  }, [isLastStep, navigateStep, onNext]);

  const handlePrev = useCallback(() => {
    if (stepIndex === 0) return;
    navigateStep("backward", onPrev);
  }, [navigateStep, onPrev, stepIndex]);

  useEffect(() => {
    if (!active) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  function handleComplete() {
    if (showConfettiOnComplete) {
      setShowCompletion(true);
      return;
    }
    onComplete();
  }

  function handleCompletionDone() {
    setShowCompletion(false);
    onComplete();
  }

  if (!mounted || !active || !step) {
    return showCompletion ? (
      <CompletionOverlay
        showConfetti={showConfettiOnComplete}
        onDone={handleCompletionDone}
      />
    ) : null;
  }

  const canRenderTooltip = Boolean(tooltipPlacement) && layoutReady;
  const canRenderHighlight = Boolean(targetRect) && !isCenterStep;
  const useMobileOverlay = isMobile && !isCenterStep;

  return (
    <>
      {showCompletion ? (
        <CompletionOverlay
          showConfetti={showConfettiOnComplete}
          onDone={handleCompletionDone}
        />
      ) : null}

      {createPortal(
        <div className="onboarding-tour-root fixed inset-0 z-[100]">
          <div
            className="onboarding-overlay-enter absolute inset-0 bg-black/60"
            aria-hidden
          />

          {canRenderTooltip ? (
            <>
              {canRenderHighlight && targetRect ? (
                <div
                  className={`onboarding-highlight-panel pointer-events-none absolute z-[1] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background ${
                    highlightVisible
                      ? "onboarding-highlight-visible"
                      : "onboarding-highlight-hidden"
                  } ${isInitialOpen ? "onboarding-highlight-initial-enter" : ""}`}
                  style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    ...(useMobileOverlay
                      ? { backgroundColor: "rgba(255, 255, 255, 0.04)" }
                      : {
                          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                        }),
                  }}
                />
              ) : null}

              <TourTooltip
                stepIndex={stepIndex}
                totalSteps={steps.length}
                title={step.title}
                description={step.description}
                isLastStep={isLastStep}
                placement={tooltipPlacement!}
                completeButtonLabel={completeButtonLabel}
                transitionPhase={transitionPhase}
                direction={direction}
                enterReady={enterReady}
                isInitialOpen={isInitialOpen}
                isNavigating={isNavigating}
                isMobile={isMobile}
                onNext={handleNext}
                onPrev={handlePrev}
                onSkip={onSkip}
                onComplete={handleComplete}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground shadow-xl">
                Tur öğesi yükleniyor…
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}

      <style>{`
        @keyframes onboarding-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes onboarding-tooltip-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes onboarding-tooltip-mobile-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onboarding-highlight-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .onboarding-tooltip-panel {
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .onboarding-tooltip-initial-enter {
          animation: onboarding-tooltip-in 0.2s ease-out both;
        }
        .onboarding-tooltip-exit-forward {
          opacity: 0;
          transform: translateX(-8px);
        }
        .onboarding-tooltip-exit-backward {
          opacity: 0;
          transform: translateX(8px);
        }
        .onboarding-tooltip-enter-from-forward {
          opacity: 0;
          transform: translateX(8px);
        }
        .onboarding-tooltip-enter-from-backward {
          opacity: 0;
          transform: translateX(-8px);
        }
        .onboarding-tooltip-enter-to {
          opacity: 1;
          transform: translateX(0);
        }
        .onboarding-tooltip-mobile-initial-enter {
          animation: onboarding-tooltip-mobile-in 0.22s ease-out both;
        }
        .onboarding-tooltip-mobile-exit {
          opacity: 0;
          transform: translateY(10px);
        }
        .onboarding-tooltip-mobile-enter-from {
          opacity: 0;
          transform: translateY(10px);
        }
        .onboarding-tooltip-mobile-enter-to {
          opacity: 1;
          transform: translateY(0);
        }
        .onboarding-highlight-panel {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .onboarding-highlight-visible {
          opacity: 1;
          transform: scale(1);
        }
        .onboarding-highlight-hidden {
          opacity: 0;
          transform: scale(0.98);
        }
        .onboarding-highlight-initial-enter {
          animation: onboarding-highlight-in 0.2s ease-out both;
        }
        @keyframes onboarding-confetti-rise {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-140px) rotate(180deg); opacity: 0; }
        }
        .onboarding-overlay-enter { animation: onboarding-fade-in 0.2s ease-out both; }
        .onboarding-tooltip-enter { animation: onboarding-tooltip-in 0.2s ease-out both; }
        .onboarding-highlight-enter { animation: onboarding-highlight-in 0.2s ease-out both; }
        .onboarding-modal-enter { animation: onboarding-tooltip-in 0.2s ease-out both; }
        .onboarding-confetti-particle {
          animation-name: onboarding-confetti-rise;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .onboarding-overlay-enter,
          .onboarding-tooltip-enter,
          .onboarding-highlight-enter,
          .onboarding-modal-enter,
          .onboarding-confetti-particle,
          .onboarding-tooltip-initial-enter,
          .onboarding-tooltip-mobile-initial-enter,
          .onboarding-highlight-initial-enter {
            animation: none !important;
          }
          .onboarding-tooltip-panel,
          .onboarding-highlight-panel {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
