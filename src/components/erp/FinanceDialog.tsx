import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FinanceEntry, FinanceKind } from "@/lib/erp-types";

export const RECEIVABLE_CATEGORIES = [
  "Venda Direta",
  "Serviço de 3D",
  "Modelagem 3D",
  "Marketplace",
  "Outros",
];

export const PAYABLE_CATEGORIES = [
  "Filamento/Insumo",
  "Energia",
  "Manutenção",
  "Custos Fixos",
  "Marketing",
  "Outros",
];

export type FinanceForm = Omit<FinanceEntry, "id">;

const blank = (kind: FinanceKind): FinanceForm => ({
  kind,
  description: "",
  party: "",
  amount: 0,
  dueDate: new Date().toISOString().slice(0, 10),
  status: "pendente",
  category: kind === "receivable" ? RECEIVABLE_CATEGORIES[0]! : PAYABLE_CATEGORIES[0]!,
});

export function FinanceDialog({
  open,
  onOpenChange,
  kind,
  entry,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: FinanceKind;
  entry?: FinanceEntry | null;
  onSubmit: (values: FinanceForm) => void;
}) {
  const [form, setForm] = useState<FinanceForm>(blank(kind));

  useEffect(() => {
    if (!open) return;
    if (entry) {
      const { id: _id, ...rest } = entry;
      setForm(rest);
    } else {
      setForm(blank(kind));
    }
  }, [open, entry, kind]);

  const isReceivable = kind === "receivable";
  const categories = isReceivable ? RECEIVABLE_CATEGORIES : PAYABLE_CATEGORIES;

  const save = () => {
    if (!form.description.trim()) {
      toast.error("Informe uma descrição.");
      return;
    }
    onSubmit({ ...form, kind });
    toast.success(entry ? "Lançamento atualizado!" : "Lançamento registrado!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Editar lançamento" : isReceivable ? "Novo recebimento" : "Nova despesa"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              placeholder={isReceivable ? "Ex: Kit de peças técnicas" : "Ex: Bobina PLA 1kg"}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>{isReceivable ? "Cliente" : "Fornecedor/Insumo"}</Label>
            <Input
              value={form.party}
              onChange={(e) => setForm({ ...form, party: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Valor (R$)</Label>
            <Input
              inputMode="decimal"
              value={String(form.amount)}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value.replace(",", ".")) || 0 })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Vencimento</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as FinanceForm["status"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
