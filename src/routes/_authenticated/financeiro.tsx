import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { DollarSign, TrendingUp, Activity, Wallet } from "lucide-react";
import { PageHeader, StatCard } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro & DRE | PrintFlow 2K Lab" },
      { name: "description", content: "DRE simplificado da farm 3D: receitas, custos de filamento e energia, perdas e despesas operacionais." },
      { property: "og:title", content: "Financeiro — PrintFlow" },
      { property: "og:description", content: "Resultado mensal da sua operação de impressão 3D." },
    ],
  }),
  component: Financeiro,
});

const monthly = [
  { m: "Mai", receita: 9120, custo: 5095 },
  { m: "Jun", receita: 10480, custo: 5690 },
  { m: "Jul", receita: 11920, custo: 6510 },
  { m: "Ago", receita: 13260, custo: 7080 },
];

const despesas = [
  { name: "Aluguel do galpão", value: 1200 },
  { name: "Internet & software", value: 260 },
  { name: "Marketing / anúncios", value: 480 },
  { name: "Manutenção preventiva", value: 320 },
];

function Financeiro() {
  const { orders, failures, settings, printers } = useErp();
  const receita = orders.filter((o) => o.stage !== "orcamento").reduce((s, o) => s + o.value, 0);
  const custoDireto = orders.filter((o) => o.stage !== "orcamento").reduce((s, o) => s + o.cost, 0);
  const perdas = failures.reduce((s, f) => s + f.cost, 0);
  const energia = printers.reduce((s, p) => s + (p.watts / 1000) * 90 * settings.energyRate, 0);
  const desp = despesas.reduce((s, d) => s + d.value, 0);
  const lucro = receita - custoDireto - perdas - desp;

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="DRE simplificado do período" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Receita bruta" value={brl(receita)} icon={DollarSign} tone="profit" />
        <StatCard label="Custos diretos" value={brl(custoDireto)} hint={`Energia estimada ${brl(energia)}`} icon={Activity} tone="danger" />
        <StatCard label="Despesas operacionais" value={brl(desp)} icon={Wallet} tone="warn" />
        <StatCard label="Lucro líquido" value={brl(lucro)} hint={`Margem ${((lucro / receita) * 100).toFixed(1)}%`} icon={TrendingUp} tone="profit" />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 xl:col-span-2">
          <p className="text-sm font-semibold">Receita x Custo</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="m" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={48} />
                <RTooltip
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, color: "#f1f5f9" }}
                  formatter={(v: number | string) => brl(Number(v))}
                />
                <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="custo" name="Custo" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">DRE simplificado</p>
          <ul className="mt-3 text-sm">
            {[
              ["(+) Receita de vendas", receita, "text-profit"],
              ["(-) Filamento e insumos", custoDireto, "text-danger"],
              ["(-) Perdas por falha", perdas, "text-danger"],
              ["(-) Despesas operacionais", desp, "text-danger"],
            ].map(([label, value, tone]) => (
              <li key={label as string} className="flex justify-between border-b border-border/60 py-2">
                <span className="text-muted-foreground">{label as string}</span>
                <span className={tone as string}>{brl(value as number)}</span>
              </li>
            ))}
            <li className="flex justify-between pt-3 text-base font-bold">
              <span>= Resultado</span>
              <span className="text-profit">{brl(lucro)}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Despesas fixas</p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {despesas.map((d) => (
              <li key={d.name} className="flex justify-between text-muted-foreground">
                <span>{d.name}</span>
                <span>{brl(d.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}