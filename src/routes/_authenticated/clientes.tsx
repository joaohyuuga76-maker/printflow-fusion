import { createFileRoute } from "@tanstack/react-router";
import { Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/erp/ui-bits";
import { EmptyState, QuickAdd } from "@/components/erp/QuickAdd";
import { RowActions } from "@/components/erp/RowActions";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes (CRM) | PrintFlow 2K Lab" },
      { name: "description", content: "Cadastro de clientes da farm 3D com histórico de compras e ticket médio." },
      { property: "og:title", content: "CRM de Clientes — PrintFlow" },
      { property: "og:description", content: "Histórico de compras e relacionamento com clientes da impressão 3D." },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const { clients, orders, addClient, updateClient, deleteClient } = useErp();
  return (
    <div>
      <PageHeader
        title="Clientes (CRM)"
        subtitle={`${clients.length} clientes cadastrados`}
        action={
          <QuickAdd
            trigger="Novo cliente"
            title="Cadastrar cliente"
            successMessage="Cliente cadastrado!"
            fields={[
              { key: "name", label: "Nome", placeholder: "Studio Rocha" },
              { key: "phone", label: "Telefone", placeholder: "(11) 99999-0000" },
              { key: "city", label: "Cidade / UF", placeholder: "São Paulo / SP" },
            ]}
            onSubmit={(v) =>
              addClient({ name: v['name'] || "Sem nome", phone: v['phone'] || "", city: v['city'] || "" })
            }
          />
        }
      />
      {clients.length === 0 && <EmptyState text="Nenhum cliente cadastrado ainda." />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((c) => {
          const open = orders.filter((o) => o.client === c.name && o.stage !== "concluido").length;
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info/15 text-sm font-bold text-info">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.orders} pedidos</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {open > 0 && <Badge variant="outline" className="shrink-0 border-warn/40 text-warn">{open} em aberto</Badge>}
                  <RowActions
                    compact
                    title="cliente"
                    deleteLabel={c.name}
                    fields={[
                      { key: "name", label: "Nome" },
                      { key: "phone", label: "Telefone" },
                      { key: "city", label: "Cidade / UF" },
                    ]}
                    values={{ name: c.name, phone: c.phone, city: c.city }}
                    onSave={(v) =>
                      updateClient(c.id, {
                        name: v['name'] ?? c.name,
                        phone: v['phone'] ?? c.phone,
                        city: v['city'] ?? c.city,
                      })
                    }
                    onDelete={() => deleteClient(c.id)}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {c.phone}</p>
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {c.city}</p>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Total comprado</span>
                <span className="font-semibold text-profit">{brl(c.total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}