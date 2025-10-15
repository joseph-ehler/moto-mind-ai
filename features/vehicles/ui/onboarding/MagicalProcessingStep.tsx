import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Zap,
  Search,
  CheckCircle,
  Car,
  Database,
  Cpu,
} from "lucide-react";
import clsx from "clsx";
import { type LucideIcon } from "lucide-react";

type Step = {
  icon: LucideIcon;
  text: string;
  subtext?: string;
  duration?: number; // ms
  color?: string;    // tailwind text-*
};

export interface MagicalProcessingStepProps {
  vin: string;
  onComplete: () => void;
  steps?: Step[];
  className?: string;
  /** If false, renders first step only (e.g., for manual control) */
  autoAdvance?: boolean;
  /** Extra delay after final step before firing onComplete */
  completeDelayMs?: number;
}

const DEFAULT_STEPS: Step[] = [
  {
    icon: Search,
    text: "Scanning VIN signature…",
    subtext: "Analyzing 17-character DNA",
    duration: 1400,
    color: "text-blue-500",
  },
  {
    icon: Database,
    text: "Querying global databases…",
    subtext: "Searching millions of records",
    duration: 1200,
    color: "text-purple-500",
  },
  {
    icon: Cpu,
    text: "Decoding vehicle genetics…",
    subtext: "Extracting manufacturer secrets",
    duration: 1500,
    color: "text-green-500",
  },
  {
    icon: Sparkles,
    text: "Assembling vehicle profile…",
    subtext: "Weaving data into insights",
    duration: 1100,
    color: "text-yellow-500",
  },
  {
    icon: CheckCircle,
    text: "Vehicle discovered!",
    subtext: "Your car's story revealed",
    duration: 1400,
    color: "text-green-600",
  },
];

export function MagicalProcessingStep({
  vin,
  onComplete,
  steps = DEFAULT_STEPS,
  className,
  autoAdvance = true,
  completeDelayMs = 800,
}: MagicalProcessingStepProps) {
  const [index, setIndex] = React.useState(0);
  const [isComplete, setIsComplete] = React.useState(false);
  const timers = React.useRef<number[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  const step = steps[Math.min(index, steps.length - 1)];
  const Icon = step?.icon ?? Sparkles;

  // Reset when VIN changes
  React.useEffect(() => {
    cancelTimers(timers);
    setIndex(0);
    setIsComplete(false);
  }, [vin]);

  // Auto advance through steps
  React.useEffect(() => {
    if (!autoAdvance || !step) return;

    // Respect reduced motion: either shorten or skip to done
    const duration = reducedMotion ? 200 : step.duration ?? 1000;

    const t = window.setTimeout(() => {
      if (index >= steps.length - 1) {
        setIsComplete(true);
        const t2 = window.setTimeout(() => onComplete?.(), completeDelayMs);
        timers.current.push(t2);
      } else {
        setIndex((i) => i + 1);
      }
    }, duration);

    timers.current.push(t);
    return () => cancelTimers(timers);
  }, [autoAdvance, step, index, steps.length, onComplete, completeDelayMs, reducedMotion]);

  return (
    <div className={clsx("mx-auto max-w-2xl p-6", className)}>
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CardContent className="relative p-10 text-center">
          {/* Decorative background pings (hidden when reduced motion) */}
          {!reducedMotion && (
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <Ping dotClass="bg-blue-400" style={{ top: "0%", left: "25%" }} delay="0s" />
              <Ping dotClass="bg-purple-400" style={{ top: "25%", right: "25%" }} delay="0.5s" />
              <Ping dotClass="bg-green-400" style={{ bottom: "25%", left: "33%" }} delay="1s" />
              <Ping dotClass="bg-yellow-400" style={{ top: "50%", left: "16%" }} delay="1.5s" />
              <Ping dotClass="bg-pink-400" style={{ bottom: "33%", right: "16%" }} delay="2s" />
            </div>
          )}

          {/* VIN pill */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
              <Car className="h-4 w-4 text-gray-500" aria-hidden />
              <span className="font-mono text-sm tracking-wider text-gray-700" aria-label="VIN">
                {vin}
              </span>
            </div>
          </div>

          {/* Spinner + Icon */}
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" aria-hidden />
            {!reducedMotion && (
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" aria-hidden />
            )}
            <div
              className={clsx(
                "absolute inset-2 flex items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-300",
                isComplete ? "scale-110" : "scale-100"
              )}
            >
              <Icon className={clsx("h-8 w-8 transition-colors duration-300", step?.color ?? "text-blue-500")} />
            </div>

            {/* Success sparkles */}
            {isComplete && !reducedMotion && (
              <>
                <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-yellow-400 animate-bounce" aria-hidden />
                <Sparkles className="absolute -left-2 -bottom-2 h-4 w-4 text-blue-400 animate-bounce" aria-hidden />
                <Sparkles className="absolute -left-3 top-0 h-5 w-5 text-purple-400 animate-bounce" aria-hidden />
              </>
            )}
          </div>

          {/* Live step text (ARIA) */}
          <div className="space-y-2" aria-live="polite" aria-atomic="true">
            <h2
              className={clsx(
                "text-xl font-semibold transition-colors",
                isComplete ? "text-green-600" : "text-gray-900"
              )}
            >
              {step?.text ?? "Processing…"}
            </h2>
            <p className="text-sm text-gray-600">{step?.subtext ?? "Working some magic…"} </p>
          </div>

          {/* Progress dots */}
          <div className="mt-8 flex justify-center gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length - 1} aria-valuenow={index}>
            {steps.map((_, i) => (
              <span
                key={i}
                className={clsx(
                  "h-2 w-2 rounded-full transition-all",
                  i <= index ? (i === index ? "scale-125 bg-blue-500" : "bg-green-500") : "bg-gray-300"
                )}
                aria-hidden
              />
            ))}
          </div>

          {/* Subtle glow on completion */}
          {isComplete && (
            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-green-400/10 via-blue-400/10 to-purple-400/10",
                !reducedMotion && "animate-pulse"
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- helpers ---------- */

function cancelTimers(ref: React.MutableRefObject<number[]>) {
  ref.current.forEach((id) => window.clearTimeout(id));
  ref.current = [];
}

function Ping({
  dotClass,
  delay,
  style,
}: {
  dotClass: string;
  delay?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={clsx("absolute h-2 w-2 rounded-full opacity-30", dotClass, "animate-ping")}
      style={{ animationDelay: delay, ...style }}
    />
  );
}

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefers(!!m?.matches);
    handler();
    m?.addEventListener?.("change", handler);
    return () => m?.removeEventListener?.("change", handler);
  }, []);
  return prefers;
}
