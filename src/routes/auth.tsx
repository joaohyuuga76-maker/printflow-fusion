import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, LockKeyhole, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOperator, loginOperator } from "@/lib/operator-session";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | PrintFlow ERP" },
      {
        name: "description",
        content:
          "Acesse o PrintFlow ERP com seu usuário e PIN de operador para gerenciar produção, estoque e financeiro.",
      },
      { property: "og:title", content: "Entrar no PrintFlow ERP" },
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
  const [usuario, setUsuario] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (getOperator()) navigate({ to: "/", replace: true });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !pin.trim()) {
      toast.error("Informe o usuário e o PIN.");
      return;
    }
    setLoading(true);
    try {
      const op = await loginOperator(usuario, pin);
      if (!op) {
        toast.error("Usuário ou PIN incorretos, ou operador inativo.");
        return;
      }
      toast.success(`Bem-vindo, ${op.nome || op.usuario}!`);
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("Não foi possível entrar. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">PrintFlow ERP</h1>
            <p className="text-xs text-muted-foreground">Frente de Caixa &amp; Produção</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <LockKeyhole className="h-4 w-4 text-primary" />
            Acesso do Operador
          </div>
          <form onSubmit={signIn} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="login-user">Usuário</Label>
              <Input
                id="login-user"
                data-testid="login-usuario-input"
                required
                autoComplete="username"
                autoFocus
                placeholder="ex.: flow"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-pin">PIN / Senha</Label>
              <Input
                id="login-pin"
                data-testid="login-pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                minLength={4}
                maxLength={6}
                required
                autoComplete="current-password"
                placeholder="4 a 6 números"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="mt-1"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Novos operadores são cadastrados pelo administrador em Operadores &amp; Acessos.
          </p>
        </div>
      </div>
    </div>
  );
}
