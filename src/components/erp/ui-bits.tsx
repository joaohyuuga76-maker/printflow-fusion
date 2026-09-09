import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "info",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "profit" | "info" | "production" | "danger" | "warn";
}) {
  const tones = {
    profit: "text-profit bg-profit/10 border-profit/25",
    info: "text-info bg-info/10 border-info/25",
    production: "text-production bg-production/10 border-production/25",
    danger: "text-danger bg-danger/10 border-danger/25",
    warn: "text-warn bg-warn/10 border-warn/25",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span
          className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", tones[tone])}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={cn("mt-3 text-2xl font-bold tracking-tight", tones[tone].split(" ")[0])}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
