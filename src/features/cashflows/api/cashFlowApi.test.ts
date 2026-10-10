import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteAllCashFlows,
  deleteCashFlow,
  getCashFlow,
  getCashFlowLabels,
  getCashFlowStatsDaily,
  getCashFlowStatsMonthly,
  getCashFlows,
  postCashFlow,
  putCashFlow,
  type CashFlowPayload,
} from "./cashFlowApi";
import { fetchApi } from "../../../helpers/apiHelper";

vi.mock("../../../helpers/apiHelper", () => ({
  fetchApi: vi.fn(),
}));

const fetchApiMock = vi.mocked(fetchApi);

const payload: CashFlowPayload = {
  type: "inflow",
  source: "cash",
  label: "Gaji",
  nominal: 5000000,
  description: "Gaji bulanan",
};

beforeEach(() => {
  fetchApiMock.mockReset();
  fetchApiMock.mockResolvedValue({ success: true, message: "ok", data: {} });
});

describe("pemanggilan API cash flows", () => {
  it("getCashFlows tanpa parameter memanggil GET /cash-flows", async () => {
    await getCashFlows();
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows", { params: {} });
  });

  it("getCashFlows meneruskan filter sebagai query params", async () => {
    const params = {
      type: "outflow" as const,
      source: "savings" as const,
      label: "Makan",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    };
    await getCashFlows(params);
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows", { params });
  });

  it("getCashFlow memanggil GET /cash-flows/:id", async () => {
    await getCashFlow("abc");
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/abc");
  });

  it("postCashFlow memanggil POST /cash-flows dengan body", async () => {
    await postCashFlow(payload);
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows", {
      method: "POST",
      body: payload,
    });
  });

  it("putCashFlow memanggil PUT /cash-flows/:id dengan body", async () => {
    await putCashFlow("abc", payload);
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/abc", {
      method: "PUT",
      body: payload,
    });
  });

  it("deleteCashFlow memanggil DELETE /cash-flows/:id", async () => {
    await deleteCashFlow("abc");
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/abc", {
      method: "DELETE",
    });
  });

  it("deleteAllCashFlows memanggil DELETE /cash-flows", async () => {
    await deleteAllCashFlows();
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows", {
      method: "DELETE",
    });
  });

  it("getCashFlowLabels memanggil GET /cash-flows/labels", async () => {
    await getCashFlowLabels();
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/labels");
  });

  it("getCashFlowStatsDaily memakai params bawaan kosong", async () => {
    await getCashFlowStatsDaily();
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/stats/daily", {
      params: {},
    });
  });

  it("getCashFlowStatsDaily meneruskan params", async () => {
    await getCashFlowStatsDaily({ end_date: "2026-01-31", total_data: 7 });
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/stats/daily", {
      params: { end_date: "2026-01-31", total_data: 7 },
    });
  });

  it("getCashFlowStatsMonthly memakai params bawaan kosong", async () => {
    await getCashFlowStatsMonthly();
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/stats/monthly", {
      params: {},
    });
  });

  it("getCashFlowStatsMonthly meneruskan params", async () => {
    await getCashFlowStatsMonthly({ total_data: 6 });
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/stats/monthly", {
      params: { total_data: 6 },
    });
  });
});