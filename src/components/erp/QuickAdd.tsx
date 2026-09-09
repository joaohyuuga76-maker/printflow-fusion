import { useState } from "react";
import { Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageField } from "@/components/erp/ImageField";

export interface QuickField {
  key: string;
  label: string;
  placeholder?: string;
  numeric?: boolean;
  image?: boolean;
  defaultValue?: string;
}

export function QuickAdd({
  trigger,
  title,
  fields,
  onSubmit,
  successMessage,
}: {
  trigger: string;
  title: string;
  fields: QuickField[];
  onSubmit: (values: Record<string, string>) => void;
  successMessage: string;
}) {
  const initial = Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ""]));
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(initial);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setValues(initial);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) =>
            f.image ? (
              <div key={f.key} className="sm:col-span-2">
                <ImageField
                  label={f.label}
                  value={values[f.key] ?? ""}
                  onChange={(v) => setValues({ ...values, [f.key]: v })}
                />
              </div>
            ) : (
              <div key={f.key} className="grid gap-2">
                <Label>{f.label}</Label>
                <Input
                  {...(f.numeric ? { inputMode: "decimal" as const } : {})}
                  {...(f.placeholder ? { placeholder: f.placeholder } : {})}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              </div>
            ),
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onSubmit(values);
              toast.success(successMessage);
              setOpen(false);
              setValues(initial);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
