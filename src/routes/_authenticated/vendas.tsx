import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";
import type { OrderStage } from "@/lib/erp-types";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Kanban de Vendas | PrintFlow 2K Lab" },
      { name: "description", content: "Acompanhe cada pedido do orçamento à entrega no quadro Kanban da sua farm 3D." },
      { property: "og:title", content: "Kanban de Vendas — PrintFlow" },
      { property: "og:description", content: "Pedidos de impressão 3D organizados por etapa de produção." },
    ],
  }),
  component: Vendas,
});

const stages: { id: OrderStage; label: string; color: string }[] = [
  { id: "orcamento", label: "Orçamento", color: "border-t-warn" },
  { id: "aprovado", label: "Aprovado", color: "border-t-info" },
  { id: "fila", label: "Na Fila", color: "border-t-production" },
  { id: "impressao", label: "Em Impressão", color: "border-t-production" },
  { id: "pos", label: "Pós-Processamento", color: "border-t-info" },
  { id: "envio", label: "Envio", color: "border-t-profit" },
  { id: "concluido", label: "Concluído", color: "border-t-profit" },
];

function Vendas() {
  const { orders, moveOrder } = useErp();

  return (
    <div>
      <PageHeader title="Kanban de Vendas" subtitle="Arraste o pedido pelas etapas usando o botão de avanço" />
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-max gap-3">
          {stages.map((stage, si) => {
            const list = orders.filter((o) => o.stage === stage.id);
            const total = list.reduce((s, o) => s + o.value, 0);
            return (
              <div key={stage.id} className={`w-[270px] shrink-0 rounded-xl border border-t-2 border-border bg-card/60 p-3 ${stage.color}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{stage.label}</p>
                  <Badge variant="secondary">{list.length}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{brl(total)}</p>
                <div className="mt-3 space-y-2">
                  {list.map((o) => (
                    <div key={o.id} className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs text-muted-foreground">{o.ref} · {o.date}</p>
                          <p className="truncate text-sm font-medium">{o.title}</p>
                        </div>
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{o.client} · {o.channel}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-profit">{brl(o.value)}</span>
                        <Badge
                          variant="outline"
                          className={
                            o.priority === "alta"
                              ? "border-danger/40 text-danger"
                              : o.priority === "media"
                                ? "border-warn/40 text-warn"
                                : "border-border text-muted-foreground"
                          }
                        >
                          {o.priority}
                        </Badge>
                      </div>
                      {si < stages.length - 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-7 w-full justify-center text-xs text-muted-foreground hover:text-primary"
                          onClick={() => moveOrder(o.id, stages[si + 1]!.id)}
                        >
                          Avançar <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {list.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      Vazio
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}