import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Calculator,
  Copy,
  FileDown,
  FilePlus2,
  Minus,
  Plus,
  Save,
  Settings2,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";
import { buildQuotePdf } from "@/lib/quote-pdf";

export const Route = createFileRoute("/_authenticated/orcamento")({
  head: () => ({
    meta: [
      { title: "Calculadora Comercial | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Precificação comercial avançada: custo unitário, desconto progressivo por lote, lucro líquido e condição de pagamento.",
      },
      { property: "og:title", content: "Calculadora Comercial 3D — VisionFlow ERP" },
      { property: "og:description", content: "Preço por lote, lucro real e margem líquida em segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Orcamento,
});

/** Aceita "4:30", "4h30", "4,5" ou "4.5" e devolve horas decimais. */
function parseHours(input: string): number {
  const raw = input.trim().replace(",", ".").replace(/h/gi, ":");
  if (raw.includes(":")) {
    const [h, m] = raw.split(":");
    return (Number(h) || 0) + (Number(m) || 0) / 60;
  }
  return Number(raw) || 0;
}

const TIERS = [
  { min: 20, pct: 30 },
  { min: 10, pct: 23.3 },
  { min: 5, pct: 16.7 },
  { min: 3, pct: 10 },
  { min: 1, pct: 0 },
];

const discountFor = (qty: number) => TIERS.find((t) => qty >= t.min)?.pct ?? 0;

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs text-muted-foreground">
        {label} {suffix ? <span className="opacity-70">({suffix})</span> : null}
      </Label>
      <Input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Orcamento() {
  const { settings, addOrder, orders, updateOrder } = useErp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [client, setClient] = useState("");
  const [contact, setContact] = useState("");
  const [piece, setPiece] = useState("");
  const [weight, setWeight] = useState("120");
  const [time, setTime] = useState("4:30");
  const [qty, setQty] = useState(1);
  const [basePrice, setBasePrice] = useState("150");

  // Custos operacionais avançados
  const [filamentKg, setFilamentKg] = useState("103");
  const [energyRate, setEnergyRate] = useState("1");
  const [watts, setWatts] = useState("250");
  const [wearPerHour, setWearPerHour] = useState("1");
  const [finishing, setFinishing] = useState("10");

  const editable = orders.filter((o) => o.stage === "orcamento" || o.stage === "aprovado");

  const loadOrder = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setEditingId(o.id);
    setClient(o.client);
    setPiece(o.title);
    setWeight(String(o.weightG));
    setTime(String(o.hours));
    setBasePrice(String(o.value));
    toast.info(`Editando orçamento ${o.ref}`);
  };

  const resetForm = () => {
    setEditingId(null);
    setClient("");
    setContact("");
    setPiece("");
    setWeight("120");
    setTime("4:30");
    setQty(1);
    setBasePrice("150");
  };

  const c = useMemo(() => {
    const g = Number(weight) || 0;
    const h = parseHours(time);
    const units = Math.max(1, qty);
    const material = (g / 1000) * (Number(filamentKg) || 0);
    const energy = h * ((Number(watts) || 0) / 1000) * (Number(energyRate) || 0);
    const wear = h * (Number(wearPerHour) || 0);
    const finish = Number(finishing) || 0;
    const unitCost = material + energy + wear + finish;
    const base = Number(basePrice) || 0;
    const discount = discountFor(units);
    const unitPrice = base * (1 - discount / 100);
    const revenue = unitPrice * units;
    const totalCost = unitCost * units;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return {
      g,
      h,
      units,
      material,
      energy,
      wear,
      finish,
      unitCost,
      discount,
      unitPrice,
      revenue,
      totalCost,
      profit,
      margin,
      entry: revenue / 2,
    };
  }, [weight, time, qty, filamentKg, energyRate, watts, wearPerHour, finishing, basePrice]);

  const summary = `*Orçamento ${settings.company || "VisionFlow ERP"}*
Cliente: ${client || "—"}
Peça: ${piece || "—"}
Quantidade: ${c.units} un${c.discount ? ` (${c.discount}% OFF)` : ""}
Peso: ${c.g}g | Tempo: ${c.h.toFixed(2)}h por peça

Valor unitário: ${brl(c.unitPrice)}
*Total: ${brl(c.revenue)}*
Entrada (50% Pix): ${brl(c.entry)}
Na entrega (50%): ${brl(c.entry)}`;

  return (
    <div>
      <PageHeader
        title="Calculadora Comercial"
        subtitle="Custo real, desconto progressivo por lote e lucro líquido por pedido"
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-3 backdrop-blur sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2">
          <Label className="text-xs text-muted-foreground">Editar orçamento existente</Label>
          <Select value={editingId ?? ""} onValueChange={loadOrder}>
            <SelectTrigger>
              <SelectValue
                placeholder={editable.length ? "Selecione um orçamento" : "Nenhum orçamento salvo ainda"}
              />
            </SelectTrigger>
            <SelectContent>
              {editable.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.ref} · {o.client} · {o.title} — {brl(o.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {editingId && (
          <Button variant="outline" onClick={resetForm}>
            <X className="h-4 w-4" /> Novo orçamento
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Entradas */}
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-xl border border-border bg-card/70 p-4 shadow-lg shadow-black/10 backdrop-blur">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Calculator className="h-4 w-4 text-info" /> Dados da peça
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label>Nome da peça</Label>
                <Input value={piece} onChange={(e) => setPiece(e.target.value)} placeholder="Suporte de headset" />
              </div>
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Studio Rocha" />
              </div>
              <div className="grid gap-2">
                <Label>Contato</Label>
                <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="(11) 99999-0000" />
              </div>
              <div className="grid gap-2">
                <Label>Peso (gramas)</Label>
                <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Tempo de impressão (hh:mm ou decimal)</Label>
                <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="4:30" />
              </div>
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    className="text-center"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => setQty((q) => q + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Preço base avulso (R$)</Label>
                <Input inputMode="decimal" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
              </div>
            </div>

            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="ops" className="rounded-lg border border-border/70 px-3">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-info" /> Custos operacionais avançados
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-3">
                    <NumberField label="Filamento" suffix="R$/kg" value={filamentKg} onChange={setFilamentKg} />
                    <NumberField label="Energia" suffix="R$/kWh" value={energyRate} onChange={setEnergyRate} />
                    <NumberField label="Potência" suffix="W" value={watts} onChange={setWatts} />
                    <NumberField label="Desgaste da máquina" suffix="R$/h" value={wearPerHour} onChange={setWearPerHour} />
                    <NumberField label="Acabamento" suffix="R$/peça" value={finishing} onChange={setFinishing} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5">
              {[
                { r: "1–2 un", p: "0%", min: 1 },
                { r: "3–4 un", p: "10%", min: 3 },
                { r: "5–9 un", p: "16.7%", min: 5 },
                { r: "10–19 un", p: "23.3%", min: 10 },
                { r: "20+ un", p: "30%", min: 20 },
              ].map((t) => {
                const active = discountFor(c.units) === discountFor(t.min);
                return (
                  <div
                    key={t.r}
                    className={`rounded-lg border px-2 py-1.5 text-center ${
                      active
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    <p className="font-semibold">{t.r}</p>
                    <p>{t.p}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
            <p className="text-sm font-semibold">Custo unitário</p>
            <div className="mt-2">
              <Row label="Material (filamento)" value={brl(c.material)} />
              <Row label="Energia" value={brl(c.energy)} />
              <Row label="Desgaste da máquina" value={brl(c.wear)} />
              <Row label="Acabamento" value={brl(c.finish)} />
              <Row label="Custo total por peça" value={brl(c.unitCost)} tone="text-danger" />
            </div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Preço final unitário</p>
              {c.discount > 0 && (
                <span className="rounded-full bg-profit/20 px-2 py-0.5 text-[11px] font-bold text-profit">
                  {c.discount}% OFF
                </span>
              )}
            </div>
            <p className="mt-1 text-3xl font-bold text-profit">{brl(c.unitPrice)}</p>
            <p className="text-xs text-muted-foreground">
              {c.units} {c.units > 1 ? "peças" : "peça"} · base {brl(Number(basePrice) || 0)}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                <p className="text-[11px] text-muted-foreground">Faturamento</p>
                <p className="text-sm font-bold">{brl(c.revenue)}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                <p className="text-[11px] text-muted-foreground">Lucro líquido</p>
                <p className={`text-sm font-bold ${c.profit >= 0 ? "text-profit" : "text-danger"}`}>
                  {brl(c.profit)}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                <p className="text-[11px] text-muted-foreground">Margem líquida</p>
                <p className={`text-sm font-bold ${c.margin >= 0 ? "text-profit" : "text-danger"}`}>
                  {c.margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-info" /> Condição de pagamento
            </p>
            <div className="mt-2">
              <Row label="Entrada (50% Pix)" value={brl(c.entry)} tone="text-info" />
              <Row label="Na entrega (50%)" value={brl(c.entry)} />
              <Row label="Total do pedido" value={brl(c.revenue)} tone="text-profit" />
            </div>
            {settings.pixKey && (
              <p className="mt-2 text-xs text-muted-foreground">Chave Pix: {settings.pixKey}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Button
              onClick={() => {
                const payload = {
                  client: client || "Cliente novo",
                  title: piece || "Peça sob demanda",
                  value: Number(c.revenue.toFixed(2)),
                  cost: Number(c.totalCost.toFixed(2)),
                  weightG: c.g * c.units,
                  hours: Number((c.h * c.units).toFixed(2)),
                };
                if (editingId) {
                  updateOrder(editingId, payload);
                  toast.success("Orçamento atualizado!");
                  return;
                }
                addOrder({
                  ref: `#VF-${Math.floor(1050 + Math.random() * 900)}`,
                  ...payload,
                  stage: "orcamento",
                  date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                  channel: "Calculadora",
                  priority: "media",
                });
                toast.success("Pedido criado no Kanban de Vendas!");
              }}
            >
              {editingId ? <Save className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
              {editingId ? "Salvar alterações" : "Gerar Pedido"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const doc = buildQuotePdf({
                  company: settings.company,
                  cnpj: settings.cnpj,
                  phone: settings.phone,
                  pixKey: settings.pixKey,
                  logoUrl: settings.logoUrl,
                  client: client || "Cliente novo",
                  contact,
                  items: [
                    {
                      name: piece || "Peça sob demanda",
                      qty: c.units,
                      hours: `${c.h.toFixed(2)}h`,
                      material: `${c.g}g`,
                      price: c.revenue,
                    },
                  ],
                  total: c.revenue,
                  payment: `Entrada de ${brl(c.entry)} (50% via Pix) e ${brl(c.entry)} na entrega`,
                  deadline: `${Math.max(2, Math.ceil((c.h * c.units) / 8) + 1)} dias úteis`,
                  validity: "7 dias corridos a partir da emissão",
                });
                doc.save(`orcamento-${(client || "cliente").toLowerCase().replace(/\s+/g, "-")}.pdf`);
                toast.success("PDF do orçamento gerado!");
              }}
            >
              <FileDown className="h-4 w-4" /> Exportar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard?.writeText(summary);
                toast.success("Resumo copiado para o WhatsApp!");
              }}
            >
              <Copy className="h-4 w-4" /> Copiar resumo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
