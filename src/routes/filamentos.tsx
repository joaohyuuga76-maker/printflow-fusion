import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";
import type { Filament } from "@/lib/erp-types";

export const Route = createFileRoute("/filamentos")({
  head: () => ({
    meta: [
      { title: "Filamentos & Estoque | PrintFlow 2K Lab" },
      { name: "description", content: "Controle de carretéis PLA, PETG, ABS e TPU com peso restante em gramas e alerta de estoque baixo." },
      { property: "og:title", content: "Controle de Filamentos — PrintFlow" },
      { property: "og:description", content: "Estoque de carretéis com baixa automática por falhas e produção." },
    ],
  }),
  component: Filamentos,
});

const types: Filament["type"][] = ["PLA", "PETG", "ABS", "TPU", "Silk", "ASA"];

function Filamentos() {
  const { filaments, addFilament, consumeFilament } = useErp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    type: "PLA" as Filament["type"],
    color: "",
    hex: "#22c55e",
    totalG: "1000",
    pricePerKg: "119.9",
  });

  return (
    <div>
      <PageHeader
        title="Filamentos & Material"
        subtitle={`${filaments.length} carretéis · ${filaments.reduce((s, f) => s + f.remainingG, 0)}g em estoque`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Novo carretel</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92dvh] overflow-y-auto">
              <DialogHeader><DialogTitle>Adicionar carretel</DialogTitle></DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Marca</Label>
                  <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Sunlu" />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Filament["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Cor</Label>
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Azul" />
                </div>
                <div className="grid gap-2">
                  <Label>Amostra da cor</Label>
                  <Input type="color" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} className="h-9 p-1" />
                </div>
                <div className="grid gap-2">
                  <Label>Peso total (g)</Label>
                  <Input inputMode="numeric" value={form.totalG} onChange={(e) => setForm({ ...form, totalG: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Preço por kg (R$)</Label>
                  <Input inputMode="decimal" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    const total = Number(form.totalG) || 1000;
                    addFilament({
                      brand: form.brand || "Genérico",
                      type: form.type,
                      color: form.color || "Sem nome",
                      hex: form.hex,
                      totalG: total,
                      remainingG: total,
                      pricePerKg: Number(form.pricePerKg) || 0,
                    });
                    toast.success("Carretel adicionado ao estoque!");
                    setOpen(false);
                  }}
                >
                  Salvar carretel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filaments.map((f) => {
          const pct = (f.remainingG / f.totalG) * 100;
          const low = f.remainingG < 150;
          return (
            <div key={f.id} className={`rounded-xl border bg-card p-4 ${low ? "border-danger/50" : "border-border"}`}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-8 w-8 shrink-0 rounded-full border-2 border-border" style={{ background: f.hex }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{f.brand} {f.type}</p>
                    <p className="truncate text-xs text-muted-foreground">{f.color} · {brl(f.pricePerKg)}/kg</p>
                  </div>
                </div>
                {low ? (
                  <Badge variant="destructive" className="shrink-0 gap-1"><AlertTriangle className="h-3 w-3" /> Crítico</Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 border-profit/40 text-profit">OK</Badge>
                )}
              </div>

              <Progress value={pct} className="mt-4 h-2" />
              <div className="mt-1.5 flex justify-between text-xs">
                <span className={low ? "font-medium text-danger" : "text-muted-foreground"}>
                  {f.remainingG}g restantes
                </span>
                <span className="text-muted-foreground">de {f.totalG}g</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => { consumeFilament(f.id, 50); toast(`50g baixados de ${f.type} ${f.color}`); }}>
                  <Minus className="h-3.5 w-3.5" /> Baixa 50g
                </Button>
                <Button size="sm" variant="outline" onClick={() => { consumeFilament(f.id, 100); toast(`100g baixados de ${f.type} ${f.color}`); }}>
                  <Minus className="h-3.5 w-3.5" /> Baixa 100g
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}