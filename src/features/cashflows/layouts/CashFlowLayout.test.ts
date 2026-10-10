import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises } from "@vue/test-utils";
import type { RouteRecordRaw } from "vue-router";
import CashFlowLayout from "./CashFlowLayout.vue";
import { useAuthStore } from "../../auth/states/authStore";
import { useUsersStore } from "../../users/states/usersStore";
import { putAccessToken } from "../../../helpers/apiHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";

const Child = defineComponent({
  render: () => h("p", { "data-testid": "child" }, "Isi halaman"),
});
const Blank = defineComponent({ render: () => h("div") });

const routes: RouteRecordRaw[] = [
  { path: "/auth/login", component: Blank },
  {
    path: "/",
    component: CashFlowLayout,
    children: [{ path: "", component: Child }],
  },
];

beforeEach(() => {
  localStorage.clear();
});

describe("CashFlowLayout", () => {
  it("mengalihkan ke login bila belum terautentikasi", async () => {
    const pinia = createMockPinia();
    const usersStore = useUsersStore();
    const fetchProfile = vi.spyOn(usersStore, "fetchProfile");
    const { router, wrapper } = await renderWithProviders(CashFlowLayout, {
      pinia,
      routes,
      route: "/",
    });
    await flushPromises();

    expect(fetchProfile).not.toHaveBeenCalled();
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
    expect(wrapper.find("aside").exists()).toBe(false);
  });

  it("menampilkan spinner sebelum profil selesai dimuat", async () => {
    putAccessToken("tok");
    const pinia = createMockPinia();
    const usersStore = useUsersStore();
    vi.spyOn(usersStore, "fetchProfile").mockReturnValue(new Promise(() => {}));
    const { wrapper } = await renderWithProviders(CashFlowLayout, {
      pinia,
      routes,
      route: "/",
    });
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
    expect(wrapper.find("aside").exists()).toBe(false);
  });

  it("memuat profil lalu menampilkan sidebar, navbar, dan konten", async () => {
    putAccessToken("tok");
    const pinia = createMockPinia();
    const usersStore = useUsersStore();
    vi.spyOn(usersStore, "fetchProfile").mockResolvedValue({
      success: true,
      message: "ok",
    } as any);
    const { wrapper } = await renderWithProviders(CashFlowLayout, {
      pinia,
      routes,
      route: "/",
    });
    await flushPromises();

    expect(wrapper.find("aside").exists()).toBe(true);
    expect(wrapper.find("header").exists()).toBe(true);
    expect(wrapper.find(".animate-spin").exists()).toBe(false);
  });

  it("logout dan kembali ke login bila profil gagal dimuat", async () => {
    putAccessToken("tok");
    const pinia = createMockPinia();
    const usersStore = useUsersStore();
    const authStore = useAuthStore();
    vi.spyOn(usersStore, "fetchProfile").mockResolvedValue({
      success: false,
      message: "Token tidak valid",
    } as any);
    const logout = vi.spyOn(authStore, "logout");
    const { router } = await renderWithProviders(CashFlowLayout, {
      pinia,
      routes,
      route: "/",
    });
    await flushPromises();

    expect(logout).toHaveBeenCalled();
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("tombol menu di navbar membuka dan menutup sidebar", async () => {
    putAccessToken("tok");
    const pinia = createMockPinia();
    const usersStore = useUsersStore();
    vi.spyOn(usersStore, "fetchProfile").mockResolvedValue({
      success: true,
      message: "ok",
    } as any);
    const { wrapper } = await renderWithProviders(CashFlowLayout, {
      pinia,
      routes,
      route: "/",
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);
    await wrapper.find('button[aria-label="Buka menu"]').trigger("click");
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(true);
    await wrapper.find('[data-testid="sidebar-backdrop"]').trigger("click");
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);
  });
});