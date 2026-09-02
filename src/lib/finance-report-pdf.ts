import { jsPDF } from "jspdf";

export interface FinanceReportData {
  company: string;
  cnpj: string;
  phone?: string;
  logoUrl?: string | null;
  periodLabel: string;
  received: number;
  paid: number;
  toReceive: number;
  toPay: number;
  costsByCategory: { name: string; value: number }[];
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function buildFinanceReportPdf(data: FinanceReportData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 42;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 92, "F");
  if (data.logoUrl) {
    try {
      doc.addImage(data.logoUrl, M, 24, 44, 44, undefined, "FAST");
    } catch {
      // logo inválida — segue sem imagem
    }
  }
  const textX = data.logoUrl ? M + 58 : M;
  doc.setTextColor(241, 245, 249).setFont("helvetica", "bold").setFontSize(18);
  doc.text(data.company || "PrintFlow — 2K Lab", textX, 45);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(148, 163, 184);
  doc.text(
    `Relatório de Custo e Lucro${data.cnpj ? ` · CNPJ ${data.cnpj}` : ""}${data.phone ? ` · ${data.phone}` : ""}`,
    textX,
    62,
  );
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, W - M, 45, {
    align: "right",
  });

  let y = 130;
  doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(12);
  doc.text(`Período: ${data.periodLabel}`, M, y);

  y += 26;
  const lines: [string, number, [number, number, number]][] = [
    ["(+) Total recebido", data.received, [21, 128, 61]],
    ["(-) Custos de produção / despesas pagas", data.paid, [185, 28, 28]],
    ["(=) Lucro líquido do período", data.received - data.paid, [15, 23, 42]],
    ["Pendente a receber", data.toReceive, [30, 64, 175]],
    ["Pendente a pagar", data.toPay, [180, 83, 9]],
  ];
  doc.setFontSize(11);
  for (const [label, value, color] of lines) {
    doc.setFont("helvetica", label.startsWith("(=)") ? "bold" : "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(label, M, y);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(brl(value), W - M, y, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.line(M, y + 7, W - M, y + 7);
    y += 26;
  }

  y += 18;
  doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(12);
  doc.text("Custos por categoria", M, y);
  y += 20;
  doc.setFont("helvetica", "normal").setFontSize(10);
  if (!data.costsByCategory.length) {
    doc.setTextColor(100, 116, 139);
    doc.text("Nenhuma despesa registrada no período.", M, y);
  } else {
    for (const c of data.costsByCategory) {
      doc.setTextColor(15, 23, 42);
      doc.text(c.name || "Sem categoria", M, y);
      doc.text(brl(c.value), W - M, y, { align: "right" });
      y += 18;
    }
  }

  doc.setTextColor(148, 163, 184).setFontSize(9);
  doc.text(
    "Documento gerado automaticamente pelo PrintFlow.",
    M,
    doc.internal.pageSize.getHeight() - 40,
  );

  return doc;
}
