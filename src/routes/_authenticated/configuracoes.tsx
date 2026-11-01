import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Save, Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/erp/ui-bits";
import { ImageField } from "@/components/erp/ImageField";
import { useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da Loja | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Nome da empresa, contato, chave Pix, logomarca e parâmetros de custo usados nos orçamentos e relatórios.",
      },
      { property: "og:title", content: "Configurações da Loja — VisionFlow ERP" },
      { property: "og:description", content: "Personalize sua loja, logo e parâmetros do ERP 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

const parseNum = (v: string) => {
  const cleaned = v.trim().replace(",", ".");
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return 0;
  const n = Number(cleaned);
  return isFinite(n) ? n : 0;
};

function Configuracoes() {
  const { settings, updateSettings } = useErp();
  const [loading, setLoading] = useState(false);

  const [energyRateStr, setEnergyRateStr] = useState(String(settings.energyRate ?? ""));
  const [defaultMarginStr, setDefaultMarginStr] = useState(String(settings.defaultMargin ?? ""));
  const [failureRateStr, setFailureRateStr] = useState(String(settings.failureRate ?? ""));
  const [minimumMarginStr, setMinimumMarginStr] = useState(String(settings.minimumMargin ?? 20));
  const [batchDiscounts, setBatchDiscounts] = useState(
    settings.batchDiscounts ?? [
      { minQuantity: 1, discountPercent: 0 },
      { minQuantity: 3, discountPercent: 10 },
      { minQuantity: 5, discountPercent: 16.7 },
      { minQuantity: 10, discountPercent: 23.3 },
      { minQuantity: 20, discountPercent: 30 },
    ],
  );

  useEffect(() => {
    setMinimumMarginStr(String(settings.minimumMargin ?? 20));
    if (settings.batchDiscounts?.length) setBatchDiscounts(settings.batchDiscounts);
  }, [settings.minimumMargin, settings.batchDiscounts]);



  useEffect(() => {
    if (parseNum(energyRateStr) !== Number(settings.energyRate))
      setEnergyRateStr(String(settings.energyRate ?? ""));
    if (parseNum(defaultMarginStr) !== Number(settings.defaultMargin))
      setDefaultMarginStr(String(settings.defaultMargin ?? ""));
    if (parseNum(failureRateStr) !== Number(settings.failureRate))
      setFailureRateStr(String(settings.failureRate ?? ""));
  }, [settings.energyRate, settings.defaultMargin, settings.failureRate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const normalizedDiscounts = batchDiscounts
        .map((tier) => ({
          minQuantity: Math.max(1, Math.floor(tier.minQuantity)),
          discountPercent: Math.min(100, Math.max(0, tier.discountPercent)),
        }))
        .sort((a, b) => a.minQuantity - b.minQuantity);
      if (new Set(normalizedDiscounts.map((tier) => tier.minQuantity)).size !== normalizedDiscounts.length) {
        toast.error("Cada faixa precisa ter uma quantidade mínima diferente.");
        return;
      }
      const saved = await updateSettings({
        energyRate: parseNum(energyRateStr),
        defaultMargin: parseNum(defaultMarginStr),
        failureRate: parseNum(failureRateStr),
        minimumMargin: Math.min(90, Math.max(0, parseNum(minimumMarginStr))),
        batchDiscounts: normalizedDiscounts,
      });
      if (!saved) {
        toast.error("Não foi possível salvar as configurações no Supabase.");
        return;
      }
      toast.success("Configurações salvas no Supabase.");
    } catch {
      toast.error("Não foi possível salvar as configurações no Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Configurações da Loja"
        subtitle="Dados usados no cabeçalho dos PDFs, orçamentos e relatórios"
      />
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Store className="h-4 w-4 text-info" /> Identidade da loja
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome da empresa</Label>
              <Input
                data-testid="settings-company-input"
                value={settings.company}
                onChange={(e) => updateSettings({ company: e.target.value })}
                placeholder="VisionFlow ERP"
              />
            </div>
            <div className="grid gap-2">
              <Label>Telefone / Contato</Label>
              <Input
                data-testid="settings-phone-input"
                value={settings.phone}
                onChange={(e) => updateSettings({ phone: e.target.value })}
                placeholder="(11) 99999-0000"
              />
            </div>
            <div className="grid gap-2">
              <Label>CNPJ</Label>
              <Input
                data-testid="settings-cnpj-input"
                value={settings.cnpj}
                onChange={(e) => updateSettings({ cnpj: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Chave Pix</Label>
              <Input
                data-testid="settings-pix-input"
                value={settings.pixKey}
                onChange={(e) => updateSettings({ pixKey: e.target.value })}
                placeholder="pix@2klab.com.br"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageField
                label="Logomarca (aparece no header e no PDF)"
                max={600}
                value={settings.logoUrl ?? ""}
                onChange={(v) => updateSettings({ logoUrl: v || null })}
              />
            </div>
          </div>
          <Button
            data-testid="settings-save-btn"
            className="mt-4"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Parâmetros de custo e proteção de margem</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tarifa de energia (R$/kWh)</Label>
              <Input
                data-testid="settings-energy-rate"
                inputMode="decimal"
                value={energyRateStr}
                onChange={(e) => {
                  setEnergyRateStr(e.target.value);
                  updateSettings({ energyRate: parseNum(e.target.value) });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Margem padrão (%)</Label>
              <Input
                data-testid="settings-default-margin"
                inputMode="decimal"
                value={defaultMarginStr}
                onChange={(e) => {
                  setDefaultMarginStr(e.target.value);
                  updateSettings({ defaultMargin: parseNum(e.target.value) });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Piso de margem líquida (%)</Label>
              <Input
                data-testid="settings-minimum-margin"
                inputMode="decimal"
                value={minimumMarginStr}
                onChange={(e) => setMinimumMarginStr(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Taxa de falha padrão (%)</Label>
              <Input
                data-testid="settings-failure-rate"
                inputMode="decimal"
                value={failureRateStr}
                onChange={(e) => {
                  setFailureRateStr(e.target.value);
                  updateSettings({ failureRate: parseNum(e.target.value) });
                }}
              />
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-semibold">Desconto por quantidade</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Defina o mínimo de peças e o desconto máximo de cada faixa. A calculadora limita o desconto para preservar o piso de margem.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {batchDiscounts.map((tier, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">A partir de (un.)</Label>
                    <Input
                      inputMode="numeric"
                      value={tier.minQuantity}
                      onChange={(e) => setBatchDiscounts((prev) => prev.map((item, i) =>
                        i === index ? { ...item, minQuantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) } : item
                      ))}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Desconto (%)</Label>
                    <Input
                      inputMode="decimal"
                      value={tier.discountPercent}
                      onChange={(e) => setBatchDiscounts((prev) => prev.map((item, i) =>
                        i === index ? { ...item, discountPercent: Math.min(100, Math.max(0, parseNum(e.target.value))) } : item
                      ))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Esses valores alimentam a calculadora de orçamentos. O markup padrão é diferente da margem líquida mínima.
          </p>
        </div>
      </div>
    </div>
  );
}
