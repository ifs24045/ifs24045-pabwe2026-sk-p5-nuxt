import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createEmptyStats, useCashFlowsStore } from "./cashFlowsStore";
import * as api from "../api/cashFlowApi";

vi.mock("../api/cashFlowApi", () => ({
  getCashFlows: vi.fn(),
  getCashFlow: vi.fn(),
  postCashFlow: vi.fn(),
  putCashFlow: vi.fn(),
  deleteCashFlow: vi.fn(),
  deleteAllCashFlows: vi.fn(),
  getCashFlowLabels: vi.fn(),
  getCashFlowStatsDaily: vi.fn(),
  getCashFlowStatsMonthly: vi.fn(),
}));

const m = vi.mocked(api);

const payload: api.CashFlowPayload = {
  type: "inflow",
  source: "cash",
  label: "Gaji",
  nominal: 1000,
  description: "x",
};

const item: api.CashFlow = { id: "1", ...payload };

const ok = (data: any, message = "ok"): any => ({
  success: true,
  message,
  data,
});

beforeEach(() => {
  setActivePinia(createPinia());
  Object.values(m).forEach((fn) => (fn as any).mockReset());
});

describe("state awal", () => {
  it("memiliki nilai awal yang kosong", () => {
    const store = useCashFlowsStore();
    expect(store.cashFlows).toEqual([]);
    expect(store.cashFlow).toBeNull();
    expect(store.stats).toEqual(createEmptyStats());
    expect(store.netBalance).toBe(0);
    expect(store.isCashFlowAdd).toBe(false);
  });

  it("netBalance = total inflow - total outflow", () => {
    const store = useCashFlowsStore();
    store.stats.total_inflow = 900;
    store.stats.total_outflow = 400;
    expect(store.netBalance).toBe(500);
  });

  it("resetMutationStatus mengembalikan penanda hasil mutasi", () => {
    const store = useCashFlowsStore();
    store.isCashFlowAdded = true;
    store.isCashFlowChanged = true;
    store.isCashFlowDeleted = true;
    store.isCashFlowDeletedAll = true;
    store.resetMutationStatus();
    expect(store.isCashFlowAdded).toBe(false);
    expect(store.isCashFlowChanged).toBe(false);
    expect(store.isCashFlowDeleted).toBe(false);
    expect(store.isCashFlowDeletedAll).toBe(false);
  });
});

describe("fetchCashFlows", () => {
  it("menyimpan daftar dan menormalisasi stats", async () => {
    m.getCashFlows.mockResolvedValue(
      ok({
        cash_flows: [item],
        stats: {
          total_inflow: 1000,
          total_outflow: 300,
          total_inflow_cash: 800,
          total_outflow_cash: 100,
          total_inflow_savings: 200,
          total_outflow_loans: 200,
          total_inflow_loans: "bukan-angka",
        },
      })
    );
    const store = useCashFlowsStore();

    const result = await store.fetchCashFlows({ type: "inflow" });

    expect(m.getCashFlows).toHaveBeenCalledWith({ type: "inflow" });
    expect(result).toEqual({ success: true, message: "ok" });
    expect(store.cashFlows).toEqual([item]);
    expect(store.stats).toEqual({
      total_inflow: 1000,
      total_outflow: 300,
      cash: 700,
      savings: 200,
      loans: -200,
    });
    expect(store.isCashFlows).toBe(false);
  });

  it("memakai nilai kosong bila data tidak lengkap", async () => {
    m.getCashFlows.mockResolvedValue(ok({ cash_flows: null }));
    const store = useCashFlowsStore();
    store.cashFlows = [item];

    await store.fetchCashFlows();

    expect(m.getCashFlows).toHaveBeenCalledWith({});
    expect(store.cashFlows).toEqual([]);
    expect(store.stats).toEqual(createEmptyStats());
  });

  it("menangani respons tanpa data sama sekali", async () => {
    m.getCashFlows.mockResolvedValue({ success: true, message: "ok" } as any);
    const store = useCashFlowsStore();
    const result = await store.fetchCashFlows();
    expect(result.success).toBe(true);
    expect(store.cashFlows).toEqual([]);
  });

  it("mengembalikan pesan error saat gagal", async () => {
    m.getCashFlows.mockRejectedValue(new Error("Gagal memuat"));
    const store = useCashFlowsStore();
    const result = await store.fetchCashFlows();
    expect(result).toEqual({ success: false, message: "Gagal memuat" });
    expect(store.isCashFlows).toBe(false);
  });
});

