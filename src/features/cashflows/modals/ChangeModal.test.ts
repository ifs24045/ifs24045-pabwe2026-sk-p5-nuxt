import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import ChangeModal from "./ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import type { CashFlow } from "../api/cashFlowApi";
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

const item: CashFlow = {
  id: "cf-1",
  type: "outflow",
  source: "savings",
  label: "Makan",
  nominal: 15000,
  description: "Siang",
};

beforeEach(() => {
  successMock.mockClear();
  errorMock.mockClear();
});

async function renderModal(open = true, cashFlow: CashFlow | null = item) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore();
  const result = await renderWithProviders(ChangeModal, {
    pinia,
    props: { open, cashFlow },
  });
  return { ...result, store };
}

type W = Awaited<ReturnType<typeof renderModal>>["wrapper"];

const val = (w: W, sel: string) =>
  (w.find(sel).element as HTMLInputElement).value;

async function submit(wrapper: W) {
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("ChangeModal", () => {
  it("tidak merender apa pun saat tertutup", async () => {
    const { wrapper } = await renderModal(false);
    expect(wrapper.find("dialog").exists()).toBe(false);
  });

  it("mengisi formulir dari data transaksi", async () => {
    const { wrapper } = await renderModal();
    expect(wrapper.text()).toContain("Ubah Transaksi");
    expect(val(wrapper, "#change-label")).toBe("Makan");
    expect(val(wrapper, "#change-nominal")).toBe("15000");
    expect(val(wrapper, "#change-description")).toBe("Siang");
    expect(val(wrapper, "#change-source")).toBe("savings");
    expect(wrapper.findAll("form .grid button")[1].classes()).toContain(
      "border-red-500"
    );
  });

  it("tidak mengisi formulir bila transaksi belum ada", async () => {
    const { wrapper } = await renderModal(true, null);
    expect(val(wrapper, "#change-label")).toBe("");
  });

  it("memperbarui isian saat data transaksi berganti", async () => {
    const { wrapper } = await renderModal();
    await wrapper.setProps({
      cashFlow: { ...item, id: "cf-2", label: "Gaji", type: "inflow" },
    });
    expect(val(wrapper, "#change-label")).toBe("Gaji");
    expect(wrapper.findAll("form .grid button")[0].classes()).toContain(
      "border-emerald-500"
    );
  });

  it("menampilkan datalist label dari store", async () => {
    const { wrapper, store } = await renderModal();
    store.labels = ["Gaji", "Makan", "Transport"];
    await flushPromises();
    expect(wrapper.findAll("#change-label-options option")).toHaveLength(3);
  });

  it("menutup lewat latar belakang, tombol X, dan Batal", async () => {
    const { wrapper } = await renderModal();
    await wrapper.find("dialog").trigger("click");
    await wrapper.find('button[aria-label="Tutup"]').trigger("click");
    const cancel = wrapper.findAll("button").find((b) => b.text() === "Batal")!;
    await cancel.trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(3);
  });

  it("mengganti jenis arus kas", async () => {
    const { wrapper } = await renderModal();
    const [inflow, outflow] = wrapper.findAll("form .grid button");
    await inflow.trigger("click");
    expect(inflow.classes()).toContain("border-emerald-500");
    await outflow.trigger("click");
    expect(outflow.classes()).toContain("border-red-500");
  });

  it("menampilkan pratinjau rupiah untuk nominal valid saja", async () => {
    const { wrapper } = await renderModal();
    expect(wrapper.text()).toMatch(/Rp\s15\.000/);
    await wrapper.find("#change-nominal").setValue("0");
    expect(wrapper.text()).not.toMatch(/Rp\s/);
  });

  it("menampilkan pesan wajib diisi untuk kolom kosong", async () => {
    const { wrapper, store } = await renderModal();
    const change = vi.spyOn(store, "changeCashFlow");
    await wrapper.find("#change-label").setValue("");
    await wrapper.find("#change-nominal").setValue("");
    await wrapper.find("#change-description").setValue("");
    await submit(wrapper);
    expect(wrapper.text()).toContain("Label wajib diisi.");
    expect(wrapper.text()).toContain("Nominal wajib diisi.");
    expect(wrapper.text()).toContain("Keterangan wajib diisi.");
    expect(change).not.toHaveBeenCalled();
  });

  it("menolak nominal nol atau negatif", async () => {
    const { wrapper } = await renderModal();
    await wrapper.find("#change-nominal").setValue("-1");
    await submit(wrapper);
    expect(wrapper.text()).toContain("Nominal harus lebih dari 0.");
  });

  it("tidak mengirim apa pun bila transaksi belum ada", async () => {
    const { wrapper, store } = await renderModal(true, null);
    const change = vi.spyOn(store, "changeCashFlow");
    await submit(wrapper);
    expect(change).not.toHaveBeenCalled();
  });

  it("menyimpan perubahan dan memancarkan saved", async () => {
    const { wrapper, store } = await renderModal();
    const change = vi.spyOn(store, "changeCashFlow").mockResolvedValue({
      success: true,
      message: "Diperbarui",
    });
    await wrapper.find("#change-source").setValue("cash");
    await wrapper.find("#change-label").setValue("  Minum ");
    await wrapper.find("#change-nominal").setValue("20000");
    await wrapper.find("#change-description").setValue(" Pagi ");
    await submit(wrapper);

    expect(change).toHaveBeenCalledWith("cf-1", {
      type: "outflow",
      source: "cash",
      label: "Minum",
      nominal: 20000,
      description: "Pagi",
    });
    expect(successMock).toHaveBeenCalledWith("Diperbarui");
    expect(wrapper.emitted("saved")).toHaveLength(1);
  });

  it("memakai pesan sukses bawaan", async () => {
    const { wrapper, store } = await renderModal();
    vi.spyOn(store, "changeCashFlow").mockResolvedValue({
      success: true,
      message: "",
    });
    await submit(wrapper);
    expect(successMock).toHaveBeenCalledWith("Transaksi berhasil diperbarui.");
  });

  it("menampilkan dialog error saat gagal", async () => {
    const { wrapper, store } = await renderModal();
    vi.spyOn(store, "changeCashFlow").mockResolvedValue({
      success: false,
      message: "Gagal simpan",
    });
    await submit(wrapper);
    expect(errorMock).toHaveBeenCalledWith("Gagal simpan");
    expect(wrapper.emitted("saved")).toBeUndefined();
  });

  it("menonaktifkan tombol saat proses berjalan", async () => {
    const { wrapper, store } = await renderModal();
    expect(wrapper.find('button[type="submit"]').text()).toBe("Simpan Perubahan");
    store.isCashFlowChange = true;
    await flushPromises();
    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe("Menyimpan...");
    expect(button.attributes("disabled")).toBeDefined();
  });
});