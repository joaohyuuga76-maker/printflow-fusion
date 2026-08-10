import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Boxes, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { mobileNav, navSections } from "./nav";
import { useErp } from "@/lib/erp-store";
import { FailureModal } from "./FailureModal";
import { supabase } from "@/integrations/supabase/client";

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-2">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Zap className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">PrintFlow</p>
          <p className="truncate text-[11px] text-muted-foreground">2K Lab · ERP 3D</p>
        </div>
      )}
    </div>
  );
}

function NavList({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-5 py-4">
      {navSections.map((section) => (
        <div key={section.label}>
          {!compact && (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    compact && "justify-center px-0",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {!compact && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setFailureOpen, filaments } = useErp();
  const lowStock = filaments.filter((f) => f.remainingG < 150).length;

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-sidebar transition-all duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-2">
          <Brand compact={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <NavList compact={collapsed} />
        </div>
        <div className="border-t border-border p-2">
          {!collapsed && <ThemeToggle full />}
          {collapsed && (
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-muted-foreground"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-3">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Brand />
              <NavList onNavigate={() => setOpen(false)} />
              <div className="mt-2 border-t border-border pt-2">
                <ThemeToggle full />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-bold">PrintFlow</p>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
            {lowStock > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-xs text-warn">
                <Boxes className="h-3.5 w-3.5" />
                {lowStock} carretéis com estoque crítico
              </span>
            )}
          </div>

          <Button variant="destructive" size="sm" onClick={() => setFailureOpen(true)}>
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Registrar Falha</span>
          </Button>

          {email && (
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground xl:inline">
              {email}
            </span>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" title="Sair" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="px-4 pb-28 pt-5 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobileNav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <FailureModal />
    </div>
  );
}