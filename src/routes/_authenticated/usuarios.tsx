import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Pencil, Power, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { PageHeader } from "@/components/erp/ui-bits";
import { AdminOnly } from "@/lib/acl";
import { supabase } from "@/integrations/supabase/client";
import { getOperator, type Cargo } from "@/lib/operator-session";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Operadores & Acessos | PrintFlow ERP" },
      {
        name: "description",
        content:
          "Cadastre operadores do PDV com usuário e PIN, defina o cargo e ative ou desative o acesso.",
      },
      { property: "og:title", content: "Operadores & Acessos — PrintFlow ERP" },
      { property: "og:description", content: "Controle de operadores do PDV." },
    ],
  }),
  component: () => (
    <AdminOnly>
      <Operadores />
    </AdminOnly>
  ),
});

interface Operador {
  id: string;
  nome: string;
  usuario: string;
  pin: string;
  cargo: Cargo;
  ativo: boolean;
}

const cargoLabel: Record<Cargo, string> = {
  admin: "Administrador",
  operador: "Operador / Atendente",
};

const blankForm = { nome: "", usuario: "", pin: "", cargo: "operador" as Cargo };

const validPin = (pin: string) => /^\d{4,6}$/.test(pin.trim());
const normUser = (u: string) => u.trim().toLowerCase();

function Operadores() {
  const currentId = getOperator()?.id ?? null;
  const [list, setList] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Operador | null>(null);
  const [editing, setEditing] = useState<Operador | null>(null);
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState({ ...blankForm });

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("operadores")
      .select("id, nome, usuario, pin, cargo, ativo")
      .order("created_at");
    if (error) toast.error("Falha ao carregar operadores.");
    setList((data ?? []) as Operador[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async () => {
    if (!form.nome.trim() || !form.usuario.trim()) {
      toast.error("Informe o nome e o usuário.");
      return;
    }
    if (!validPin(form.pin)) {
      toast.error("O PIN deve ter de 4 a 6 números.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("operadores").insert({
      nome: form.nome.trim(),
      usuario: normUser(form.usuario),
      pin: form.pin.trim(),
      cargo: form.cargo,
      ativo: true,
    });
    setSaving(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "Já existe um operador com esse usuário."
          : "Falha ao cadastrar operador.",
      );
      return;
    }
    toast.success("Operador cadastrado.");
    setOpen(false);
    setForm(blankForm);
    await refresh();
  };

  const startEdit = (o: Operador) => {
    setEditForm({ nome: o.nome, usuario: o.usuario, pin: "", cargo: o.cargo });
    setEditing(o);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.nome.trim() || !editForm.usuario.trim()) {
      toast.error("Informe o nome e o usuário.");
      return;
    }
    if (editForm.pin.trim() && !validPin(editForm.pin)) {
      toast.error("O PIN deve ter de 4 a 6 números.");
      return;
    }
    setSaving(true);
    const patch: Record<string, unknown> = {
      nome: editForm.nome.trim(),
      usuario: normUser(editForm.usuario),
      cargo: editForm.cargo,
    };
    if (editForm.pin.trim()) patch.pin = editForm.pin.trim();
    const { error } = await supabase.from("operadores").update(patch).eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "Já existe um operador com esse usuário."
          : "Falha ao atualizar operador.",
      );
      return;
    }
    toast.success("Operador atualizado.");
    setEditing(null);
    await refresh();
  };

  const toggleAtivo = async (o: Operador) => {
    if (o.id === currentId && o.ativo) {
      toast.error("Você não pode desativar o próprio acesso.");
      return;
    }
    setList((prev) => prev.map((x) => (x.id === o.id ? { ...x, ativo: !o.ativo } : x)));
    const { error } = await supabase
      .from("operadores")
      .update({ ativo: !o.ativo })
      .eq("id", o.id);
    if (error) {
      toast.error("Falha ao alterar o status.");
      await refresh();
      return;
    }
    toast.success(!o.ativo ? "Operador ativado." : "Operador desativado.");
  };

  const remove = async () => {
    if (!removing) return;
    if (removing.id === currentId) {
      toast.error("Você não pode excluir o próprio operador.");
      setRemoving(null);
      return;
    }
    const { error } = await supabase.from("operadores").delete().eq("id", removing.id);
    if (error) {
      toast.error("Falha ao excluir operador.");
    } else {
      setList((prev) => prev.filter((x) => x.id !== removing.id));
      toast.success("Operador excluído.");
    }
    setRemoving(null);
  };

  return (
    <div>
      <PageHeader
        title="Operadores & Acessos"
        subtitle="Administrador tem acesso total. Operador acessa apenas o PDV e o Kanban de vendas."
        action={
          <Button data-testid="novo-operador-button" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Novo operador
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando operadores…</p>
      ) : (
        <div
          data-testid="operadores-list"
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="divide-y divide-border">
            {list.map((o) => (
              <div
                key={o.id}
                data-testid={`operador-row-${o.usuario}`}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {o.nome}
                    {!o.ativo && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (inativo)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{o.usuario}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={o.cargo === "admin" ? "default" : "outline"}>
                    {cargoLabel[o.cargo]}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      data-testid={`operador-ativo-switch-${o.usuario}`}
                      checked={o.ativo}
                      onCheckedChange={() => void toggleAtivo(o)}
                    />
                    <Power className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`operador-edit-${o.usuario}`}
                    onClick={() => startEdit(o)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`operador-delete-${o.usuario}`}
                    onClick={() => setRemoving(o)}
                  >
                    <Trash2 className="h-4 w-4 text-loss" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cadastrar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar operador</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="nu-name">Nome</Label>
              <Input
                id="nu-name"
                data-testid="operador-nome-input"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nu-user">Usuário</Label>
              <Input
                id="nu-user"
                data-testid="operador-usuario-input"
                placeholder="ex.: joao"
                value={form.usuario}
                onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nu-pin">PIN (4 a 6 números)</Label>
              <Input
                id="nu-pin"
                data-testid="operador-pin-input"
                inputMode="numeric"
                maxLength={6}
                placeholder="ex.: 1234"
                value={form.pin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Cargo</Label>
              <Select
                value={form.cargo}
                onValueChange={(v) => setForm((f) => ({ ...f, cargo: v as Cargo }))}
              >
                <SelectTrigger data-testid="operador-cargo-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador / Atendente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button data-testid="operador-salvar-button" disabled={saving} onClick={submit}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar operador</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="eu-name">Nome</Label>
              <Input
                id="eu-name"
                data-testid="operador-edit-nome-input"
                value={editForm.nome}
                onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="eu-user">Usuário</Label>
              <Input
                id="eu-user"
                data-testid="operador-edit-usuario-input"
                value={editForm.usuario}
                onChange={(e) => setEditForm((f) => ({ ...f, usuario: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="eu-pin">Novo PIN (opcional)</Label>
              <Input
                id="eu-pin"
                data-testid="operador-edit-pin-input"
                inputMode="numeric"
                maxLength={6}
                placeholder="Deixe em branco para manter o atual"
                value={editForm.pin}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Cargo</Label>
              <Select
                value={editForm.cargo}
                onValueChange={(v) => setEditForm((f) => ({ ...f, cargo: v as Cargo }))}
              >
                <SelectTrigger data-testid="operador-edit-cargo-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador / Atendente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button data-testid="operador-edit-salvar-button" disabled={saving} onClick={saveEdit}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir operador?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.nome} (@{removing?.usuario}) perderá o acesso ao sistema permanentemente.
              Para manter o histórico, prefira desativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction data-testid="operador-confirmar-exclusao" onClick={remove}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
