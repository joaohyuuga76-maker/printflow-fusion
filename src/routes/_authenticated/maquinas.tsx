import { createFileRoute } from "@tanstack/react-router";
import { Zap, Wrench, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatCard } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/maquinas")({
  head: () => ({
    meta: [
      { title: "Máquinas & Custos Extras | PrintFlow 2K Lab" },
      { name: "description", content: "Cadastro de impressoras com potência, depreciação por hora, tarifa de energia e insumos extras." },
      { property: "og:title", content: "Máquinas & Custos — PrintFlow" },
      { property: "og:description", content: "Parâmetros de custo que alimentam a calculadora de orçamentos." },
    ],
  }),
  component: Maquinas,
});

function Maquinas() {
  const { printers, extras, settings } = useErp();
  const totalW = printers.reduce((s, p) => s + p.watts, 0);

  return (
    <div>
      <PageHeader title="Máquinas & Custos Extras" subtitle="Parâmetros usados na precificação automática" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tarifa de energia" value={`${brl(settings.energyRate)}/kWh`} icon={Zap} tone="warn" />
        <StatCard label="Potência instalada" value={`${totalW} W`} icon={Zap} tone="info" />
        <StatCard label="Máquinas ativas" value={String(printers.filter((p) => p.status !== "manutencao").length)} icon={Wrench} tone="profit" />
        <StatCard label="Insumos extras" value={String(extras.length)} icon={Package} tone="production" />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <p className="p-4 pb-2 text-sm font-semibold">Impressoras</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead>Watts</TableHead>
                <TableHead className="text-right">Depreciação/h</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap font-medium">{p.name}</TableCell>
                  <TableCell>{p.watts} W</TableCell>
                  <TableCell className="text-right text-production">{brl(p.depreciationPerHour)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <p className="p-4 pb-2 text-sm font-semibold">Insumos & custos extras</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extras.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap font-medium">{e.name}</TableCell>
                  <TableCell className="text-muted-foreground">{e.unit}</TableCell>
                  <TableCell className="text-right text-danger">{brl(e.unitPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}