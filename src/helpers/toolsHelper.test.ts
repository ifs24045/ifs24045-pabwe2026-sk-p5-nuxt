import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

import Swal from "sweetalert2";
import {
  formatDate,
  formatDateTime,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "./toolsHelper";

const fireMock = Swal.fire as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  fireMock.mockReset();
  fireMock.mockResolvedValue({ isConfirmed: true });
});

describe("showSuccessDialog", () => {
  it("memakai judul bawaan", async () => {
    await showSuccessDialog("Data tersimpan");

    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Berhasil",
        text: "Data tersimpan",
      })
    );
  });

  it("memakai judul kustom", async () => {
    await showSuccessDialog("Data tersimpan", "Selesai");

    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Selesai" })
    );
  });
});

describe("showErrorDialog", () => {
  it("memakai judul bawaan", async () => {
    await showErrorDialog("Terjadi kesalahan");

    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan",
      })
    );
  });

  it("memakai judul kustom", async () => {
    await showErrorDialog("Terjadi kesalahan", "Oops");

    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Oops" })
    );
  });
});

describe("showConfirmDialog", () => {
  it("mengembalikan true saat dikonfirmasi (nilai bawaan)", async () => {
    const result = await showConfirmDialog("Hapus data?");

    expect(result).toBe(true);
    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Apakah Anda yakin?",
        text: "Hapus data?",
        showCancelButton: true,
        confirmButtonText: "Ya",
        cancelButtonText: "Batal",
      })
    );
  });

  it("mengembalikan false saat dibatalkan (nilai kustom)", async () => {
    fireMock.mockResolvedValue({ isConfirmed: false });

    const result = await showConfirmDialog("Hapus data?", "Hapus?", "Ya, hapus");

    expect(result).toBe(false);
    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Hapus?", confirmButtonText: "Ya, hapus" })
    );
  });
});

describe("formatRupiah", () => {
  it("memformat angka", () => {
    expect(formatRupiah(5000000)).toMatch(/^Rp\s5\.000\.000$/);
  });

  it("memformat string numerik", () => {
    expect(formatRupiah("15000")).toMatch(/^Rp\s15\.000$/);
  });

  it("memformat nol", () => {
    expect(formatRupiah(0)).toMatch(/^Rp\s0$/);
  });

  it("menganggap nilai tidak valid sebagai nol", () => {
    expect(formatRupiah("abc")).toMatch(/^Rp\s0$/);
    expect(formatRupiah(undefined)).toMatch(/^Rp\s0$/);
    expect(formatRupiah(null)).toMatch(/^Rp\s0$/);
  });
});

describe("formatDate", () => {
  it("mengembalikan strip untuk nilai kosong", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("")).toBe("-");
  });

  it("mengembalikan strip untuk tanggal tidak valid", () => {
    expect(formatDate("bukan-tanggal")).toBe("-");
  });

  it("memformat string tanggal", () => {
    expect(formatDate("2026-01-15T12:00:00Z")).toMatch(/Januari 2026/);
  });

  it("memformat objek Date", () => {
    expect(formatDate(new Date("2026-01-15T12:00:00Z"))).toMatch(/Januari 2026/);
  });
});

describe("formatDateTime", () => {
  it("mengembalikan strip untuk nilai kosong", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDateTime(undefined)).toBe("-");
  });

  it("mengembalikan strip untuk tanggal tidak valid", () => {
    expect(formatDateTime("bukan-tanggal")).toBe("-");
  });

  it("memformat tanggal beserta jam", () => {
    const result = formatDateTime("2026-01-15T12:00:00Z");

    expect(result).toMatch(/Januari 2026/);
    expect(result).toMatch(/\d{2}[.:]\d{2}/);
  });
});