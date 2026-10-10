import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises } from "@vue/test-utils";
import type { RouteRecordRaw } from "vue-router";
import HomePage from "./HomePage.vue";
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
  { path: "/cash-flows/:id", component: Blank },
];

const items: CashFlow[] = [
  {
    id: "1",
    type: "inflow",
    source: "cash",
    label: "Gaji",
    nominal: 5000000,
    description: "Bulanan",
    created_at: "2026-01-15T12:00:00Z",
  },
  {
    id: "2",
    type: "outflow",
    source: "savings",
    label: "Makan",
    nominal: 25000,
    description: "Siang",
    created_at: "2026-01-16T12:00:00Z",
  },
];

beforeEach(() => {
  confirmMock.mockReset();
  successMock.mockClear();
  errorMock.mockClear();
});

async function renderPage(list: CashFlow[] = items) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore();
  store.stats = {
    total_inflow: 5000000,
    total_outflow: 25000,
    cash: 4000000,
    savings: 900000,
    loans: 75000,
  };
  const fetchCashFlows = vi
    .spyOn(store, "fetchCashFlows")
    .mockImplementation(async () => {
      store.cashFlows = list;
      return { success: true, message: "ok" };
    });
  const fetchLabels = vi
    .spyOn(store, "fetchLabels")
    .mockImplementation(async () => {
      store.labels = ["Gaji", "Makan"];
      return { success: true, message: "ok" };
    });
  const result = await renderWithProviders(HomePage, { pinia, routes });
  await flushPromises();
  return { ...result, store, fetchCashFlows, fetchLabels };
}

type W = Awaited<ReturnType<typeof renderPage>>["wrapper"];

const btn = (w: W, text: string) =>
  w.findAll("button").find((b) => b.text().includes(text))!;

describe("HomePage - tampilan", () => {
  it("memuat transaksi dan label saat dibuka", async () => {
    const { fetchCashFlows, fetchLabels } = await renderPage();
    expect(fetchCashFlows).toHaveBeenCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: "",
      end_date: "",
    });
    expect(fetchLabels).toHaveBeenCalled();
  });

  it("menampilkan enam kartu metrik", async () => {
    const { wrapper } = await renderPage();
    const text = wrapper.text();
    [
      "Total Saldo Kas Bersih",
      "Total Pemasukan",
      "Total Pengeluaran",
      "Saldo Kas Tunai",
      "Saldo Rekening Tabungan",
      "Saldo Pinjaman",
    ].forEach((label) => expect(text).toContain(label));
    expect(wrapper.findAll("section > div.grid > article")).toHaveLength(6);
    expect(text).toMatch(/Rp\s4\.975\.000/);
  });

  it("menampilkan tabel dan kartu mobile dengan badge jenis", async () => {
    const { wrapper } = await renderPage();
    expect(wrapper.findAll("tbody tr")).toHaveLength(2);
    expect(wrapper.findAll(".md\\:hidden article")).toHaveLength(2);
    const row = wrapper.findAll("tbody tr");
    expect(row[0].text()).toContain("Pemasukan");
    expect(row[0].text()).toMatch(/\+\sRp\s5\.000\.000/);
    expect(row[0].find("td:nth-child(5)").classes()).toContain("text-emerald-600");
    expect(row[1].text()).toContain("Pengeluaran");
    expect(row[1].text()).toMatch(/-\sRp\s25\.000/);
    expect(row[1].find("td:nth-child(5)").classes()).toContain("text-red-600");
  });

  it("menautkan ke halaman detail", async () => {
    const { wrapper } = await renderPage();
    expect(wrapper.find('a[aria-label="Lihat detail"]').attributes("href")).toBe(
      "/cash-flows/1"
    );
  });

  it("menampilkan keadaan kosong tanpa filter", async () => {
    const { wrapper } = await renderPage([]);
    expect(wrapper.text()).toContain("Belum ada transaksi");
    expect(wrapper.text()).toContain("Mulai catat arus kas pertama Anda.");
  });

  it("menampilkan skeleton saat memuat tanpa data", async () => {
    const pinia = createMockPinia();
    const store = useCashFlowsStore();
    vi.spyOn(store, "fetchCashFlows").mockImplementation(
      () => new Promise(() => {})
    );
    vi.spyOn(store, "fetchLabels").mockResolvedValue({
      success: true,
      message: "ok",
    });
    const { wrapper } = await renderWithProviders(HomePage, { pinia, routes });
    store.isCashFlows = true;
    await flushPromises();
    expect(wrapper.findAll(".animate-pulse")).toHaveLength(4);
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("menampilkan dialog error bila gagal memuat", async () => {
    const pinia = createMockPinia();
    const store = useCashFlowsStore();
    vi.spyOn(store, "fetchCashFlows").mockResolvedValue({
      success: false,
      message: "Gagal memuat",
    });
    vi.spyOn(store, "fetchLabels").mockResolvedValue({
      success: true,
      message: "ok",
    });
    await renderWithProviders(HomePage, { pinia, routes });
    await flushPromises();
    expect(errorMock).toHaveBeenCalledWith("Gagal memuat");
  });
});

