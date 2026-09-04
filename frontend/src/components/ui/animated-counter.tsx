"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

type CounterRange = readonly [number, number];

export type AnimatedCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  locale?: string;
  duration?: number;
  liveTicker?: boolean;
  liveStepRange?: CounterRange;
  liveIntervalRange?: CounterRange;
  respectReducedMotion?: boolean;
  className?: string;
  ariaLabel?: string;
};

const DEFAULT_LIVE_STEP_RANGE: CounterRange = [2, 5];
const DEFAULT_LIVE_INTERVAL_RANGE: CounterRange = [1500, 3000];

function easeOutExpo(progress: number) {
  return progress >= 1 ? 1 : 1 - 2 ** (-10 * progress);
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

/**
 * 0-3s: reach 98.5% of the target with a readable acceleration curve.
 * 3-4s: cover the final 1.5% slowly so the eye can register the landing value.
 */
function stagedCountProgress(progress: number) {
  const firstStageEnd = 0.75;
  const nearTarget = 0.985;

  if (progress <= firstStageEnd) {
    return nearTarget * easeOutCubic(progress / firstStageEnd);
  }

  const finalStageProgress = (progress - firstStageEnd) / (1 - firstStageEnd);
  return nearTarget + (1 - nearTarget) * easeOutCubic(finalStageProgress);
}

function roundForDisplay(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function randomInRange([first, second]: CounterRange) {
  const minimum = Math.min(first, second);
  const maximum = Math.max(first, second);
  return Math.round(minimum + Math.random() * (maximum - minimum));
}

/**
 * A small, self-contained counter that starts only once it reaches the viewport.
 * The animation uses requestAnimationFrame so a live metric stays inexpensive even
 * when several counters are visible at the same time.
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale = "en-US",
  duration = 4000,
  liveTicker = false,
  liveStepRange = DEFAULT_LIVE_STEP_RANGE,
  liveIntervalRange = DEFAULT_LIVE_INTERVAL_RANGE,
  respectReducedMotion = true,
  className,
  ariaLabel,
}: AnimatedCounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(counterRef, { amount: 0.2, margin: "0px 0px -10% 0px", once: true });
  const frameRef = useRef<number | undefined>(undefined);
  const timerRef = useRef<number | undefined>(undefined);
  const displayedValueRef = useRef(0);
  const [displayedValue, setDisplayedValue] = useState(0);
  const [completedTarget, setCompletedTarget] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(null);

  const safeDecimals = Math.max(0, Math.min(6, Math.trunc(decimals)));
  const targetValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const shouldReduceMotion = respectReducedMotion ? prefersReducedMotion : false;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPrefersReducedMotion(motionQuery.matches);

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);
    return () => motionQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (!isInView || shouldReduceMotion === null) return;

    let cancelled = false;
    const commitValue = (nextValue: number) => {
      const roundedValue = roundForDisplay(nextValue, safeDecimals);
      if (displayedValueRef.current === roundedValue) return;

      displayedValueRef.current = roundedValue;
      setDisplayedValue(roundedValue);
    };

    const cancelPendingWork = () => {
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }

      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };

    const animateTo = (from: number, to: number, animationDuration: number, onComplete?: () => void) => {
      const startedAt = window.performance.now();
      let lastCommittedAt = startedAt - 34;

      const renderFrame = (timestamp: number) => {
        if (cancelled) return;

        const progress = Math.min((timestamp - startedAt) / animationDuration, 1);
        if (timestamp - lastCommittedAt >= 34 || progress >= 1) {
          commitValue(from + (to - from) * stagedCountProgress(progress));
          lastCommittedAt = timestamp;
        }

        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(renderFrame);
          return;
        }

        frameRef.current = undefined;
        onComplete?.();
      };

      frameRef.current = window.requestAnimationFrame(renderFrame);
    };

    cancelPendingWork();
    displayedValueRef.current = 0;

    if (shouldReduceMotion || duration <= 0) {
      frameRef.current = window.requestAnimationFrame(() => {
        commitValue(targetValue);
        setCompletedTarget(targetValue);
      });
      return () => {
        cancelled = true;
        cancelPendingWork();
      };
    }

    animateTo(0, targetValue, duration, () => setCompletedTarget(targetValue));

    return () => {
      cancelled = true;
      cancelPendingWork();
    };
  }, [duration, isInView, safeDecimals, shouldReduceMotion, targetValue]);

  useEffect(() => {
    if (
      !isInView ||
      !liveTicker ||
      shouldReduceMotion !== false ||
      completedTarget !== targetValue
    ) {
      return;
    }

    let cancelled = false;
    let liveFrame: number | undefined;

    const clearLiveWork = () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }

      if (liveFrame !== undefined) {
        window.cancelAnimationFrame(liveFrame);
        liveFrame = undefined;
      }
    };

    const commitValue = (nextValue: number) => {
      const roundedValue = roundForDisplay(nextValue, safeDecimals);
      if (displayedValueRef.current === roundedValue) return;

      displayedValueRef.current = roundedValue;
      setDisplayedValue(roundedValue);
    };

    const scheduleNextTick = () => {
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;

        const from = displayedValueRef.current;
        const to = from + randomInRange(liveStepRange);
        const startedAt = window.performance.now();

        const renderFrame = (timestamp: number) => {
          if (cancelled) return;

          const progress = Math.min((timestamp - startedAt) / 680, 1);
          commitValue(from + (to - from) * easeOutExpo(progress));

          if (progress < 1) {
            liveFrame = window.requestAnimationFrame(renderFrame);
            return;
          }

          liveFrame = undefined;
          scheduleNextTick();
        };

        liveFrame = window.requestAnimationFrame(renderFrame);
      }, randomInRange(liveIntervalRange));
    };

    scheduleNextTick();

    return () => {
      cancelled = true;
      clearLiveWork();
    };
  }, [completedTarget, isInView, liveIntervalRange, liveStepRange, liveTicker, safeDecimals, shouldReduceMotion, targetValue]);

  const formattedValue = new Intl.NumberFormat(locale, {
    maximumFractionDigits: safeDecimals,
    minimumFractionDigits: safeDecimals,
  }).format(displayedValue);

  return (
    <span
      ref={counterRef}
      aria-label={ariaLabel ?? `${prefix}${formattedValue}${suffix}`}
      className={className}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
