import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import type { RouteRecordRaw } from "vue-router";
import SidebarComponent from "./SidebarComponent.vue";
import { renderWithProviders } from "../../../test-utils";

const Stub = defineComponent({ render: () => h("div") });
const routes: RouteRecordRaw[] = [
  { path: "/", component: Stub },
  { path: "/users", component: Stub },
  { path: "/profile", component: Stub },
  { path: "/cash-flows/:id", component: Stub },
];

function render(route: string, open = false) {
  return renderWithProviders(SidebarComponent, {
    route,
    routes,
    props: { open },
  });
}

describe("SidebarComponent", () => {
  it("menampilkan tiga menu dan hak cipta", async () => {
    const { wrapper } = await render("/");
    expect(wrapper.text()).toContain("Ringkasan Arus Kas");
    expect(wrapper.text()).toContain("Direktori Pengguna");
    expect(wrapper.text()).toContain("Profil Saya");
    expect(wrapper.text()).toContain(String(new Date().getFullYear()));
  });

  it("menandai menu Ringkasan aktif di beranda", async () => {
    const { wrapper } = await render("/");
    const links = wrapper.findAll("nav a");
    expect(links[0].classes()).toContain("bg-emerald-50");
    expect(links[1].classes()).not.toContain("bg-emerald-50");
  });

  it("menandai menu Ringkasan aktif di halaman detail cash flow", async () => {
    const { wrapper } = await render("/cash-flows/1");
    expect(wrapper.findAll("nav a")[0].classes()).toContain("bg-emerald-50");
  });

  it("menandai menu Direktori Pengguna aktif di /users", async () => {
    const { wrapper } = await render("/users");
    const links = wrapper.findAll("nav a");
    expect(links[0].classes()).not.toContain("bg-emerald-50");
    expect(links[1].classes()).toContain("bg-emerald-50");
  });

  it("menandai menu Profil aktif di /profile", async () => {
    const { wrapper } = await render("/profile");
    expect(wrapper.findAll("nav a")[2].classes()).toContain("bg-emerald-50");
  });

  it("tidak menampilkan backdrop saat tertutup", async () => {
    const { wrapper } = await render("/", false);
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);
    expect(wrapper.find("aside").classes()).toContain("-translate-x-full");
  });

  it("menampilkan backdrop saat terbuka dan menutup saat diklik", async () => {
    const { wrapper } = await render("/", true);
    expect(wrapper.find("aside").classes()).toContain("translate-x-0");
    await wrapper.find('[data-testid="sidebar-backdrop"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("menutup saat tombol tutup diklik", async () => {
    const { wrapper } = await render("/", true);
    await wrapper.find('button[aria-label="Tutup menu"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("menutup saat menu dipilih", async () => {
    const { wrapper } = await render("/", true);
    await wrapper.findAll("nav a")[1].trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});