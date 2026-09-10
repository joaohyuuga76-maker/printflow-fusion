import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ErpProvider } from "@/lib/erp-store";
import { AppShell } from "@/components/erp/AppShell";
import { RoleProvider } from "@/lib/acl";
import { getOperator } from "@/lib/operator-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    // Sessão do operador vive no localStorage (cliente). No servidor, deixa passar
    // e o cliente revalida logo em seguida.
    if (typeof window === "undefined") return;
    if (!getOperator()) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <ErpProvider>
      <RoleProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </RoleProvider>
    </ErpProvider>
  );
}
