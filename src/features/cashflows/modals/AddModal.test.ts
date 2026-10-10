import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import AddModal from "./AddModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return {
    ...actual,
    showSuccessDialog: vi.fn().mockResolvedValue({}),
    showErrorDialog: vi.fn().mockResolvedValue({}),
  };
});

const successMock = vi.mocked(showSuccessDialog);
const errorMock = vi.mocked(showErrorDialog);

beforeEach(() => {
  successMock.mockClear();
  errorMock.mockClear();
});

async function renderModal(open = true) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore();
  const result = await renderWithProviders(AddModal, {
    pinia,
    props: { open },
  });
  return { ...result, store };
}

type W = Awaited<ReturnType<typeof renderModal>>["wrapper"];

async function fill(wrapper: W, label: string, nominal: string, desc: string) {
  await wrapper.find("#add-label").setValue(label);
  await wrapper.find("#add-nominal").setValue(nominal);
  await wrapper.find("#add-description").setValue(desc);
}

async function submit(wrapper: W) {
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("AddModal", () => {
  it("tidak merender apa pun saat tertutup", async () => {
    const { wrapper } = await renderModal(false);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("merender formulir saat terbuka", async () => {
    const { wrapper } = await renderModal();
    expect(wrapper.text()).toContain("Tambah Transaksi");
    expect(wrapper.text()).toContain("Pemasukan");
    expect(wrapper.text()).toContain("Pengeluaran");
    expect(wrapper.findAll("#add-source option")).toHaveLength(3);
  });

  it("menampilkan daftar label dari store pada datalist", async () => {
    const { wrapper, store } = await renderModal();
    store.labels = ["Gaji", "Makan"];
    await flushPromises();
    expect(wrapper.findAll("#add-label-options option")).toHaveLength(2);
  });

  it("menutup saat latar belakang diklik", async () => {
    const { wrapper } = await renderModal();
    await wrapper.find('[role="dialog"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("tidak menutup saat isi modal diklik", async () => {
    const { wrapper } = await renderModal();
    await wrapper.find("form").trigger("click");
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("menutup lewat tombol X dan Batal", async () => {
    const { wrapper } = await renderModal();
    await wrapper.find('button[aria-label="Tutup"]').trigger("click");
    const cancel = wrapper.findAll("button").find((b) => b.text() === "Batal")!;
    await cancel.trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
  });

  it("mengganti jenis arus kas (pemasukan <-> pengeluaran)", async () => {
    const { wrapper } = await renderModal();
    const [inflow, outflow] = wrapper
      .findAll("form .grid button")
      .map((b) => b);
    expect(inflow.classes()).toContain("border-emerald-500");

    await outflow.trigger("click");
    expect(outflow.classes()).toContain("border-red-500");
    expect(inflow.classes()).toContain("border-slate-200");

    await inflow.trigger("click");
    expect(inflow.classes()).toContain("border-emerald-500");
  });

  it("menampilkan pratinjau rupiah hanya untuk nominal valid", async () => {
    const { wrapper } = await renderModal();
    await wrapper.find("#add-nominal").setValue("25000");
    expect(wrapper.text()).toMatch(/Rp\s25\.000/);
    await wrapper.find("#add-nominal").setValue("-5");
    expect(wrapper.text()).not.toMatch(/Rp\s/);
  });

  it("menampilkan pesan wajib diisi untuk semua kolom kosong", async () => {
    const { wrapper, store } = await renderModal();
    const add = vi.spyOn(store, "addCashFlow");
    await submit(wrapper);
    expect(wrapper.text()).toContain("Label wajib diisi.");
    expect(wrapper.text()).toContain("Nominal wajib diisi.");
    expect(wrapper.text()).toContain("Keterangan wajib diisi.");
    expect(add).not.toHaveBeenCalled();
  });

  it("menolak nominal nol atau negatif", async () => {
    const { wrapper } = await renderModal();
    await fill(wrapper, "Gaji", "0", "Bulanan");
    await submit(wrapper);
    expect(wrapper.text()).toContain("Nominal harus lebih dari 0.");
  });

  it("menghapus pesan error saat input diperbaiki", async () => {
    const { wrapper, store } = await renderModal();
    vi.spyOn(store, "addCashFlow").mockResolvedValue({
      success: true,
      message: "ok",
    });
    await submit(wrapper);
    expect(wrapper.text()).toContain("Label wajib diisi.");
    await fill(wrapper, "Gaji", "1000", "Bulanan");
    await submit(wrapper);
    expect(wrapper.text()).not.toContain("wajib diisi");
  });

  it("menyimpan data (dengan trim), menampilkan sukses, dan memancarkan saved", async () => {
    const { wrapper, store } = await renderModal();
    const add = vi.spyOn(store, "addCashFlow").mockResolvedValue({
      success: true,
      message: "Transaksi dibuat",
    });
    await wrapper.findAll("form .grid button")[1].trigger("click");
    await wrapper.find("#add-source").setValue("savings");
    await fill(wrapper, "  Makan  ", "15000", "  Siang  ");

    await submit(wrapper);

    expect(add).toHaveBeenCalledWith({
      type: "outflow",
      source: "savings",
      label: "Makan",
      nominal: 15000,
      description: "Siang",
    });
    expect(successMock).toHaveBeenCalledWith("Transaksi dibuat");
    expect(wrapper.emitted("saved")).toHaveLength(1);
  });

  it("memakai pesan sukses bawaan bila server tidak mengirim pesan", async () => {
    const { wrapper, store } = await renderModal();
    vi.spyOn(store, "addCashFlow").mockResolvedValue({
      success: true,
      message: "",
    });
    await fill(wrapper, "Gaji", "1000", "Bulanan");
    await submit(wrapper);
    expect(successMock).toHaveBeenCalledWith("Transaksi berhasil ditambahkan.");
  });

  it("menampilkan dialog error bila gagal dan tidak memancarkan saved", async () => {
    const { wrapper, store } = await renderModal();
    vi.spyOn(store, "addCashFlow").mockResolvedValue({
      success: false,
      message: "Server error",
    });
    await fill(wrapper, "Gaji", "1000", "Bulanan");
    await submit(wrapper);
    expect(errorMock).toHaveBeenCalledWith("Server error");
    expect(wrapper.emitted("saved")).toBeUndefined();
  });

  it("menonaktifkan tombol dan menampilkan 'Menyimpan...' saat proses", async () => {
    const { wrapper, store } = await renderModal();
    store.isCashFlowAdd = true;
    await flushPromises();
    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe("Menyimpan...");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("mengosongkan formulir setiap kali modal dibuka kembali", async () => {
    const { wrapper } = await renderModal();
    await fill(wrapper, "Sisa", "500", "Sisa isi");
    await submit(wrapper);
    await wrapper.findAll("form .grid button")[1].trigger("click");

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });

    expect((wrapper.find("#add-label").element as HTMLInputElement).value).toBe("");
    expect((wrapper.find("#add-nominal").element as HTMLInputElement).value).toBe("");
    expect(
      (wrapper.find("#add-description").element as HTMLTextAreaElement).value
    ).toBe("");
    expect(wrapper.text()).not.toContain("wajib diisi");
    expect(wrapper.findAll("form .grid button")[0].classes()).toContain(
      "border-emerald-500"
    );
  });
});