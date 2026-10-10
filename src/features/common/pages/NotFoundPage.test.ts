import { describe, expect, it } from "vitest";
import NotFoundPage from "./NotFoundPage.vue";
import { renderWithProviders } from "../../../test-utils";

describe("NotFoundPage", () => {
  it("menampilkan pesan 404", async () => {
    const { wrapper } = await renderWithProviders(NotFoundPage);
    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Halaman tidak ditemukan");
  });

  it("memiliki tautan kembali ke beranda", async () => {
    const { wrapper } = await renderWithProviders(NotFoundPage);
    const link = wrapper.find("a");
    expect(link.text()).toContain("Kembali ke Beranda");
    expect(link.attributes("href")).toBe("/");
  });
});