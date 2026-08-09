import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Database, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/erp/ui-bits";
import { useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | PrintFlow 2K Lab" },
      { name: "description", content: "Margem padrão, tarifa de energia, dados da empresa e preparação do banco de dados do PrintFlow." },
      { property: "og:title", content: "Configurações — PrintFlow" },
      { property: "og:description", content: "Ajuste os parâmetros globais do seu ERP de impressão 3D." },
    ],
  }),
  component: Configuracoes,
});

const tables = [
  "printers (id, name, watts, depreciation_per_hour, status)",
  "filaments (id, brand, type, color, total_g, remaining_g, price_per_kg)",
  "orders (id, ref, client_id, title, value, cost, stage, priority)",
  "products (id, name, category, weight_g, hours, price)",
  "clients (id, name, phone, city)",
  "failures (id, printer_id, filament_id, lost_g, reason, cost)",
  "extra_costs (id, name, unit, unit_price)",
  "settings (id, company, energy_rate, default_margin, failure_rate)",
];

function Configuracoes() {
  const { settings, updateSettings } = useErp();

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Parâmetros globais e dados da empresa" />
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Dados da empresa</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={settings.company} onChange={(e) => updateSettings({ company: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>CNPJ</Label>
              <Input value={settings.cnpj} onChange={(e) => updateSettings({ cnpj: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Tarifa de energia (R$/kWh)</Label>
              <Input
                inputMode="decimal"
                value={settings.energyRate}
                onChange={(e) => updateSettings({ energyRate: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Margem padrão (%)</Label>
              <Input
                inputMode="numeric"
                value={settings.defaultMargin}
                onChange={(e) => updateSettings({ defaultMargin: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Taxa de falha padrão (%)</Label>
              <Input
                inputMode="numeric"
                value={settings.failureRate}
                onChange={(e) => updateSettings({ failureRate: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={() => toast.success("Configurações salvas!")}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4 text-info" /> Banco de dados
            </p>
            <Badge variant="outline" className="border-warn/40 text-warn">Modo demonstração</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Os dados atuais são mock em memória. O schema abaixo já está mapeado para ativar a persistência em nuvem
            quando você quiser — é só pedir.
          </p>
          <ul className="mt-3 space-y-1.5">
            {tables.map((t) => (
              <li key={t} className="rounded-lg bg-background/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}