describe("HomePage - filter", () => {
  it("memuat ulang saat filter berubah dan menampilkan tombol reset", async () => {
    const { wrapper, fetchCashFlows } = await renderPage();
    expect(btn(wrapper, "Reset Filter")).toBeUndefined();

    await wrapper.find("#filter-type").setValue("inflow");
    await wrapper.find("#filter-source").setValue("cash");
    await wrapper.find("#filter-label").setValue("Gaji");
    await wrapper.find("#filter-start").setValue("2026-01-01");
    await wrapper.find("#filter-end").setValue("2026-01-31");
    await flushPromises();

    expect(fetchCashFlows).toHaveBeenLastCalledWith({
      type: "inflow",
      source: "cash",
      label: "Gaji",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });
    expect(btn(wrapper, "Reset Filter")).toBeDefined();
  });

  it("tombol Muat Ulang memanggil ulang data", async () => {
    const { wrapper, fetchCashFlows } = await renderPage();
    await btn(wrapper, "Muat Ulang").trigger("click");
    expect(fetchCashFlows).toHaveBeenCalledTimes(2);
  });

  it("reset filter mengosongkan seluruh filter", async () => {
    const { wrapper } = await renderPage();
    await wrapper.find("#filter-type").setValue("outflow");
    await flushPromises();
    await btn(wrapper, "Reset Filter").trigger("click");
    await flushPromises();
    expect((wrapper.find("#filter-type").element as HTMLSelectElement).value).toBe("");
    expect(btn(wrapper, "Reset Filter")).toBeUndefined();
  });

  it("pesan kosong menyebut filter bila filter aktif", async () => {
    const { wrapper } = await renderPage([]);
    await wrapper.find("#filter-type").setValue("inflow");
    await flushPromises();
    expect(wrapper.text()).toContain("Tidak ada transaksi yang cocok dengan filter.");
  });
});

describe("HomePage - tambah & ubah", () => {
  it("membuka modal tambah, lalu menutup dan memuat ulang setelah disimpan", async () => {
    const { wrapper, store, fetchCashFlows, fetchLabels } = await renderPage();
    await btn(wrapper, "Tambah Transaksi").trigger("click");
    expect(wrapper.find('[aria-label="Tambah transaksi"]').exists()).toBe(true);

    vi.spyOn(store, "addCashFlow").mockResolvedValue({
      success: true,
      message: "Dibuat",
    });
    await wrapper.find("#add-label").setValue("Bonus");
    await wrapper.find("#add-nominal").setValue("1000");
    await wrapper.find("#add-description").setValue("x");
    await wrapper.find('[aria-label="Tambah transaksi"] form').trigger("submit");
    await flushPromises();

    expect(wrapper.find('[aria-label="Tambah transaksi"]').exists()).toBe(false);
    expect(fetchCashFlows).toHaveBeenCalledTimes(2);
    expect(fetchLabels).toHaveBeenCalledTimes(2);
  });

  it("menutup modal tambah saat dibatalkan", async () => {
    const { wrapper } = await renderPage();
    await btn(wrapper, "Tambah Transaksi").trigger("click");
    await wrapper.find('[aria-label="Tambah transaksi"] button[aria-label="Tutup"]').trigger("click");
    expect(wrapper.find('[aria-label="Tambah transaksi"]').exists()).toBe(false);
  });

  it("membuka modal ubah dengan data baris, lalu memuat ulang setelah disimpan", async () => {
    const { wrapper, store, fetchCashFlows } = await renderPage();
    await wrapper.findAll('button[aria-label="Ubah"]')[0].trigger("click");
    const dialog = wrapper.find('[aria-label="Ubah transaksi"]');
    expect(dialog.exists()).toBe(true);
    expect((wrapper.find("#change-label").element as HTMLInputElement).value).toBe("Gaji");

    vi.spyOn(store, "changeCashFlow").mockResolvedValue({
      success: true,
      message: "Diubah",
    });
    await dialog.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find('[aria-label="Ubah transaksi"]').exists()).toBe(false);
    expect(fetchCashFlows).toHaveBeenCalledTimes(2);
  });

  it("menutup modal ubah saat dibatalkan", async () => {
    const { wrapper } = await renderPage();
    await wrapper.findAll('button[aria-label="Ubah"]')[1].trigger("click");
    await wrapper.find('[aria-label="Ubah transaksi"] button[aria-label="Tutup"]').trigger("click");
    expect(wrapper.find('[aria-label="Ubah transaksi"]').exists()).toBe(false);
  });
});

