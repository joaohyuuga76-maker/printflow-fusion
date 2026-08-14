import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageField } from "@/components/erp/ImageField";

export interface EditField {
  key: string;
  label: string;
  numeric?: boolean;
  color?: boolean;
  image?: boolean;
  options?: { value: string; label: string }[];
}

export function RowActions({
  title,
  fields,
  values,
  onSave,
  onDelete,
  deleteLabel,
  compact,
}: {
  title: string;
  fields: EditField[];
  values: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
  onDelete: () => void;
  deleteLabel: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(values);

  const size = compact ? "h-7 w-7" : "h-8 w-8";

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={size}
        title="Editar"
        aria-label={`Editar ${title}`}
        onClick={() => {
          setForm(values);
          setOpen(true);
        }}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`${size} text-danger hover:text-danger`}
        title="Excluir"
        aria-label={`Excluir ${title}`}
        onClick={() => setConfirm(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              f.image ? (
                <div key={f.key} className="sm:col-span-2">
                  <ImageField
                    label={f.label}
                    value={form[f.key] ?? ""}
                    onChange={(v) => setForm({ ...form, [f.key]: v })}
                  />
                </div>
              ) : (
              <div key={f.key} className="grid gap-2">
                <Label>{f.label}</Label>
                {f.options ? (
                  <Select
                    value={form[f.key] ?? ""}
                    onValueChange={(v) => setForm({ ...form, [f.key]: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    {...(f.numeric ? { inputMode: "decimal" as const } : {})}
                    {...(f.color ? { type: "color", className: "h-9 p-1" } : {})}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
              )
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                onSave(form);
                toast.success("Alterações salvas!");
                setOpen(false);
              }}
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteLabel} será removido definitivamente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                toast.success("Registro excluído.");
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