describe("fetchCashFlow", () => {
  it("menyimpan detail", async () => {
    m.getCashFlow.mockResolvedValue(ok({ cash_flow: item }));
    const store = useCashFlowsStore();
    const result = await store.fetchCashFlow("1");
    expect(m.getCashFlow).toHaveBeenCalledWith("1");
    expect(result.success).toBe(true);
    expect(store.cashFlow).toEqual(item);
    expect(store.isCashFlow).toBe(false);
  });

  it("mengosongkan detail saat gagal", async () => {
    m.getCashFlow.mockRejectedValue(new Error("Tidak ada"));
    const store = useCashFlowsStore();
    store.cashFlow = item;
    const result = await store.fetchCashFlow("9");
    expect(result).toEqual({ success: false, message: "Tidak ada" });
    expect(store.cashFlow).toBeNull();
  });
});

describe("fetchLabels", () => {
  it("menormalisasi label berupa string maupun objek", async () => {
    m.getCashFlowLabels.mockResolvedValue(
      ok({
        labels: [
          "Gaji",
          { label: "Makan" },
          { name: "Transport" },
          { other: 1 },
          "",
        ],
      })
    );
    const store = useCashFlowsStore();
    const result = await store.fetchLabels();
    expect(result.success).toBe(true);
    expect(store.labels).toEqual(["Gaji", "Makan", "Transport"]);
    expect(store.isLabels).toBe(false);
  });

  it("menghasilkan daftar kosong bila labels bukan array", async () => {
    m.getCashFlowLabels.mockResolvedValue(ok({ labels: "x" }));
    const store = useCashFlowsStore();
    await store.fetchLabels();
    expect(store.labels).toEqual([]);
  });

  it("menghasilkan daftar kosong bila data tidak ada", async () => {
    m.getCashFlowLabels.mockResolvedValue({ success: true, message: "ok" } as any);
    const store = useCashFlowsStore();
    await store.fetchLabels();
    expect(store.labels).toEqual([]);
  });

  it("mengembalikan pesan error saat gagal", async () => {
    m.getCashFlowLabels.mockRejectedValue(new Error("Gagal label"));
    const store = useCashFlowsStore();
    const result = await store.fetchLabels();
    expect(result).toEqual({ success: false, message: "Gagal label" });
    expect(store.isLabels).toBe(false);
  });
});

describe("statistik harian & bulanan", () => {
  const series = {
    stats_inflow: { "2026-01-01": 100, "2026-01-02": 50 },
    stats_outflow: { "2026-01-01": 30 },
    stats_cashflow: { "2026-01-03": 70 },
  };

  it("fetchDailyStats menggabungkan seri per tanggal", async () => {
    m.getCashFlowStatsDaily.mockResolvedValue(ok(series));
    const store = useCashFlowsStore();
    const result = await store.fetchDailyStats({ total_data: 3 });
    expect(m.getCashFlowStatsDaily).toHaveBeenCalledWith({ total_data: 3 });
    expect(result.success).toBe(true);
    expect(store.dailyStats).toEqual([
      { date: "2026-01-01", inflow: 100, outflow: 30, cashflow: 0 },
      { date: "2026-01-02", inflow: 50, outflow: 0, cashflow: 0 },
      { date: "2026-01-03", inflow: 0, outflow: 0, cashflow: 70 },
    ]);
    expect(store.isStats).toBe(false);
  });

  it("fetchDailyStats memakai params bawaan dan data kosong", async () => {
    m.getCashFlowStatsDaily.mockResolvedValue({ success: true, message: "ok" } as any);
    const store = useCashFlowsStore();
    await store.fetchDailyStats();
    expect(m.getCashFlowStatsDaily).toHaveBeenCalledWith({});
    expect(store.dailyStats).toEqual([]);
  });

  it("fetchDailyStats mengembalikan error saat gagal", async () => {
    m.getCashFlowStatsDaily.mockRejectedValue(new Error("Gagal harian"));
    const store = useCashFlowsStore();
    const result = await store.fetchDailyStats();
    expect(result).toEqual({ success: false, message: "Gagal harian" });
    expect(store.isStats).toBe(false);
  });

  it("fetchMonthlyStats menggabungkan seri per bulan", async () => {
    m.getCashFlowStatsMonthly.mockResolvedValue(ok(series));
    const store = useCashFlowsStore();
    const result = await store.fetchMonthlyStats({ total_data: 3 });
    expect(m.getCashFlowStatsMonthly).toHaveBeenCalledWith({ total_data: 3 });
    expect(result.success).toBe(true);
    expect(store.monthlyStats).toHaveLength(3);
  });

  it("fetchMonthlyStats memakai params bawaan dan data kosong", async () => {
    m.getCashFlowStatsMonthly.mockResolvedValue({ success: true, message: "ok" } as any);
    const store = useCashFlowsStore();
    await store.fetchMonthlyStats();
    expect(m.getCashFlowStatsMonthly).toHaveBeenCalledWith({});
    expect(store.monthlyStats).toEqual([]);
  });

  it("fetchMonthlyStats mengembalikan error saat gagal", async () => {
    m.getCashFlowStatsMonthly.mockRejectedValue(new Error("Gagal bulanan"));
    const store = useCashFlowsStore();
    const result = await store.fetchMonthlyStats();
    expect(result).toEqual({ success: false, message: "Gagal bulanan" });
    expect(store.isStats).toBe(false);
  });
});

