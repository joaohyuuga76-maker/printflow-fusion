import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Moon, Palette, RotateCcw, Sun, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/erp/ui-bits";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CONFIG,
  PRESETS,
  paletteVars,
  resolvePalette,
  useAppearance,
  type Mode,
  type PresetId,
} from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/aparencia")({
  head: () => ({
    meta: [
      { title: "Aparência e Cores | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Personalize o tema do ERP: presets Polycraft 3D, modo claro/escuro, cor primária, matiz, saturação e temperatura em tempo real.",
      },
      { property: "og:title", content: "Aparência e Personalização de Cores — VisionFlow ERP" },
      { property: "og:description", content: "Temas prontos e color picker com pré-visualização instantânea." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Aparencia,
});

function Swatches({ preset, mode }: { preset: PresetId; mode: Mode }) {
  const p = PRESETS[preset].palettes[mode];
  return (
    <div className="flex gap-1.5">
      {[p.background, p.card, p.primary, p.foreground, p.border].map((c, i) => (
        <span key={i} className="h-5 w-5 rounded-md border border-border" style={{ background: c }} />
      ))}
    </div>
  );
}

function Aparencia() {
  const { config, setMode, setPreset, setAdjust, resetAll, resetCustom } = useAppearance();

  const editMode = (m: Mode) => {
    const adj = config.custom[m];
    const base = PRESETS[config.preset].palettes[m];
    const preview = paletteVars(resolvePalette({ ...config, mode: m }), m);
    return (
      <div key={m} className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {m === "dark" ? <Moon className="h-4 w-4 text-info" /> : <Sun className="h-4 w-4 text-warn" />}
          {m === "dark" ? "Modo Escuro" : "Modo Claro"}
        </p>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <Label>Cor primária (HEX / RGB)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Cor primária ${m}`}
                value={adj.primary ?? base.primary}
                onChange={(e) => setAdjust({ primary: e.target.value }, m)}
                className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
              />
              <Input
                value={adj.primary ?? base.primary}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) {
                    setAdjust({ primary: v.startsWith("#") ? v : `#${v}` }, m);
                  }
                }}
                className="w-32 font-mono"
              />
              <span
                className="ml-auto rounded-md px-3 py-1.5 text-xs font-semibold"
                style={{ background: preview["--primary"], color: preview["--primary-foreground"] }}
              >
                Botão
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="flex justify-between">
              <span>Matiz (hue)</span>
              <span className="text-muted-foreground">{adj.hue}°</span>
            </Label>
            <Slider
              value={[adj.hue]}
              min={-180}
              max={180}
              step={1}
              onValueChange={([v]) => setAdjust({ hue: v ?? 0 }, m)}
            />
          </div>

          <div className="grid gap-2">
            <Label className="flex justify-between">
              <span>Saturação</span>
              <span className="text-muted-foreground">{adj.sat}%</span>
            </Label>
            <Slider
              value={[adj.sat]}
              min={0}
              max={200}
              step={1}
              onValueChange={([v]) => setAdjust({ sat: v ?? 100 }, m)}
            />
          </div>

          <div className="grid gap-2">
            <Label className="flex justify-between">
              <span className="flex items-center gap-2">
                <Thermometer className="h-3.5 w-3.5" /> Temperatura de cor
              </span>
              <span className="text-muted-foreground">
                {adj.temp === 0 ? "neutra" : adj.temp > 0 ? `+${adj.temp} quente` : `${adj.temp} fria`}
              </span>
            </Label>
            <Slider
              value={[adj.temp]}
              min={-100}
              max={100}
              step={1}
              onValueChange={([v]) => setAdjust({ temp: v ?? 0 }, m)}
            />
          </div>

          <div
            className="rounded-lg border p-3"
            style={{ background: preview["--background"], borderColor: preview["--border"] }}
          >
            <div
              className="rounded-md border p-3"
              style={{ background: preview["--card"], borderColor: preview["--border"] }}
            >
              <p className="text-xs font-semibold" style={{ color: preview["--foreground"] }}>
                Pré-visualização · {m === "dark" ? "escuro" : "claro"}
              </p>
              <p className="text-[11px]" style={{ color: preview["--muted-foreground"] }}>
                Cards, textos e bordas com as cores atuais.
              </p>
            </div>
          </div>

          {config.mode !== m && (
            <Button variant="outline" size="sm" onClick={() => setMode(m)}>
              Aplicar este modo agora
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Aparência e Cores"
        subtitle="Temas prontos, modo claro/escuro e personalização em tempo real"
        action={
          <Button
            variant="destructive"
            onClick={() => {
              resetAll();
              toast.success("Cores restauradas para o padrão Polycraft 3D");
            }}
          >
            <RotateCcw className="h-4 w-4" /> Restaurar Cores Padrão
          </Button>
        }
      />

      <div className="grid gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4 text-primary" /> Temas predefinidos
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(Object.keys(PRESETS) as PresetId[]).map((id) => {
              const active = config.preset === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPreset(id)}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                    active ? "border-primary bg-primary/10" : "border-border hover:bg-accent/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{PRESETS[id].label}</span>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{PRESETS[id].hint}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="grid gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Escuro</span>
                      <Swatches preset={id} mode="dark" />
                    </div>
                    <div className="grid gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Claro</span>
                      <Swatches preset={id} mode="light" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Modo ativo:</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-border">
              {(["dark", "light"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                    config.mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {m === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  {m === "dark" ? "Escuro" : "Claro"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={resetCustom}>
              <RotateCcw className="h-4 w-4" /> Restaurar personalizações
            </Button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">{(["dark", "light"] as Mode[]).map(editMode)}</div>

        <p className="text-xs text-muted-foreground">
          As preferências ficam salvas neste navegador (localStorage). Padrão oficial:{" "}
          {PRESETS[DEFAULT_CONFIG.preset].label}.
        </p>
      </div>
    </div>
  );
}
