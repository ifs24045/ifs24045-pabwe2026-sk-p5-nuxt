import type { CashFlowSource, CashFlowType } from "./api/cashFlowApi";

export const TYPE_OPTIONS: { value: CashFlowType; label: string }[] = [
  { value: "inflow", label: "Pemasukan" },
  { value: "outflow", label: "Pengeluaran" },
];

export const SOURCE_OPTIONS: { value: CashFlowSource; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "savings", label: "Tabungan" },
  { value: "loans", label: "Pinjaman" },
];

export function getTypeLabel(type: string): string {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getSourceLabel(source: string): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source;
}