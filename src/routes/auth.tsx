import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | VisionFlow ERP" },
      {
        name: "description",
        content: "Acesse o VisionFlow ERP com seu usuário e senha para gerenciar produção, estoque e financeiro.",
      },
      { property: "og:title", content: "Entrar no VisionFlow ERP" },
      { property: "og:description", content: "Sistema de Gestão & Produção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  // Usuário simples (sem @) é convertido para o e-mail interno do sistema.
  const toLogin = (v: string) => {
    const t = v.trim().toLowerCase();
    return t.includes("@") ? t : `${t.replace(/\s+/g, "")}@printflow.app`;
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: toLogin(user),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Usuário ou senha inválidos.");
      return;
    }
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">VisionFlow ERP</h1>
            <p className="text-xs text-muted-foreground">Sistema de Gestão &amp; Produção</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <form onSubmit={signIn} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="login-user">Usuário</Label>
              <Input
                id="login-user"
                required
                autoComplete="username"
                placeholder="seu usuário"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-pass">Senha</Label>
              <Input
                id="login-pass"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Novos acessos são criados pelo administrador em Usuários &amp; Permissões.
          </p>
        </div>
      </div>
    </div>
  );
}
