import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Save, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/erp/ui-bits";
import { ImageField } from "@/components/erp/ImageField";
import { useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da Loja | PrintFlow 2K Lab" },
      {
        name: "description",
        content:
          "Nome da empresa, contato, chave Pix, logomarca e parâmetros de custo usados nos orçamentos e relatórios.",
      },
      { property: "og:title", content: "Configurações da Loja — PrintFlow" },
      { property: "og:description", content: "Personalize sua loja, logo e parâmetros do ERP 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { settings, updateSettings } = useErp();

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
                value={settings.company}
                onChange={(e) => updateSettings({ company: e.target.value })}
                placeholder="2K Lab — PrintFlow"
              />
            </div>
            <div className="grid gap-2">
              <Label>Telefone / Contato</Label>
              <Input
                value={settings.phone}
                onChange={(e) => updateSettings({ phone: e.target.value })}
                placeholder="(11) 99999-0000"
              />
            </div>
            <div className="grid gap-2">
              <Label>CNPJ</Label>
              <Input value={settings.cnpj} onChange={(e) => updateSettings({ cnpj: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Chave Pix</Label>
              <Input
                value={settings.pixKey}
                onChange={(e) => updateSettings({ pixKey: e.target.value })}
                placeholder="pix@2klab.com.br"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageField
                label="Logomarca (aparece no PDF)"
                max={600}
                value={settings.logoUrl ?? ""}
                onChange={(v) => updateSettings({ logoUrl: v || null })}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={() => toast.success("Configurações da loja salvas!")}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Parâmetros de custo</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <p className="mt-4 text-xs text-muted-foreground">
            Esses valores alimentam automaticamente a calculadora de orçamentos e o cálculo de lucro.
          </p>
        </div>
      </div>
    </div>
  );
}
