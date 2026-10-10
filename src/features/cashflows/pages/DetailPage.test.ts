import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises } from "@vue/test-utils";
import type { RouteRecordRaw } from "vue-router";
import DetailPage from "./DetailPage.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import type { CashFlow } from "../api/cashFlowApi";
import {
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return {
    ...actual,
    showConfirmDialog: vi.fn(),
    showSuccessDialog: vi.fn().mockResolvedValue({}),
    showErrorDialog: vi.fn().mockResolvedValue({}),
  };
});

const confirmMock = vi.mocked(showConfirmDialog);
const successMock = vi.mocked(showSuccessDialog);
const errorMock = vi.mocked(showErrorDialog);

const Blank = defineComponent({ render: () => h("div") });
const routes: RouteRecordRaw[] = [
  { path: "/", component: Blank },
  { path: "/cash-flows/:cashFlowId", component: DetailPage },
];

const inflow: CashFlow = {
  id: "cf-1",
  type: "inflow",
  source: "cash",
  label: "Gaji",
  nominal: 5000000,
  description: "Gaji bulanan",
  created_at: "2026-01-15T12:00:00Z",
  updated_at: "2026-01-16T12:00:00Z",
};

const outflow: CashFlow = {
  ...inflow,
  id: "cf-2",
  type: "outflow",
  source: "loans",
  label: "Cicilan",
  description: "",
};

beforeEach(() => {
  confirmMock.mockReset();
  successMock.mockClear();
  errorMock.mockClear();
});

async function renderPage(
  fetchResult: any = { success: true, message: "ok" },
  detail: CashFlow | null = inflow
) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore();
  const fetchCashFlow = vi
    .spyOn(store, "fetchCashFlow")
    .mockImplementation(async () => {
      store.cashFlow = fetchResult.success ? detail : null;
      return fetchResult;
    });
  const fetchLabels = vi
    .spyOn(store, "fetchLabels")
    .mockResolvedValue({ success: true, message: "ok" });
  const result = await renderWithProviders(DetailPage, {
    pinia,
    routes,
    route: `/cash-flows/${detail?.id ?? "x"}`,
  });
  await flushPromises();
  return { ...result, store, fetchCashFlow, fetchLabels };
}

describe("DetailPage", () => {
  it("memuat detail dan label berdasarkan id pada rute", async () => {
    const { fetchCashFlow, fetchLabels } = await renderPage();
    expect(fetchCashFlow).toHaveBeenCalledWith("cf-1");
    expect(fetchLabels).toHaveBeenCalled();
  });

  it("menampilkan rincian pemasukan", async () => {
    const { wrapper } = await renderPage();
    expect(wrapper.find("h1").text()).toBe("Gaji");
    expect(wrapper.text()).toContain("Pemasukan");
    expect(wrapper.text()).toContain("Tunai");
    expect(wrapper.text()).toContain("Gaji bulanan");
    expect(wrapper.text()).toMatch(/\+\sRp\s5\.000\.000/);
    expect(wrapper.text()).toMatch(/Januari 2026/);
    expect(wrapper.find("article > div").classes()).toContain("bg-emerald-50");
  });

  it("menampilkan rincian pengeluaran dan tanda strip untuk keterangan kosong", async () => {
    const { wrapper } = await renderPage({ success: true, message: "ok" }, outflow);
    expect(wrapper.text()).toContain("Pengeluaran");
    expect(wrapper.text()).toContain("Pinjaman");
    expect(wrapper.text()).toMatch(/-\sRp\s5\.000\.000/);
    expect(wrapper.find("article > div").classes()).toContain("bg-red-50");
    expect(wrapper.find("dd.whitespace-pre-line").text()).toBe("-");
  });

  it("menampilkan skeleton saat memuat tanpa data", async () => {
    const pinia = createMockPinia();
    const store = useCashFlowsStore();
    vi.spyOn(store, "fetchCashFlow").mockImplementation(
      () => new Promise(() => {})
    );
    vi.spyOn(store, "fetchLabels").mockResolvedValue({
      success: true,
      message: "ok",
    });
    const { wrapper } = await renderWithProviders(DetailPage, {
      pinia,
      routes,
      route: "/cash-flows/cf-1",
    });
    store.isCashFlow = true;
    await flushPromises();
    expect(wrapper.find(".animate-pulse").exists()).toBe(true);
  });

  it("menampilkan pesan error dari server bila gagal memuat", async () => {
    const { wrapper } = await renderPage(
      { success: false, message: "Data tidak ada" },
      null
    );
    expect(wrapper.text()).toContain("Transaksi tidak ditemukan");
    expect(wrapper.text()).toContain("Data tidak ada");
  });

  it("menampilkan pesan bawaan bila tidak ada pesan error", async () => {
    const { wrapper } = await renderPage({ success: false, message: "" }, null);
    expect(wrapper.text()).toContain("Data transaksi tidak tersedia.");
  });

  it("membuka modal ubah dan memuat ulang setelah disimpan", async () => {
    const { wrapper, fetchCashFlow } = await renderPage();
    const edit = wrapper.findAll("button").find((b) => b.text() === "Ubah")!;
    await edit.trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    const store = useCashFlowsStore();
    vi.spyOn(store, "changeCashFlow").mockResolvedValue({
      success: true,
      message: "Diperbarui",
    });
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(fetchCashFlow).toHaveBeenCalledTimes(2);
  });

  it("menutup modal ubah saat dibatalkan", async () => {
    const { wrapper } = await renderPage();
    await wrapper.findAll("button").find((b) => b.text() === "Ubah")!.trigger("click");
    await wrapper.find('button[aria-label="Tutup"]').trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("tidak menghapus bila konfirmasi dibatalkan", async () => {
    confirmMock.mockResolvedValue(false);
    const { wrapper, store } = await renderPage();
    const remove = vi.spyOn(store, "removeCashFlow");
    await wrapper.find(".btn-danger").trigger("click");
    await flushPromises();
    expect(confirmMock).toHaveBeenCalledWith(
      "Transaksi ini akan dihapus permanen.",
      "Hapus transaksi?",
      "Ya, hapus"
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("menghapus lalu kembali ke beranda", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store, router } = await renderPage();
    const remove = vi.spyOn(store, "removeCashFlow").mockResolvedValue({
      success: true,
      message: "Dihapus",
    });
    await wrapper.find(".btn-danger").trigger("click");
    await flushPromises();
    expect(remove).toHaveBeenCalledWith("cf-1");
    expect(successMock).toHaveBeenCalledWith("Dihapus");
    expect(router.currentRoute.value.fullPath).toBe("/");
  });

  it("memakai pesan hapus bawaan", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store } = await renderPage();
    vi.spyOn(store, "removeCashFlow").mockResolvedValue({
      success: true,
      message: "",
    });
    await wrapper.find(".btn-danger").trigger("click");
    await flushPromises();
    expect(successMock).toHaveBeenCalledWith("Transaksi berhasil dihapus.");
  });

  it("menampilkan dialog error bila gagal menghapus", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store, router } = await renderPage();
    vi.spyOn(store, "removeCashFlow").mockResolvedValue({
      success: false,
      message: "Gagal hapus",
    });
    await wrapper.find(".btn-danger").trigger("click");
    await flushPromises();
    expect(errorMock).toHaveBeenCalledWith("Gagal hapus");
    expect(router.currentRoute.value.fullPath).toBe("/cash-flows/cf-1");
  });
});