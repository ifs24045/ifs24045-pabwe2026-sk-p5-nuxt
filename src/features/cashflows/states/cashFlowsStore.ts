import { defineStore } from "pinia";
import {
  getCashFlows,
  getCashFlow,
  postCashFlow,
  putCashFlow,
  deleteCashFlow,
  deleteAllCashFlows,
  getCashFlowLabels,
  getCashFlowStatsDaily,
  getCashFlowStatsMonthly,
  type CashFlow,
  type CashFlowStats,
  type CashFlowRawStats,
  type CashFlowSource,
  type CashFlowQueryParams,
  type CashFlowStatsQueryParams,
  type CashFlowStatsSeriesData,
  type CashFlowPayload,
} from "../api/cashFlowApi";

export interface StatsPoint {
  date: string;
  inflow: number;
  outflow: number;
  cashflow: number;
}

export interface CashFlowsState {
  cashFlows: CashFlow[];
  cashFlow: CashFlow | null;
  stats: CashFlowStats;
  labels: string[];
  dailyStats: StatsPoint[];
  monthlyStats: StatsPoint[];

  isCashFlows: boolean;
  isCashFlow: boolean;
  isLabels: boolean;
  isStats: boolean;

  isCashFlowAdd: boolean;
  isCashFlowAdded: boolean;
  isCashFlowChange: boolean;
  isCashFlowChanged: boolean;
  isCashFlowDelete: boolean;
  isCashFlowDeleted: boolean;
  isCashFlowDeleteAll: boolean;
  isCashFlowDeletedAll: boolean;
}

export interface CashFlowActionResult {
  success: boolean;
  message: string;
}

export function createEmptyStats(): CashFlowStats {
  return {
    total_inflow: 0,
    total_outflow: 0,
    cash: 0,
    savings: 0,
    loans: 0,
  };
}

function readStat(raw: CashFlowRawStats | null | undefined, key: string): number {
  const value = Number(raw?.[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/** Saldo satu sumber dana = total pemasukan - total pengeluaran sumber itu. */
function sourceBalance(
  raw: CashFlowRawStats | null | undefined,
  source: CashFlowSource
): number {
  return (
    readStat(raw, `total_inflow_${source}`) -
    readStat(raw, `total_outflow_${source}`)
  );
}

/**
 * API hanya mengirim kunci yang punya data (mis. `total_inflow_cash`),
 * sehingga saldo per sumber dana dihitung di sini dengan nilai bawaan 0.
 */
function normalizeStats(raw?: CashFlowRawStats | null): CashFlowStats {
  return {
    total_inflow: readStat(raw, "total_inflow"),
    total_outflow: readStat(raw, "total_outflow"),
    cash: sourceBalance(raw, "cash"),
    savings: sourceBalance(raw, "savings"),
    loans: sourceBalance(raw, "loans"),
  };
}

/** Menggabungkan stats_inflow, stats_outflow, stats_cashflow menjadi daftar titik per tanggal. */
function normalizeSeries(data?: CashFlowStatsSeriesData | null): StatsPoint[] {
  const inflow = data?.stats_inflow ?? {};
  const outflow = data?.stats_outflow ?? {};
  const cashflow = data?.stats_cashflow ?? {};

  const dates = Array.from(
    new Set([
      ...Object.keys(inflow),
      ...Object.keys(outflow),
      ...Object.keys(cashflow),
    ])
  );

  return dates.map((date) => ({
    date,
    inflow: Number(inflow[date] ?? 0),
    outflow: Number(outflow[date] ?? 0),
    cashflow: Number(cashflow[date] ?? 0),
  }));
}

function normalizeLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) =>
      typeof item === "string" ? item : item?.label ?? item?.name ?? ""
    )
    .filter(Boolean) as string[];
}

function normalizeList<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

