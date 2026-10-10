import { describe, expect, it } from "vitest";
import {
  SOURCE_OPTIONS,
  TYPE_OPTIONS,
  getSourceLabel,
  getTypeLabel,
} from "./cashFlowOptions";

describe("cashFlowOptions", () => {
  it("memiliki pilihan jenis dan sumber dana", () => {
    expect(TYPE_OPTIONS.map((o) => o.value)).toEqual(["inflow", "outflow"]);
    expect(SOURCE_OPTIONS.map((o) => o.value)).toEqual([
      "cash",
      "savings",
      "loans",
    ]);
  });

  it("getTypeLabel mengembalikan label bahasa Indonesia", () => {
    expect(getTypeLabel("inflow")).toBe("Pemasukan");
    expect(getTypeLabel("outflow")).toBe("Pengeluaran");
  });

  it("getTypeLabel mengembalikan nilai asli bila tidak dikenal", () => {
    expect(getTypeLabel("lainnya")).toBe("lainnya");
  });

  it("getSourceLabel mengembalikan label bahasa Indonesia", () => {
    expect(getSourceLabel("cash")).toBe("Tunai");
    expect(getSourceLabel("savings")).toBe("Tabungan");
    expect(getSourceLabel("loans")).toBe("Pinjaman");
  });

  it("getSourceLabel mengembalikan nilai asli bila tidak dikenal", () => {
    expect(getSourceLabel("kripto")).toBe("kripto");
  });
});