import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileCheck2, Paperclip, X } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useErp } from "@/lib/erp-store";
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
  invoiceNumber: "",
  invoiceSeries: "",
  invoicePath: null,
  invoiceName: null,
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
  const { userId } = useErp();
  const [form, setForm] = useState<FinanceForm>(blank(kind));
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const upload = async (file: File) => {
    if (!userId) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "xml"].includes(ext)) {
      toast.error("Anexe apenas arquivos PDF ou XML.");
      return;
    }
    setUploading(true);
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("notas-fiscais").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error("Não foi possível anexar a nota fiscal.");
      return;
    }
    setForm((f) => ({ ...f, invoicePath: path, invoiceName: file.name }));
    toast.success("Nota fiscal anexada!");
  };

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

          <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-3 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nota fiscal {isReceivable ? "(saída)" : "(entrada)"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Número da NF-e / NFS-e</Label>
                <Input
                  value={form.invoiceNumber}
                  placeholder="000123456"
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Série</Label>
                <Input
                  value={form.invoiceSeries}
                  placeholder="1"
                  onChange={(e) => setForm({ ...form, invoiceSeries: e.target.value })}
                />
              </div>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.xml,application/pdf,text/xml,application/xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
            {form.invoicePath ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-profit/30 bg-profit/10 px-3 py-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-profit">
                  <FileCheck2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{form.invoiceName}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label="Remover anexo"
                  onClick={() => setForm({ ...form, invoicePath: null, invoiceName: null })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
                {uploading ? "Enviando..." : "Anexar arquivo (PDF ou XML)"}
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
