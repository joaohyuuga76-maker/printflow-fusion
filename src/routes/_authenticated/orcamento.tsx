import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  Timer,
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
          "Precificação comercial avançada: custo unitário, margem desejada, desconto progressivo por lote e lucro líquido real.",
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

/** Parsing numérico flexível — aceita vírgula ou ponto e nunca "reseta" durante digitação.
 *  Só converte no cálculo final; strings intermediárias ("0.", "1,") viram 0/1 apenas no compute. */
function num(input: string | number | undefined | null): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === "number") return isFinite(input) ? input : 0;
  const cleaned = String(input).trim().replace(",", ".");
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return 0;
  const n = Number(cleaned);
  return isFinite(n) ? n : 0;
}

/** 25.5 -> "25h30" */
function fmtHours(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

const fmtWeight = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${Math.round(g)} g`);

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
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  testId?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs text-muted-foreground">
        {label} {suffix ? <span className="opacity-70">({suffix})</span> : null}
      </Label>
      <Input
        data-testid={testId}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Orcamento() {
  const { settings, addOrder, orders, updateOrder } = useErp();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [client, setClient] = useState("");
  const [contact, setContact] = useState("");
  const [piece, setPiece] = useState("");
  const [weight, setWeight] = useState("120");
  const [time, setTime] = useState("4:30");
  const [qty, setQty] = useState(1);
  const [margin, setMargin] = useState("100");
  const [basePrice, setBasePrice] = useState("");
  const [manualBase, setManualBase] = useState(false);

  // Custos operacionais avançados
  const [filamentKg, setFilamentKg] = useState("103");
  const [energyRate, setEnergyRate] = useState("1");
  const [watts, setWatts] = useState("250");
  const [wearPerHour, setWearPerHour] = useState("1");
  const [finishing, setFinishing] = useState("10");

  const editable = orders.filter((o) => o.stage === "orcamento" || o.stage === "aprovado");

  // Custos unitários
  const unitG = num(weight);
  const unitH = parseHours(time);
  const units = Math.max(1, qty);
  const material = (unitG / 1000) * num(filamentKg);
  const energy = unitH * (num(watts) / 1000) * num(energyRate);
  const wear = unitH * num(wearPerHour);
  const finish = num(finishing);
  const unitCost = material + energy + wear + finish;
  const suggestedBase = unitCost * (1 + num(margin) / 100);

  // Preenche o preço base automaticamente enquanto o usuário não editar à mão
  useEffect(() => {
    if (!manualBase) setBasePrice(suggestedBase ? suggestedBase.toFixed(2) : "0.00");
  }, [suggestedBase, manualBase]);

  const c = useMemo(() => {
    const base = Number(String(basePrice).replace(",", ".")) || 0;
    const discount = discountFor(units);
    const unitPrice = base * (1 - discount / 100);
    const revenue = unitPrice * units;
    const totalCost = unitCost * units;
    const profit = revenue - totalCost;
    const marginReal = revenue > 0 ? (profit / revenue) * 100 : 0;
    return {
      base,
      discount,
      unitPrice,
      revenue,
      totalCost,
      profit,
      marginReal,
      entry: revenue / 2,
      totalH: unitH * units,
      totalG: unitG * units,
    };
  }, [basePrice, units, unitCost, unitH, unitG]);

  const loadOrder = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setEditingId(o.id);
    setClient(o.client);
    setPiece(o.title);
    setQty(1);
    setWeight(String(o.weightG));
    setTime(String(o.hours));
    setManualBase(true);
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
    setMargin("100");
    setManualBase(false);
  };

  const orderPayload = () => ({
    client: client || "Cliente novo",
    title: `${piece || "Peça sob demanda"}${units > 1 ? ` (lote ${units} un)` : ""}`,
    value: Number(c.revenue.toFixed(2)),
    cost: Number(c.totalCost.toFixed(2)),
    weightG: Number(c.totalG.toFixed(0)),
    hours: Number(c.totalH.toFixed(2)),
  });

  const saveOrder = (goToSales: boolean) => {
    const payload = orderPayload();
    if (editingId) {
      updateOrder(editingId, payload);
      toast.success("Orçamento atualizado!");
    } else {
      addOrder({
        ref: `#VF-${Math.floor(1050 + Math.random() * 900)}`,
        ...payload,
        stage: "orcamento",
        date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        channel: "Calculadora",
        priority: "media",
      });
      toast.success(
        `Orçamento do lote gerado: ${units} un a ${brl(c.unitPrice)} · total ${brl(c.revenue)} (50/50)`,
      );
    }
    if (goToSales) void navigate({ to: "/vendas" });
  };

  const exportPdf = () => {
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
          qty: units,
          hours: fmtHours(c.totalH),
          material: fmtWeight(c.totalG),
          price: c.revenue,
        },
      ],
      total: c.revenue,
      production: {
        totalHours: fmtHours(c.totalH),
        totalWeight: fmtWeight(c.totalG),
        unitHours: fmtHours(unitH),
        unitWeight: fmtWeight(unitG),
        unitPrice: c.unitPrice,
        discount: c.discount,
      },
      payment: `Entrada de ${brl(c.entry)} (50% via Pix) e ${brl(c.entry)} na entrega`,
      deadline: `${Math.max(2, Math.ceil(c.totalH / 8) + 1)} dias úteis`,
      validity: "7 dias corridos a partir da emissão",
    });
    doc.save(`orcamento-${(client || "cliente").toLowerCase().replace(/\s+/g, "-")}.pdf`);
    toast.success("PDF do orçamento gerado!");
  };

  const summary = `*Orçamento ${settings.company || "VisionFlow ERP"}*
Cliente: ${client || "—"}
Peça: ${piece || "—"}
Quantidade: ${units} un${c.discount ? ` (${c.discount}% OFF)` : ""}
Tempo total: ${fmtHours(c.totalH)} | Filamento: ${fmtWeight(c.totalG)}

Valor unitário: ${brl(c.unitPrice)}
*Total: ${brl(c.revenue)}*
Entrada (50% Pix): ${brl(c.entry)}
Na entrega (50%): ${brl(c.entry)}`;

  return (
    <div>
      <PageHeader
        title="Calculadora Comercial"
        subtitle="Custo real, margem desejada, desconto progressivo por lote e lucro líquido do pedido"
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
                <Input
                  data-testid="calc-piece-name"
                  value={piece}
                  onChange={(e) => setPiece(e.target.value)}
                  placeholder="Suporte de headset"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Input
                  data-testid="calc-client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Studio Rocha"
                />
              </div>
              <div className="grid gap-2">
                <Label>Contato</Label>
                <Input
                  data-testid="calc-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label>Peso unitário (gramas)</Label>
                <Input
                  data-testid="calc-weight"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tempo unitário (hh:mm ou decimal)</Label>
                <Input
                  data-testid="calc-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="4:30"
                />
              </div>
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <div className="flex items-center gap-2">
                  <Button
                    data-testid="calc-qty-minus"
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    data-testid="calc-qty"
                    className="text-center"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
                  />
                  <Button
                    data-testid="calc-qty-plus"
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Margem de lucro desejada (%)</Label>
                <Input
                  data-testid="calc-margin"
                  inputMode="decimal"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Preço base avulso (R$)</Label>
                  {manualBase && (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-info underline"
                      onClick={() => setManualBase(false)}
                    >
                      voltar ao cálculo automático
                    </button>
                  )}
                </div>
                <Input
                  data-testid="calc-base-price"
                  inputMode="decimal"
                  value={basePrice}
                  onChange={(e) => {
                    setManualBase(true);
                    setBasePrice(e.target.value);
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Sugerido: custo {brl(unitCost)} + {num(margin)}% = {brl(suggestedBase)}
                </p>
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
                    <NumberField testId="calc-filament-kg" label="Filamento" suffix="R$/kg" value={filamentKg} onChange={setFilamentKg} />
                    <NumberField testId="calc-energy-rate" label="Energia" suffix="R$/kWh" value={energyRate} onChange={setEnergyRate} />
                    <NumberField testId="calc-watts" label="Potência" suffix="W" value={watts} onChange={setWatts} />
                    <NumberField testId="calc-wear-hour" label="Desgaste da máquina" suffix="R$/h" value={wearPerHour} onChange={setWearPerHour} />
                    <NumberField testId="calc-finishing" label="Acabamento" suffix="R$/peça" value={finishing} onChange={setFinishing} />
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
                const active = discountFor(units) === discountFor(t.min);
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

          <div className="rounded-xl border border-info/30 bg-info/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Timer className="h-4 w-4 text-info" /> Produção do lote ({units} un)
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-[11px] text-muted-foreground">Tempo total de impressão</p>
                <p className="text-xl font-bold">{fmtHours(c.totalH)}</p>
                <p className="text-[11px] text-muted-foreground">{fmtHours(unitH)} por peça</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-[11px] text-muted-foreground">Filamento total</p>
                <p className="text-xl font-bold">{fmtWeight(c.totalG)}</p>
                <p className="text-[11px] text-muted-foreground">{fmtWeight(unitG)} por peça</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Custo unitário</span>
              <span className="text-muted-foreground">Total do lote</span>
            </div>
            <div className="mt-2">
              <Row label="Material (filamento)" value={`${brl(material)} · ${brl(material * units)}`} />
              <Row label="Energia" value={`${brl(energy)} · ${brl(energy * units)}`} />
              <Row label="Desgaste da máquina" value={`${brl(wear)} · ${brl(wear * units)}`} />
              <Row label="Acabamento" value={`${brl(finish)} · ${brl(finish * units)}`} />
              <Row
                label="Custo"
                value={`${brl(unitCost)} · ${brl(c.totalCost)}`}
                tone="text-danger"
              />
            </div>
          </div>

          <div data-testid="calc-final-price-card" className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Preço final unitário</p>
              {c.discount > 0 && (
                <span data-testid="calc-discount-badge" className="rounded-full bg-profit/20 px-2 py-0.5 text-[11px] font-bold text-profit">
                  {c.discount}% OFF
                </span>
              )}
            </div>
            <p data-testid="calc-unit-price" className="mt-1 text-3xl font-bold text-profit">{brl(c.unitPrice)}</p>
            <p className="text-xs text-muted-foreground">
              {units} {units > 1 ? "peças" : "peça"} · base {brl(c.base)}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                <p className="text-[11px] text-muted-foreground">Faturamento</p>
                <p data-testid="calc-revenue" className="text-sm font-bold">{brl(c.revenue)}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                <p className="text-[11px] text-muted-foreground">Lucro líquido real</p>
                <p data-testid="calc-profit" className={`text-sm font-bold ${c.profit >= 0 ? "text-profit" : "text-danger"}`}>
                  {brl(c.profit)}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                <p className="text-[11px] text-muted-foreground">Margem líquida real</p>
                <p data-testid="calc-margin-real" className={`text-sm font-bold ${c.marginReal >= 0 ? "text-profit" : "text-danger"}`}>
                  {c.marginReal.toFixed(1)}%
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
            <Button data-testid="calc-generate-quote-btn" onClick={() => saveOrder(true)}>
              <FilePlus2 className="h-4 w-4" /> Gerar Orçamento deste Lote
            </Button>
            <Button data-testid="calc-save-quote-btn" variant="outline" onClick={() => saveOrder(false)}>
              {editingId ? <Save className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
              {editingId ? "Salvar alterações" : "Salvar sem sair"}
            </Button>
            <Button data-testid="calc-export-pdf-btn" variant="outline" onClick={exportPdf}>
              <FileDown className="h-4 w-4" /> Exportar PDF
            </Button>
            <Button
              data-testid="calc-copy-summary-btn"
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