describe("mutasi", () => {
  it("addCashFlow berhasil", async () => {
    m.postCashFlow.mockResolvedValue(ok({ cash_flow_id: "9" }, "Ditambah"));
    const store = useCashFlowsStore();
    const result = await store.addCashFlow(payload);
    expect(m.postCashFlow).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, message: "Ditambah" });
    expect(store.isCashFlowAdded).toBe(true);
    expect(store.isCashFlowAdd).toBe(false);
  });

  it("addCashFlow gagal", async () => {
    m.postCashFlow.mockRejectedValue(new Error("Gagal tambah"));
    const store = useCashFlowsStore();
    store.isCashFlowAdded = true;
    const result = await store.addCashFlow(payload);
    expect(result).toEqual({ success: false, message: "Gagal tambah" });
    expect(store.isCashFlowAdded).toBe(false);
    expect(store.isCashFlowAdd).toBe(false);
  });

  it("changeCashFlow berhasil", async () => {
    m.putCashFlow.mockResolvedValue(ok(null, "Diubah"));
    const store = useCashFlowsStore();
    const result = await store.changeCashFlow("1", payload);
    expect(m.putCashFlow).toHaveBeenCalledWith("1", payload);
    expect(result).toEqual({ success: true, message: "Diubah" });
    expect(store.isCashFlowChanged).toBe(true);
    expect(store.isCashFlowChange).toBe(false);
  });

  it("changeCashFlow gagal", async () => {
    m.putCashFlow.mockRejectedValue(new Error("Gagal ubah"));
    const store = useCashFlowsStore();
    const result = await store.changeCashFlow("1", payload);
    expect(result).toEqual({ success: false, message: "Gagal ubah" });
    expect(store.isCashFlowChanged).toBe(false);
  });

  it("removeCashFlow berhasil", async () => {
    m.deleteCashFlow.mockResolvedValue(ok(null, "Dihapus"));
    const store = useCashFlowsStore();
    const result = await store.removeCashFlow("1");
    expect(m.deleteCashFlow).toHaveBeenCalledWith("1");
    expect(result).toEqual({ success: true, message: "Dihapus" });
    expect(store.isCashFlowDeleted).toBe(true);
    expect(store.isCashFlowDelete).toBe(false);
  });

  it("removeCashFlow gagal", async () => {
    m.deleteCashFlow.mockRejectedValue(new Error("Gagal hapus"));
    const store = useCashFlowsStore();
    const result = await store.removeCashFlow("1");
    expect(result).toEqual({ success: false, message: "Gagal hapus" });
    expect(store.isCashFlowDeleted).toBe(false);
  });

  it("removeAllCashFlows mengosongkan daftar dan stats", async () => {
    m.deleteAllCashFlows.mockResolvedValue(ok(null, "Direset"));
    const store = useCashFlowsStore();
    store.cashFlows = [item];
    store.stats.total_inflow = 99;
    const result = await store.removeAllCashFlows();
    expect(result).toEqual({ success: true, message: "Direset" });
    expect(store.cashFlows).toEqual([]);
    expect(store.stats).toEqual(createEmptyStats());
    expect(store.isCashFlowDeletedAll).toBe(true);
    expect(store.isCashFlowDeleteAll).toBe(false);
  });

  it("removeAllCashFlows gagal mempertahankan data", async () => {
    m.deleteAllCashFlows.mockRejectedValue(new Error("Gagal reset"));
    const store = useCashFlowsStore();
    store.cashFlows = [item];
    const result = await store.removeAllCashFlows();
    expect(result).toEqual({ success: false, message: "Gagal reset" });
    expect(store.cashFlows).toEqual([item]);
    expect(store.isCashFlowDeletedAll).toBe(false);
  });
});