import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/erp/ui-bits";
import { EmptyState, QuickAdd } from "@/components/erp/QuickAdd";
import { RowActions } from "@/components/erp/RowActions";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo de Produtos | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Produtos recorrentes com peso, tempo de impressão e preço pré-salvos para orçar em segundos.",
      },
      { property: "og:title", content: "Catálogo de Produtos — VisionFlow ERP" },
      {
        property: "og:description",
        content: "Peças recorrentes da farm 3D com tempos e pesos salvos.",
      },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const { products, addProduct, updateProduct, deleteProduct } = useErp();
  return (
    <div>
      <PageHeader
        title="Catálogo de Produtos"
        subtitle="Peças recorrentes com tempos e pesos pré-salvos"
        action={
          <QuickAdd
            trigger="Novo produto"
            title="Cadastrar produto"
            successMessage="Produto cadastrado!"
            fields={[
              { key: "name", label: "Nome", placeholder: "Luminária Moon 15cm" },
              { key: "category", label: "Categoria", placeholder: "Decoração" },
              { key: "weightG", label: "Peso (g)", numeric: true, defaultValue: "100" },
              { key: "hours", label: "Tempo (h)", numeric: true, defaultValue: "4" },
              { key: "price", label: "Preço (R$)", numeric: true, defaultValue: "99.9" },
              { key: "imageUrl", label: "Foto do produto", image: true },
            ]}
            onSubmit={(v) =>
              addProduct({
                name: v["name"] || "Novo produto",
                category: v["category"] || "Geral",
                weightG: Number(v["weightG"]) || 0,
                hours: Number(v["hours"]) || 0,
                price: Number(v["price"]) || 0,
                imageUrl: v["imageUrl"] || null,
              })
            }
          />
        }
      />
      {products.length === 0 && (
        <EmptyState text="Catálogo vazio. Cadastre seus produtos recorrentes." />
      )}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Tempo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-right">Receita gerada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap font-medium">
                  <span className="inline-flex items-center gap-2">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-9 w-9 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background/60">
                        <Package className="h-4 w-4 text-production" />
                      </span>
                    )}
                    {p.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.category}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{p.weightG}g</TableCell>
                <TableCell className="whitespace-nowrap">{p.hours}h</TableCell>
                <TableCell className="whitespace-nowrap">{brl(p.price)}</TableCell>
                <TableCell className="whitespace-nowrap text-right font-semibold text-profit">
                  {brl(p.price * p.sold)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <RowActions
                      compact
                      title="produto"
                      deleteLabel={p.name}
                      fields={[
                        { key: "name", label: "Nome" },
                        { key: "category", label: "Categoria" },
                        { key: "weightG", label: "Peso (g)", numeric: true },
                        { key: "hours", label: "Tempo (h)", numeric: true },
                        { key: "price", label: "Preço (R$)", numeric: true },
                        { key: "sold", label: "Unidades vendidas", numeric: true },
                        { key: "imageUrl", label: "Foto do produto", image: true },
                      ]}
                      values={{
                        name: p.name,
                        category: p.category,
                        weightG: String(p.weightG),
                        hours: String(p.hours),
                        price: String(p.price),
                        sold: String(p.sold),
                        imageUrl: p.imageUrl ?? "",
                      }}
                      onSave={(v) =>
                        updateProduct(p.id, {
                          name: v["name"] ?? p.name,
                          category: v["category"] ?? p.category,
                          weightG: Number(v["weightG"]) || 0,
                          hours: Number(v["hours"]) || 0,
                          price: Number(v["price"]) || 0,
                          sold: Number(v["sold"]) || 0,
                          imageUrl: v["imageUrl"] || null,
                        })
                      }
                      onDelete={() => deleteProduct(p.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
