import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Activity,
  Package,
  TrendingUp,
  Truck,
  Send,
  ClipboardList,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, StatCard } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard | PrintFlow — ERP de Impressão 3D 2K Lab" },
      {
        name: "description",
        content:
          "Painel completo da sua farm 3D: faturamento, lucro líquido, custos de produção, filamentos e status das impressoras.",
      },
      { property: "og:title", content: "PrintFlow — ERP de Impressão 3D" },
      {
        property: "og:description",
        content: "Gestão de pedidos, farm de impressoras, filamentos e finanças em um só lugar.",
      },
    ],
  }),
  component: Dashboard,
});

const profitSeries = [
  { m: "Fev", fat: 6100, lucro: 2380 },
  { m: "Mar", fat: 7450, lucro: 3010 },
  { m: "Abr", fat: 6890, lucro: 2640 },
  { m: "Mai", fat: 9120, lucro: 4025 },
  { m: "Jun", fat: 10480, lucro: 4790 },
  { m: "Jul", fat: 11920, lucro: 5410 },
  { m: "Ago", fat: 13260, lucro: 6180 },
];

const costSlices = [
  { name: "Filamento", value: 3120, color: "#3b82f6" },
  { name: "Energia", value: 940, color: "#f59e0b" },
  { name: "Depreciação", value: 1480, color: "#a855f7" },
  { name: "Extras", value: 620, color: "#ef4444" },
];

function StageList({
  title,
  icon: Icon,
  tone,
  orders,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  orders: { ref: string; client: string; date: string; channel: string; value: number }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
          <p className="truncate text-sm font-semibold">{title}</p>
        </div>
        <Badge variant="secondary">{orders.length}</Badge>
      </div>
      <ul className="mt-3 space-y-2">
        {orders.slice(0, 3).map((o) => (
          <li key={o.ref} className="rounded-lg bg-background/60 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{o.ref} · {o.client}</span>
              <span className="shrink-0 text-profit">{brl(o.value)}</span>
            </div>
            <p className="mt-0.5 text-muted-foreground">{o.date} · {o.channel}</p>
          </li>
        ))}
        {orders.length === 0 && <li className="text-xs text-muted-foreground">Nada por aqui.</li>}
      </ul>
    </div>
  );
}

function Dashboard() {
  const { orders, products, printers, failures, setFailureOpen } = useErp();

  const faturamento = orders.filter((o) => o.stage !== "orcamento").reduce((s, o) => s + o.value, 0);
  const custo = orders.filter((o) => o.stage !== "orcamento").reduce((s, o) => s + o.cost, 0);
  const perdas = failures.reduce((s, f) => s + f.cost, 0);
  const lucro = faturamento - custo - perdas;
  const lotes = orders.filter((o) => ["pos", "envio", "concluido"].includes(o.stage)).length;

  const topPrinters = [...printers].sort((a, b) => b.hoursRun - a.hoursRun).slice(0, 4);
  const topFailures = [...printers].sort((a, b) => b.failures - a.failures).slice(0, 4);
  const topProducts = [...products].sort((a, b) => b.sold * b.price - a.sold * a.price).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do seu negócio"
        action={
          <div className="flex items-center gap-2">
            <Select defaultValue="2026-01">
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-01">Janeiro de 2026</SelectItem>
                <SelectItem value="2025-12">Dezembro de 2025</SelectItem>
                <SelectItem value="2025-11">Novembro de 2025</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" onClick={() => setFailureOpen(true)}>
              <AlertTriangle className="h-4 w-4" /> Registrar Falha
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Faturamento Total" value={brl(faturamento)} hint="+18% vs. mês anterior" icon={DollarSign} tone="profit" />
        <StatCard label="Lucro Líquido" value={brl(lucro)} hint={`Margem ${((lucro / faturamento) * 100).toFixed(1)}%`} icon={TrendingUp} tone="profit" />
        <StatCard label="Custo de Produção" value={brl(custo + perdas)} hint={`${brl(perdas)} em falhas`} icon={Activity} tone="danger" />
        <StatCard label="Lotes Produzidos" value={String(lotes)} hint={`${orders.length} pedidos no total`} icon={Package} tone="production" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StageList title="Orçamentos Pendentes" icon={ClipboardList} tone="text-warn" orders={orders.filter((o) => o.stage === "orcamento")} />
        <StageList title="Na Fila (Produção)" icon={Timer} tone="text-production" orders={orders.filter((o) => o.stage === "fila" || o.stage === "impressao")} />
        <StageList title="A Enviar" icon={Send} tone="text-info" orders={orders.filter((o) => o.stage === "pos")} />
        <StageList title="Em Trânsito" icon={Truck} tone="text-profit" orders={orders.filter((o) => o.stage === "envio")} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 xl:col-span-2">
          <p className="text-sm font-semibold">Evolução do Lucro</p>
          <p className="text-xs text-muted-foreground">Faturamento x lucro líquido nos últimos 7 meses</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitSeries}>
                <defs>
                  <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLuc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="m" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={48} />
                <RTooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, color: "#f1f5f9" }}
                  formatter={(v: number | string) => brl(Number(v))}
                />
                <Area type="monotone" dataKey="fat" name="Faturamento" stroke="#3b82f6" fill="url(#gFat)" strokeWidth={2} />
                <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#22c55e" fill="url(#gLuc)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Custos de Produção</p>
          <p className="text-xs text-muted-foreground">Distribuição do mês</p>
          <div className="mt-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costSlices} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                  {costSlices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, color: "#f1f5f9" }}
                  formatter={(v: number | string) => brl(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {costSlices.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-medium">{brl(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Top Produtos</p>
          <ul className="mt-3 space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-secondary text-[11px] font-bold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sold} vendidos</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-profit">{brl(p.sold * p.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Top Impressoras</p>
          <p className="text-xs text-muted-foreground">Horas rodadas</p>
          <ul className="mt-3 space-y-3">
            {topPrinters.map((p) => (
              <li key={p.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{p.name}</span>
                  <span className="text-info">{p.hoursRun}h</span>
                </div>
                <Progress value={(p.hoursRun / 2200) * 100} className="mt-1.5 h-1.5" />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Top Falhas</p>
          <p className="text-xs text-muted-foreground">Máquinas com mais problemas</p>
          <ul className="mt-3 space-y-3">
            {topFailures.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{p.name}</span>
                <Badge variant="destructive">{p.failures} falhas</Badge>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link to="/falhas">
              <Boxes className="h-4 w-4" /> Ver histórico completo
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