describe("HomePage - hapus", () => {
  it("tidak menghapus bila dibatalkan", async () => {
    confirmMock.mockResolvedValue(false);
    const { wrapper, store } = await renderPage();
    const remove = vi.spyOn(store, "removeCashFlow");
    await wrapper.findAll('button[aria-label="Hapus"]')[0].trigger("click");
    await flushPromises();
    expect(confirmMock).toHaveBeenCalledWith(
      'Transaksi "Gaji" akan dihapus permanen.',
      "Hapus transaksi?",
      "Ya, hapus"
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("menghapus transaksi lalu memuat ulang", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store, fetchCashFlows } = await renderPage();
    const remove = vi.spyOn(store, "removeCashFlow").mockResolvedValue({
      success: true,
      message: "Dihapus",
    });
    await wrapper.findAll('button[aria-label="Hapus"]')[1].trigger("click");
    await flushPromises();
    expect(remove).toHaveBeenCalledWith("2");
    expect(successMock).toHaveBeenCalledWith("Dihapus");
    expect(fetchCashFlows).toHaveBeenCalledTimes(2);
  });

  it("memakai pesan hapus bawaan", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store } = await renderPage();
    vi.spyOn(store, "removeCashFlow").mockResolvedValue({
      success: true,
      message: "",
    });
    await wrapper.findAll('button[aria-label="Hapus"]')[0].trigger("click");
    await flushPromises();
    expect(successMock).toHaveBeenCalledWith("Transaksi berhasil dihapus.");
  });

  it("menampilkan dialog error bila gagal menghapus", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store } = await renderPage();
    vi.spyOn(store, "removeCashFlow").mockResolvedValue({
      success: false,
      message: "Gagal hapus",
    });
    await wrapper.findAll('button[aria-label="Hapus"]')[0].trigger("click");
    await flushPromises();
    expect(errorMock).toHaveBeenCalledWith("Gagal hapus");
  });
});

describe("HomePage - reset semua", () => {
  it("tidak mereset bila dibatalkan", async () => {
    confirmMock.mockResolvedValue(false);
    const { wrapper, store } = await renderPage();
    const removeAll = vi.spyOn(store, "removeAllCashFlows");
    await btn(wrapper, "Reset Semua").trigger("click");
    await flushPromises();
    expect(removeAll).not.toHaveBeenCalled();
  });

  it("mereset seluruh transaksi lalu memuat ulang label", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store, fetchLabels } = await renderPage();
    const removeAll = vi.spyOn(store, "removeAllCashFlows").mockResolvedValue({
      success: true,
      message: "Direset",
    });
    await btn(wrapper, "Reset Semua").trigger("click");
    await flushPromises();
    expect(removeAll).toHaveBeenCalled();
    expect(successMock).toHaveBeenCalledWith("Direset");
    expect(fetchLabels).toHaveBeenCalledTimes(2);
  });

  it("memakai pesan reset bawaan", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store } = await renderPage();
    vi.spyOn(store, "removeAllCashFlows").mockResolvedValue({
      success: true,
      message: "",
    });
    await btn(wrapper, "Reset Semua").trigger("click");
    await flushPromises();
    expect(successMock).toHaveBeenCalledWith("Seluruh transaksi berhasil direset.");
  });

  it("menampilkan dialog error bila reset gagal", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store } = await renderPage();
    vi.spyOn(store, "removeAllCashFlows").mockResolvedValue({
      success: false,
      message: "Gagal reset",
    });
    await btn(wrapper, "Reset Semua").trigger("click");
    await flushPromises();
    expect(errorMock).toHaveBeenCalledWith("Gagal reset");
  });
});

describe("HomePage - kartu mobile", () => {
  it("tombol ubah dan hapus pada kartu mobile berfungsi", async () => {
    confirmMock.mockResolvedValue(true);
    const { wrapper, store } = await renderPage();
    const remove = vi.spyOn(store, "removeCashFlow").mockResolvedValue({
      success: true,
      message: "Dihapus",
    });
    const card = wrapper.findAll(".md\\:hidden article")[1];

    await card.find('button[aria-label="Ubah"]').trigger("click");
    expect(wrapper.find('[aria-label="Ubah transaksi"]').exists()).toBe(true);
    expect((wrapper.find("#change-label").element as HTMLInputElement).value).toBe("Makan");

    await card.find('button[aria-label="Hapus"]').trigger("click");
    await flushPromises();
    expect(remove).toHaveBeenCalledWith("2");
  });
});