export const useCashFlowsStore = defineStore("cashFlows", {
  state: (): CashFlowsState => ({
    cashFlows: [],
    cashFlow: null,
    stats: createEmptyStats(),
    labels: [],
    dailyStats: [],
    monthlyStats: [],

    isCashFlows: false,
    isCashFlow: false,
    isLabels: false,
    isStats: false,

    isCashFlowAdd: false,
    isCashFlowAdded: false,
    isCashFlowChange: false,
    isCashFlowChanged: false,
    isCashFlowDelete: false,
    isCashFlowDeleted: false,
    isCashFlowDeleteAll: false,
    isCashFlowDeletedAll: false,
  }),

  getters: {
    /** Total saldo kas bersih = total pemasukan - total pengeluaran. */
    netBalance: (state): number =>
      state.stats.total_inflow - state.stats.total_outflow,
  },

  actions: {
    /** Mengembalikan seluruh penanda hasil mutasi ke kondisi awal. */
    resetMutationStatus(): void {
      this.isCashFlowAdded = false;
      this.isCashFlowChanged = false;
      this.isCashFlowDeleted = false;
      this.isCashFlowDeletedAll = false;
    },

    async fetchCashFlows(
      params: CashFlowQueryParams = {}
    ): Promise<CashFlowActionResult> {
      this.isCashFlows = true;
      try {
        const response = await getCashFlows(params);
        this.cashFlows = normalizeList<CashFlow>(response.data?.cash_flows);
        this.stats = normalizeStats(response.data?.stats);
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isCashFlows = false;
      }
    },

    async fetchCashFlow(id: string): Promise<CashFlowActionResult> {
      this.isCashFlow = true;
      try {
        const response = await getCashFlow(id);
        this.cashFlow = response.data.cash_flow;
        return { success: true, message: response.message };
      } catch (error) {
        this.cashFlow = null;
        return { success: false, message: (error as Error).message };
      } finally {
        this.isCashFlow = false;
      }
    },

    async fetchLabels(): Promise<CashFlowActionResult> {
      this.isLabels = true;
      try {
        const response = await getCashFlowLabels();
        this.labels = normalizeLabels(response.data?.labels);
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isLabels = false;
      }
    },

    async fetchDailyStats(
      params: CashFlowStatsQueryParams = {}
    ): Promise<CashFlowActionResult> {
      this.isStats = true;
      try {
        const response = await getCashFlowStatsDaily(params);
        this.dailyStats = normalizeSeries(response.data);
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isStats = false;
      }
    },

    async fetchMonthlyStats(
      params: CashFlowStatsQueryParams = {}
    ): Promise<CashFlowActionResult> {
      this.isStats = true;
      try {
        const response = await getCashFlowStatsMonthly(params);
        this.monthlyStats = normalizeSeries(response.data);
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isStats = false;
      }
    },

    async addCashFlow(payload: CashFlowPayload): Promise<CashFlowActionResult> {
      this.isCashFlowAdd = true;
      this.isCashFlowAdded = false;
      try {
        const response = await postCashFlow(payload);
        this.isCashFlowAdded = true;
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isCashFlowAdd = false;
      }
    },

    async changeCashFlow(
      id: string,
      payload: CashFlowPayload
    ): Promise<CashFlowActionResult> {
      this.isCashFlowChange = true;
      this.isCashFlowChanged = false;
      try {
        const response = await putCashFlow(id, payload);
        this.isCashFlowChanged = true;
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isCashFlowChange = false;
      }
    },

    async removeCashFlow(id: string): Promise<CashFlowActionResult> {
      this.isCashFlowDelete = true;
      this.isCashFlowDeleted = false;
      try {
        const response = await deleteCashFlow(id);
        this.isCashFlowDeleted = true;
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isCashFlowDelete = false;
      }
    },

    async removeAllCashFlows(): Promise<CashFlowActionResult> {
      this.isCashFlowDeleteAll = true;
      this.isCashFlowDeletedAll = false;
      try {
        const response = await deleteAllCashFlows();
        this.isCashFlowDeletedAll = true;
        this.cashFlows = [];
        this.stats = createEmptyStats();
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isCashFlowDeleteAll = false;
      }
    },
  },
});