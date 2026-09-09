import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useErp, brl } from "@/lib/erp-store";

const reasons = [
  "Descolamento de mesa",
  "Bico entupido",
  "Queda de energia",
  "Arquivo fatiado errado",
  "Outro",
];

export function FailureModal() {
  const { printers, filaments, addFailure, failureOpen, setFailureOpen } = useErp();
  const [printerId, setPrinterId] = useState(printers[0]?.id ?? "");
  const [filamentId, setFilamentId] = useState(filaments[0]?.id ?? "");
  const [lostG, setLostG] = useState("");
  const [reason, setReason] = useState(reasons[0]!);
  const [notes, setNotes] = useState("");

  const filament = filaments.find((f) => f.id === filamentId);
  const grams = Number(lostG) || 0;
  const cost = filament ? (grams / 1000) * filament.pricePerKg : 0;

  function save() {
    if (!printerId || !filamentId || grams <= 0) {
      toast.error("Preencha impressora, filamento e peso perdido.");
      return;
    }
    addFailure({ printerId, filamentId, lostG: grams, reason, notes });
    toast.success(`Falha registrada — ${grams}g baixados do estoque (${brl(cost)}).`);
    setLostG("");
    setNotes("");
    setFailureOpen(false);
  }

  return (
    <Dialog open={failureOpen} onOpenChange={setFailureOpen}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Registrar Falha
          </DialogTitle>
          <DialogDescription>
            A perda é descontada do estoque de filamento e somada aos custos do mês.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Impressora</Label>
            <Select value={printerId} onValueChange={setPrinterId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {printers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Filamento utilizado</Label>
            <Select value={filamentId} onValueChange={setFilamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {filaments.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.brand} {f.type} {f.color} — {f.remainingG}g
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Peso perdido (g)</Label>
              <Input
                inputMode="numeric"
                value={lostG}
                onChange={(e) => setLostG(e.target.value)}
                placeholder="180"
              />
            </div>
            <div className="grid gap-2">
              <Label>Prejuízo estimado</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-semibold text-destructive">
                {brl(cost)}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Motivo da falha</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes do ocorrido..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setFailureOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={save}>
            Salvar falha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
