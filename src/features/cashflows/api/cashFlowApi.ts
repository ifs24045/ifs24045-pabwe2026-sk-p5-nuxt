import { fetchApi } from "../../../helpers/apiHelper";

export type CashFlowType = "inflow" | "outflow";
export type CashFlowSource = "cash" | "savings" | "loans";

export interface CashFlow {
  id: string;
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  nominal: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

/** Ringkasan saldo yang sudah dinormalisasi dan dipakai oleh UI. */
export interface CashFlowStats {
  total_inflow: number;
  total_outflow: number;
  cash: number;
  savings: number;
  loans: number;
}

/**
 * Bentuk asli `data.stats` dari GET /cash-flows: kunci datar dan dinamis,
 * contoh: `total_inflow`, `total_inflow_cash`, `total_outflow_savings`.
 * Kunci hanya muncul bila ada datanya.
 */
export type CashFlowRawStats = Record<string, number>;

export interface CashFlowQueryParams {
  type?: CashFlowType | "";
  source?: CashFlowSource | "";
  label?: string;
  start_date?: string;
  end_date?: string;
}

export interface CashFlowPayload {
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  nominal: number;
  description: string;
}

export interface CashFlowsData {
  cash_flows: CashFlow[];
  stats?: CashFlowRawStats;
}

export interface CashFlowData {
  cash_flow: CashFlow;
}

export interface CashFlowLabelsData {
  labels: Array<string | { label?: string; name?: string }>;
}

export interface CashFlowStatsQueryParams {
  end_date?: string;
  total_data?: number;
}

/** Bentuk asli respons stats harian/bulanan: objek yang kuncinya tanggal. */
export interface CashFlowStatsSeriesData {
  stats_inflow?: Record<string, number>;
  stats_outflow?: Record<string, number>;
  stats_cashflow?: Record<string, number>;
}

export function getCashFlows(params: CashFlowQueryParams = {}) {
  return fetchApi<CashFlowsData>("/cash-flows", { params: { ...params } });
}

export function getCashFlow(id: string) {
  return fetchApi<CashFlowData>(`/cash-flows/${id}`);
}

export function postCashFlow(payload: CashFlowPayload) {
  return fetchApi<{ cash_flow_id?: string }>("/cash-flows", {
    method: "POST",
    body: { ...payload },
  });
}

export function putCashFlow(id: string, payload: CashFlowPayload) {
  return fetchApi<null>(`/cash-flows/${id}`, {
    method: "PUT",
    body: { ...payload },
  });
}

export function deleteCashFlow(id: string) {
  return fetchApi<null>(`/cash-flows/${id}`, { method: "DELETE" });
}

export function deleteAllCashFlows() {
  return fetchApi<null>("/cash-flows", { method: "DELETE" });
}

export function getCashFlowLabels() {
  return fetchApi<CashFlowLabelsData>("/cash-flows/labels");
}

export function getCashFlowStatsDaily(params: CashFlowStatsQueryParams = {}) {
  return fetchApi<CashFlowStatsSeriesData>("/cash-flows/stats/daily", {
    params: { ...params },
  });
}

export function getCashFlowStatsMonthly(
  params: CashFlowStatsQueryParams = {}
) {
  return fetchApi<CashFlowStatsSeriesData>("/cash-flows/stats/monthly", {
    params: { ...params },
  });
}