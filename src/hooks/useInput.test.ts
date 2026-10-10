import { describe, expect, it } from "vitest";
import { useInput } from "./useInput";

describe("useInput", () => {
  it("memakai nilai awal", () => {
    const [value] = useInput("halo");

    expect(value.value).toBe("halo");
  });

  it("memperbarui nilai dari event input", () => {
    const [value, onChange] = useInput("");
    const input = document.createElement("input");
    input.addEventListener("input", onChange);

    input.value = "Gaji Bulanan";
    input.dispatchEvent(new Event("input"));

    expect(value.value).toBe("Gaji Bulanan");
  });

  it("memperbarui nilai dari nilai langsung", () => {
    const [value, onChange] = useInput<string>("inflow");

    onChange("outflow");

    expect(value.value).toBe("outflow");
  });

  it("mendukung tipe selain string", () => {
    const [value, onChange] = useInput<number>(0);

    onChange(42);

    expect(value.value).toBe(42);
  });

  it("reset mengembalikan ke nilai awal", () => {
    const [value, onChange, reset] = useInput("awal");

    onChange("berubah");
    reset();

    expect(value.value).toBe("awal");
  });

  it("reset dapat menerima nilai baru", () => {
    const [value, , reset] = useInput("awal");

    reset("nilai baru");

    expect(value.value).toBe("nilai baru");
  });
});