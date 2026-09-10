import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getOperator } from "@/lib/operator-session";

export type AppRole = "admin" | "operador";

/** Rotas liberadas para o perfil Operador/Atendente. */
export const OPERATOR_ROUTES = ["/pdv", "/vendas", "/aparencia"];

interface RoleState {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
}

const RoleContext = createContext<RoleState>({ role: null, loading: true, isAdmin: false });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const op = getOperator();
    setRole(op?.cargo === "admin" ? "admin" : "operador");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading || role !== "operador") return;
    if (!OPERATOR_ROUTES.includes(pathname)) {
      navigate({ to: "/pdv", replace: true });
    }
  }, [loading, role, pathname, navigate]);

  return (
    <RoleContext.Provider value={{ role, loading, isAdmin: role === "admin" }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useRole();
  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Seu perfil de acesso (Operador) não permite visualizar esta tela.
      </div>
    );
  }
  return <>{children}</>;
}
