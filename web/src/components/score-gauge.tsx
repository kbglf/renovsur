import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "lg";
}

export function ScoreGauge({ score, label, size = "lg" }: ScoreGaugeProps) {
  const color =
    score >= 80
      ? "text-emerald-600"
      : score >= 60
        ? "text-amber-500"
        : score >= 40
          ? "text-orange-500"
          : "text-red-600";

  const ringColor =
    score >= 80
      ? "stroke-emerald-500"
      : score >= 60
        ? "stroke-amber-400"
        : score >= 40
          ? "stroke-orange-400"
          : "stroke-red-500";

  const dim = size === "lg" ? 160 : 100;
  const stroke = size === "lg" ? 12 : 8;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-slate-100"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={cn("transition-all duration-700", ringColor)}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums", color, size === "lg" ? "text-4xl" : "text-2xl")}>
            {score}
          </span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>
      <span className={cn("text-center font-semibold", color, size === "lg" ? "text-lg" : "text-sm")}>
        {label}
      </span>
    </div>
  );
}
