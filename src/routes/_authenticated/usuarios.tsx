import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  createAppUser,
  deleteAppUser,
  listAppUsers,
  setAppUserRole,
  type AppUser,
} from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários & Permissões | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Cadastre operadores e administradores e defina o nível de acesso de cada usuário do ERP.",
      },
      { property: "og:title", content: "Usuários & Permissões — VisionFlow ERP" },
      { property: "og:description", content: "Controle de perfis de acesso do ERP 3D." },
    ],
  }),
  component: () => (
    <AdminOnly>
      <Usuarios />
    </AdminOnly>
  ),
});

const roleLabel = { admin: "Administrador", operador: "Operador / Atendente" } as const;

function Usuarios() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<AppUser | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "operador" as AppUser["role"],
  });

  const refresh = useCallback(async () => {
    try {
      setUsers(await listAppUsers());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar usuários.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async () => {
    setSaving(true);
    try {
      await createAppUser({ data: form });
      toast.success("Usuário cadastrado.");
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", role: "operador" });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar usuário.");
    }
    setSaving(false);
  };

  const changeRole = async (user: AppUser, role: AppUser["role"]) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
    try {
      await setAppUserRole({ data: { userId: user.id, role } });
      toast.success(`${user.email} agora é ${roleLabel[role]}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao alterar permissão.");
      await refresh();
    }
  };

  const remove = async () => {
    if (!removing) return;
    try {
      await deleteAppUser({ data: { userId: removing.id } });
      setUsers((prev) => prev.filter((u) => u.id !== removing.id));
      toast.success("Usuário excluído.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir usuário.");
    }
    setRemoving(null);
  };

  return (
    <div>
      <PageHeader
        title="Usuários & Permissões"
        subtitle="Administrador tem acesso total. Operador acessa apenas o PDV e o Kanban de vendas."
        action={
          <Button onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Novo usuário
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando usuários…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.fullName || u.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.role === "admin" ? "default" : "outline"}>
                    {roleLabel[u.role]}
                  </Badge>
                  <Select value={u.role} onValueChange={(v) => changeRole(u, v as AppUser["role"])}>
                    <SelectTrigger className="w-[190px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="operador">Operador / Atendente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => setRemoving(u)}>
                    <Trash2 className="h-4 w-4 text-loss" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="nu-name">Nome</Label>
              <Input
                id="nu-name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nu-email">Usuário (e-mail)</Label>
              <Input
                id="nu-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nu-pass">Senha</Label>
              <Input
                id="nu-pass"
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Perfil de acesso</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as AppUser["role"] }))}
              >
                <SelectTrigger>
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
            <Button disabled={saving} onClick={submit}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.email} perderá o acesso ao sistema permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}