import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Calculator, Copy, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Calculadora de Orçamentos | PrintFlow 2K Lab" },
      { name: "description", content: "Calcule filamento, energia, depreciação e margem para precificar peças 3D com precisão." },
      { property: "og:title", content: "Calculadora de Orçamentos 3D — PrintFlow" },
      { property: "og:description", content: "Preço final sugerido e lucro real em segundos." },
    ],
  }),
  component: Orcamento,
});

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

function Orcamento() {
  const { filaments, printers, settings, addOrder } = useErp();
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [filamentId, setFilamentId] = useState(filaments[0]!.id);
  const [printerId, setPrinterId] = useState(printers[0]!.id);
  const [weight, setWeight] = useState("120");
  const [hours, setHours] = useState("4");
  const [minutes, setMinutes] = useState("30");
  const [extra, setExtra] = useState("6");
  const [failRate, setFailRate] = useState(String(settings.failureRate));
  const [margin, setMargin] = useState(String(settings.defaultMargin));

  const calc = useMemo(() => {
    const fil = filaments.find((f) => f.id === filamentId)!;
    const prt = printers.find((p) => p.id === printerId)!;
    const g = Number(weight) || 0;
    const h = (Number(hours) || 0) + (Number(minutes) || 0) / 60;
    const filamentCost = (g / 1000) * fil.pricePerKg;
    const energyCost = h * (prt.watts / 1000) * settings.energyRate;
    const depCost = h * prt.depreciationPerHour;
    const extras = Number(extra) || 0;
    const base = filamentCost + energyCost + depCost + extras;
    const failCost = base * ((Number(failRate) || 0) / 100);
    const total = base + failCost;
    const price = total * (1 + (Number(margin) || 0) / 100);
    return { fil, prt, g, h, filamentCost, energyCost, depCost, extras, failCost, total, price, profit: price - total };
  }, [filaments, printers, filamentId, printerId, weight, hours, minutes, extra, failRate, margin, settings.energyRate]);

  const summary = `*Orçamento 2K Lab — PrintFlow*
Cliente: ${client || "—"}
Projeto: ${project || "—"}
Material: ${calc.fil.brand} ${calc.fil.type} ${calc.fil.color}
Peso: ${calc.g}g | Tempo: ${hours}h${minutes}min
Impressora: ${calc.prt.name}

*Valor final: ${brl(calc.price)}*
Prazo estimado: ${Math.max(2, Math.ceil(calc.h / 8) + 1)} dias úteis
Obrigado pela preferência! 🖨️`;

  return (
    <div>
      <PageHeader title="Calculadora de Orçamentos" subtitle="Precificação automática por peso, tempo, energia e margem" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Studio Rocha" />
            </div>
            <div className="grid gap-2">
              <Label>Projeto / Peça</Label>
              <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Suporte de headset" />
            </div>
            <div className="grid gap-2">
              <Label>Filamento</Label>
              <Select value={filamentId} onValueChange={setFilamentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filaments.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.brand} {f.type} {f.color} — {brl(f.pricePerKg)}/kg
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Impressora</Label>
              <Select value={printerId} onValueChange={setPrinterId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {printers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {p.watts}W</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Peso da peça (g)</Label>
              <Input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Horas</Label>
                <Input inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Minutos</Label>
                <Input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Custos adicionais (R$)</Label>
              <Input inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Taxa de falha (%)</Label>
                <Input inputMode="numeric" value={failRate} onChange={(e) => setFailRate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Margem (%)</Label>
                <Input inputMode="numeric" value={margin} onChange={(e) => setMargin(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Calculator className="h-4 w-4 text-info" /> Composição de custos
            </p>
            <div className="mt-2">
              <Row label="Filamento" value={brl(calc.filamentCost)} />
              <Row label="Energia" value={brl(calc.energyCost)} />
              <Row label="Depreciação" value={brl(calc.depCost)} />
              <Row label="Extras" value={brl(calc.extras)} />
              <Row label={`Reserva de falha (${failRate}%)`} value={brl(calc.failCost)} tone="text-warn" />
              <Row label="Custo total" value={brl(calc.total)} tone="text-danger" />
            </div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Preço final sugerido</p>
            <p className="mt-1 text-3xl font-bold text-profit">{brl(calc.price)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lucro real: <span className="font-semibold text-profit">{brl(calc.profit)}</span>
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                onClick={() => {
                  addOrder({
                    ref: `#2K-${Math.floor(1050 + Math.random() * 900)}`,
                    client: client || "Cliente novo",
                    title: project || "Peça sob demanda",
                    value: Number(calc.price.toFixed(2)),
                    cost: Number(calc.total.toFixed(2)),
                    stage: "orcamento",
                    date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                    channel: "Calculadora",
                    priority: "media",
                    weightG: calc.g,
                    hours: Number(calc.h.toFixed(1)),
                  });
                  toast.success("Pedido criado no Kanban de Vendas!");
                }}
              >
                <FilePlus2 className="h-4 w-4" /> Gerar Pedido
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(summary);
                  toast.success("Resumo copiado para o WhatsApp!");
                }}
              >
                <Copy className="h-4 w-4" /> Copiar resumo para WhatsApp
              </Button>
            </div>
          </div>

          <pre className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            {summary}
          </pre>
        </div>
      </div>
    </div>
  );
}