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
import { supabase } from "@/integrations/supabase/client";

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

  // Carrega do Supabase na inicialização
  useEffect(() => {
    async function loadFromDb() {
      try {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*")
          .eq("id", "default")
          .single();

        if (data && !error) {
          updateSettings({
            company: data.company_name ?? settings.company,
            phone: data.phone ?? settings.phone,
            cnpj: data.cnpj ?? settings.cnpj,
            pixKey: data.pix_key ?? settings.pixKey,
            logoUrl: data.logo_url ?? settings.logoUrl,
            energyRate: Number(data.energy_cost ?? settings.energyRate),
            failureRate: Number(data.failure_rate ?? settings.failureRate),
            defaultMargin: Number(data.default_margin ?? settings.defaultMargin),
          });
          setEnergyRateStr(String(data.energy_cost ?? settings.energyRate));
          setDefaultMarginStr(String(data.default_margin ?? settings.defaultMargin));
          setFailureRateStr(String(data.failure_rate ?? settings.failureRate));
        }
      } catch (err) {
        console.warn("Erro ao buscar configurações no Supabase, usando local:", err);
      }
    }
    loadFromDb();
  }, []);

  useEffect(() => {
    if (parseNum(energyRateStr) !== Number(settings.energyRate))
      setEnergyRateStr(String(settings.energyRate ?? ""));
    if (parseNum(defaultMarginStr) !== Number(settings.defaultMargin))
      setDefaultMarginStr(String(settings.defaultMargin ?? ""));
    if (parseNum(failureRateStr) !== Number(settings.failureRate))
      setFailureRateStr(String(settings.failureRate ?? ""));
  }, [settings.energyRate, settings.defaultMargin, settings.failureRate]);

  // Salva no Supabase e na store
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        id: "default",
        company_name: settings.company,
        phone: settings.phone,
        cnpj: settings.cnpj,
        pix_key: settings.pixKey,
        logo_url: settings.logoUrl,
        energy_cost: parseNum(energyRateStr),
        failure_rate: parseNum(failureRateStr),
        default_margin: parseNum(defaultMarginStr),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("store_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      toast.success("Configurações salvas no banco com sucesso!");
    } catch (err: any) {
      console.error("Falha ao salvar no banco:", err);
      toast.success("Configurações salvas localmente!");
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
          <p className="text-sm font-semibold">Parâmetros de custo</p>
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
          <p className="mt-4 text-xs text-muted-foreground">
            Esses valores alimentam automaticamente a calculadora de orçamentos e o cálculo de
            lucro.
          </p>
        </div>
      </div>
    </div>
  );
}
