import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises } from "@vue/test-utils";
import type { RouteRecordRaw } from "vue-router";
import AuthLayout from "./AuthLayout.vue";
import { useAuthStore } from "../states/authStore";
import { createMockPinia, renderWithProviders } from "../../../test-utils";

const ChildPage = defineComponent({
  render: () => h("p", { "data-testid": "child" }, "Isi halaman"),
});
const HomeStub = defineComponent({ render: () => h("div") });

const routes: RouteRecordRaw[] = [
  { path: "/", component: HomeStub },
  {
    path: "/auth",
    component: AuthLayout,
    children: [{ path: "login", component: ChildPage }],
  },
];
describe("AuthLayout", () => {
  it("menampilkan banner, halaman anak, dan tahun berjalan", async () => {
    const { wrapper } = await renderWithProviders(AuthLayout, {
      route: "/auth/login",
      routes,
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Kelola arus kas Anda dengan lebih cerdas.");
    expect(wrapper.text()).toContain(String(new Date().getFullYear()));
    expect(wrapper.find('[data-testid="child"]').exists()).toBe(true);
  });

  it("tidak mengalihkan halaman bila pengguna belum login", async () => {
    const { router } = await renderWithProviders(AuthLayout, {
      route: "/auth/login",
      routes,
    });
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("mengalihkan ke beranda bila pengguna sudah login", async () => {
    const pinia = createMockPinia();
    useAuthStore(pinia).token = "token-aktif";

    const { router } = await renderWithProviders(AuthLayout, {
      route: "/auth/login",
      routes,
      pinia,
    });
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe("/");
  });
});