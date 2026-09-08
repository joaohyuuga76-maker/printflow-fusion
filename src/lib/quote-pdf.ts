import { jsPDF } from "jspdf";

export interface QuotePdfData {
  company: string;
  cnpj: string;
  phone?: string;
  pixKey?: string;
  logoUrl?: string | null;
  client: string;
  contact: string;
  items: {
    name: string;
    qty: number;
    hours: string;
    material: string;
    price: number;
  }[];
  total: number;
  production?: {
    totalHours: string;
    totalWeight: string;
    unitHours: string;
    unitWeight: string;
    unitPrice: number;
    discount: number;
  };
  payment: string;
  deadline: string;
  validity: string;
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function buildQuotePdf(data: QuotePdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 42;

  // Cabeçalho
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 92, "F");
  if (data.logoUrl) {
    try {
      doc.addImage(data.logoUrl, M, 24, 44, 44, undefined, "FAST");
    } catch {
      // logo inválida — segue sem imagem
    }
  } else {
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(M, 26, 40, 40, 10, 10, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.text("2K", M + 20, 52, { align: "center" });
  }

  doc.setTextColor(241, 245, 249);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.company || "VisionFlow ERP", M + 58, 45);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Impressão 3D sob demanda${data.cnpj ? ` · CNPJ ${data.cnpj}` : ""}${data.phone ? ` · ${data.phone}` : ""}`,
    M + 58,
    62,
  );
  doc.text(
    `Orçamento emitido em ${new Date().toLocaleDateString("pt-BR")}`,
    W - M,
    45,
    { align: "right" },
  );

  let y = 128;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold").setFontSize(12);
  doc.text("Dados do cliente", M, y);
  y += 18;
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Cliente: ${data.client || "—"}`, M, y);
  y += 15;
  doc.text(`Contato: ${data.contact || "—"}`, M, y);

  // Tabela
  y += 32;
  const cols = [M, M + 190, M + 245, M + 320, W - M];
  doc.setFillColor(30, 41, 59);
  doc.rect(M, y - 14, W - M * 2, 22, "F");
  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold").setFontSize(9);
  doc.text("Peça / Modelo", cols[0]! + 8, y);
  doc.text("Qtd", cols[1]!, y);
  doc.text("Tempo", cols[2]!, y);
  doc.text("Material", cols[3]!, y);
  doc.text("Valor", cols[4]! - 8, y, { align: "right" });

  y += 24;
  doc.setTextColor(15, 23, 42).setFont("helvetica", "normal").setFontSize(10);
  for (const it of data.items) {
    doc.text(doc.splitTextToSize(it.name, 175)[0] ?? "", cols[0]! + 8, y);
    doc.text(String(it.qty), cols[1]!, y);
    doc.text(it.hours, cols[2]!, y);
    doc.text(doc.splitTextToSize(it.material, 120)[0] ?? "", cols[3]!, y);
    doc.text(brl(it.price), cols[4]! - 8, y, { align: "right" });
    y += 20;
    doc.setDrawColor(226, 232, 240);
    doc.line(M, y - 12, W - M, y - 12);
  }

  y += 12;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(W - M - 220, y - 18, 220, 38, 8, 8, "F");
  doc.setFont("helvetica", "bold").setFontSize(13);
  doc.setTextColor(21, 128, 61);
  doc.text(`Total: ${brl(data.total)}`, W - M - 12, y + 6, { align: "right" });

  y += 62;
  doc.setTextColor(15, 23, 42).setFontSize(12);
  doc.text("Condições comerciais", M, y);
  y += 18;
  doc.setFont("helvetica", "normal").setFontSize(10);
  for (const line of [
    `Pagamento: ${data.payment}`,
    ...(data.pixKey ? [`Chave Pix: ${data.pixKey}`] : []),
    `Prazo de entrega: ${data.deadline}`,
    `Validade da proposta: ${data.validity}`,
  ]) {
    doc.text(line, M, y);
    y += 16;
  }

  doc.setTextColor(148, 163, 184).setFontSize(9);
  doc.text(
    "Obrigado pela preferência! Documento gerado automaticamente pelo VisionFlow ERP.",
    M,
    doc.internal.pageSize.getHeight() - 40,
  );

  return doc;
}
