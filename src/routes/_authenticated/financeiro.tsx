import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Clock,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PageHeader, StatCard } from "@/components/erp/ui-bits";
import { EmptyState } from "@/components/erp/QuickAdd";
import { FinanceDialog, type FinanceForm } from "@/components/erp/FinanceDialog";
import { brl, useErp } from "@/lib/erp-store";
import type { FinanceEntry, FinanceKind } from "@/lib/erp-types";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro | PrintFlow 2K Lab" },
      {
        name: "description",
        content:
          "Contas a receber, contas a pagar e DRE em tempo real da sua operação de impressão 3D.",
      },
      { property: "og:title", content: "Financeiro — PrintFlow" },
      {
        property: "og:description",
        content: "Controle de recebimentos, despesas e resultado líquido da farm 3D.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Financeiro,
});

const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

function EntriesTable({
  kind,
  entries,
  onEdit,
  onToggle,
  onDelete,
}: {
  kind: FinanceKind;
  entries: FinanceEntry[];
  onEdit: (e: FinanceEntry) => void;
  onToggle: (e: FinanceEntry) => void;
  onDelete: (e: FinanceEntry) => void;
}) {
  if (!entries.length)
    return (
      <EmptyState
        text={
          kind === "receivable"
            ? "Nenhum lançamento registrado. Use “+ Novo Recebimento” para começar."
            : "Nenhum lançamento registrado. Use “+ Nova Despesa” para começar."
        }
      />
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>{kind === "receivable" ? "Cliente" : "Fornecedor/Insumo"}</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="whitespace-nowrap">Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.description}</TableCell>
              <TableCell className="text-muted-foreground">{e.party || "—"}</TableCell>
              <TableCell
                className={`text-right font-semibold ${
                  kind === "receivable" ? "text-profit" : "text-danger"
                }`}
              >
                {brl(e.amount)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {fmtDate(e.dueDate)}
              </TableCell>
              <TableCell>
                <Badge variant={e.status === "pago" ? "default" : "secondary"}>
                  {e.status === "pago" ? "Pago" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{e.category}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={e.status === "pago" ? "Marcar como pendente" : "Marcar como pago"}
                    aria-label="Alternar status"
                    onClick={() => onToggle(e)}
                  >
                    {e.status === "pago" ? (
                      <Clock className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-profit" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Editar"
                    aria-label="Editar lançamento"
                    onClick={() => onEdit(e)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-danger hover:text-danger"
                    title="Excluir"
                    aria-label="Excluir lançamento"
                    onClick={() => onDelete(e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Financeiro() {
  const { finance, addFinance, updateFinance, deleteFinance } = useErp();
  const [tab, setTab] = useState("receber");
  const [dialogKind, setDialogKind] = useState<FinanceKind>("receivable");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);
  const [toDelete, setToDelete] = useState<FinanceEntry | null>(null);

  const receivables = finance.filter((e) => e.kind === "receivable");
  const payables = finance.filter((e) => e.kind === "payable");
  const sum = (list: FinanceEntry[]) => list.reduce((s, e) => s + e.amount, 0);

  const recebido = sum(receivables.filter((e) => e.status === "pago"));
  const pago = sum(payables.filter((e) => e.status === "pago"));
  const aReceber = sum(receivables.filter((e) => e.status === "pendente"));
  const aPagar = sum(payables.filter((e) => e.status === "pendente"));
  const resultado = recebido - pago;

  const openNew = (kind: FinanceKind) => {
    setDialogKind(kind);
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (e: FinanceEntry) => {
    setDialogKind(e.kind);
    setEditing(e);
    setDialogOpen(true);
  };

  const submit = (values: FinanceForm) => {
    if (editing) updateFinance(editing.id, values);
    else addFinance(values);
  };

  const toggle = (e: FinanceEntry) =>
    updateFinance(e.id, { status: e.status === "pago" ? "pendente" : "pago" });

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Contas a receber, contas a pagar e resultado do período"
        action={
          tab === "dre" ? undefined : (
            <Button onClick={() => openNew(tab === "receber" ? "receivable" : "payable")}>
              <Plus className="h-4 w-4" />
              {tab === "receber" ? "Novo Recebimento" : "Nova Despesa"}
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="dre">DRE / Visão Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="mt-4">
          <EntriesTable
            kind="receivable"
            entries={receivables}
            onEdit={openEdit}
            onToggle={toggle}
            onDelete={setToDelete}
          />
        </TabsContent>

        <TabsContent value="pagar" className="mt-4">
          <EntriesTable
            kind="payable"
            entries={payables}
            onEdit={openEdit}
            onToggle={toggle}
            onDelete={setToDelete}
          />
        </TabsContent>

        <TabsContent value="dre" className="mt-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total recebido" value={brl(recebido)} icon={ArrowDownCircle} tone="profit" />
            <StatCard label="Total pago" value={brl(pago)} icon={ArrowUpCircle} tone="danger" />
            <StatCard label="A receber (pendente)" value={brl(aReceber)} icon={Clock} tone="info" />
            <StatCard label="A pagar (pendente)" value={brl(aPagar)} icon={Clock} tone="warn" />
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <div className="xl:col-span-1">
              <StatCard
                label="Resultado líquido"
                value={brl(resultado)}
                hint="Recebido − Pago"
                icon={TrendingUp}
                tone={resultado < 0 ? "danger" : "profit"}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4 xl:col-span-2">
              <p className="text-sm font-semibold">DRE simplificado</p>
              {finance.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum lançamento registrado</p>
              ) : (
                <ul className="mt-3 text-sm">
                  {[
                    ["(+) Recebimentos liquidados", recebido, "text-profit"],
                    ["(-) Despesas pagas", pago, "text-danger"],
                    ["(=) Pendente a receber", aReceber, "text-info"],
                    ["(=) Pendente a pagar", aPagar, "text-warn"],
                  ].map(([label, value, tone]) => (
                    <li
                      key={label as string}
                      className="flex justify-between border-b border-border/60 py-2"
                    >
                      <span className="text-muted-foreground">{label as string}</span>
                      <span className={tone as string}>{brl(value as number)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between pt-3 text-base font-bold">
                    <span>= Resultado líquido</span>
                    <span className={resultado < 0 ? "text-danger" : "text-profit"}>
                      {brl(resultado)}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <FinanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind={dialogKind}
        entry={editing}
        onSubmit={submit}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.description} será removido definitivamente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteFinance(toDelete.id);
                setToDelete(null);
                toast.success("Lançamento excluído.");
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
