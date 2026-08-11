export type PrinterStatus = "disponivel" | "imprimindo" | "aguardando" | "manutencao";

export interface Printer {
  id: string;
  name: string;
  model: string;
  watts: number;
  depreciationPerHour: number;
  status: PrinterStatus;
  currentFile?: string | undefined;
  progress?: number | undefined;
  remainingMin?: number | undefined;
  hoursRun: number;
  failures: number;
}

export interface Filament {
  id: string;
  brand: string;
  type: "PLA" | "PETG" | "ABS" | "TPU" | "Silk" | "ASA";
  color: string;
  hex: string;
  totalG: number;
  remainingG: number;
  pricePerKg: number;
}

export type OrderStage =
  | "orcamento"
  | "aprovado"
  | "fila"
  | "impressao"
  | "pos"
  | "envio"
  | "concluido";

export interface Order {
  id: string;
  ref: string;
  client: string;
  title: string;
  value: number;
  cost: number;
  stage: OrderStage;
  date: string;
  channel: string;
  priority: "alta" | "media" | "baixa";
  weightG: number;
  hours: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  weightG: number;
  hours: number;
  price: number;
  sold: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  city: string;
  orders: number;
  total: number;
}

export interface Failure {
  id: string;
  printerId: string;
  filamentId: string;
  lostG: number;
  reason: string;
  notes: string;
  date: string;
  cost: number;
}

export interface ExtraCost {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
}

export interface Settings {
  company: string;
  cnpj: string;
  energyRate: number;
  defaultMargin: number;
  failureRate: number;
}

export type FinanceKind = "receivable" | "payable";

export interface FinanceEntry {
  id: string;
  kind: FinanceKind;
  description: string;
  party: string;
  amount: number;
  dueDate: string;
  status: "pendente" | "pago";
  category: string;
}