import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PeriodKey = "todos" | "hoje" | "7d" | "mes" | "custom";

export interface FiltersState {
  q: string;
  period: PeriodKey;
  from: string;
  to: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function rangeOf(f: FiltersState): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (f.period) {
    case "hoje":
      return { from: startOfDay(now), to: null };
    case "7d": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 6);
      return { from, to: null };
    }
    case "mes":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case "custom":
      return {
        from: f.from ? new Date(`${f.from}T00:00:00`) : null,
        to: f.to ? new Date(`${f.to}T23:59:59`) : null,
      };
    default:
      return { from: null, to: null };
  }
}

/** Aceita "YYYY-MM-DD", ISO completo ou "dd/mm" (ano corrente). */
export function parseAnyDate(value?: string | null): Date | null {
  if (!value) return null;
  const br = /^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/.exec(value.trim());
  if (br) {
    const year = br[3] ? Number(br[3]) : new Date().getFullYear();
    return new Date(year, Number(br[2]) - 1, Number(br[1]));
  }
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useFilters() {
  const [filters, setFilters] = useState<FiltersState>({
    q: "",
    period: "todos",
    from: "",
    to: "",
  });

  const range = useMemo(() => rangeOf(filters), [filters]);

  const matches = useMemo(() => {
    const term = filters.q.trim().toLowerCase();
    return (...parts: (string | number | null | undefined)[]) => {
      if (!term) return true;
      return parts.some((p) => String(p ?? "").toLowerCase().includes(term));
    };
  }, [filters.q]);

  const inPeriod = useMemo(() => {
    return (value?: string | null) => {
      if (!range.from && !range.to) return true;
      const d = parseAnyDate(value);
      if (!d) return false;
      if (range.from && d < range.from) return false;
      if (range.to && d > range.to) return false;
      return true;
    };
  }, [range]);

  return { filters, setFilters, matches, inPeriod };
}

export function FilterBar({
  filters,
  onChange,
  placeholder = "Buscar...",
  showPeriod = true,
  extra,
}: {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  placeholder?: string;
  showPeriod?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-end">
      <div className="grid flex-1 gap-2">
        <Label className="text-xs text-muted-foreground">Busca</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={filters.q}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
          />
        </div>
      </div>

      {showPeriod && (
        <div className="grid gap-2 sm:w-[190px]">
          <Label className="text-xs text-muted-foreground">Período</Label>
          <Select
            value={filters.period}
            onValueChange={(v) => onChange({ ...filters, period: v as PeriodKey })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo o período</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showPeriod && filters.period === "custom" && (
        <>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => onChange({ ...filters, from: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => onChange({ ...filters, to: e.target.value })}
            />
          </div>
        </>
      )}

      {extra}
    </div>
  );
}
