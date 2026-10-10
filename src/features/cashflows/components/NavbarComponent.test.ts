import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import NavbarComponent from "./NavbarComponent.vue";
import { useAuthStore } from "../../auth/states/authStore";
import { useUsersStore } from "../../users/states/usersStore";
import { putAccessToken } from "../../../helpers/apiHelper";
import { showConfirmDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showConfirmDialog: vi.fn() };
});

const confirmMock = vi.mocked(showConfirmDialog);

beforeEach(() => {
  confirmMock.mockReset();
});

const profile = {
  id: "1",
  name: "Budi Santoso",
  email: "budi@mail.com",
  photo: null,
};

async function renderNavbar(withProfile = true) {
  const pinia = createMockPinia();
  const usersStore = useUsersStore();
  if (withProfile) usersStore.profile = profile as any;
  const result = await renderWithProviders(NavbarComponent, { pinia });
  return { ...result, usersStore };
}

describe("NavbarComponent", () => {
  it("menampilkan nama, username, inisial, dan status sesi", async () => {
    const { wrapper } = await renderNavbar();
    expect(wrapper.text()).toContain("Budi Santoso");
    expect(wrapper.text()).toContain("@budi");
    expect(wrapper.text()).toContain("BS");
    expect(wrapper.text()).toContain("Sesi aktif");
  });

  it("memakai nilai bawaan bila profil belum dimuat", async () => {
    const { wrapper } = await renderNavbar(false);
    expect(wrapper.text()).toContain("Pengguna");
    expect(wrapper.text()).not.toContain("@");
  });

  it("memakai username kosong bila email kosong", async () => {
    const { wrapper, usersStore } = await renderNavbar();
    usersStore.profile = { ...profile, email: "" } as any;
    await flushPromises();
    expect(wrapper.text()).not.toContain("@");
  });

  it("memancarkan toggle-sidebar saat tombol menu diklik", async () => {
    const { wrapper } = await renderNavbar();
    await wrapper.find('button[aria-label="Buka menu"]').trigger("click");
    expect(wrapper.emitted("toggle-sidebar")).toHaveLength(1);
  });

  it("tidak keluar bila konfirmasi dibatalkan", async () => {
    confirmMock.mockResolvedValue(false);
    putAccessToken("tok");
    const { wrapper, router, usersStore } = await renderNavbar();
    const push = vi.spyOn(router, "push");

    await wrapper.find('button[aria-label="Keluar"]').trigger("click");
    await flushPromises();

    expect(confirmMock).toHaveBeenCalledWith(
      "Anda akan keluar dari sesi ini.",
      "Keluar dari akun?",
      "Ya, keluar"
    );
    expect(push).not.toHaveBeenCalled();
    expect(usersStore.profile).not.toBeNull();
  });

  it("keluar, menghapus profil, dan menuju halaman login", async () => {
    confirmMock.mockResolvedValue(true);
    putAccessToken("tok");
    const { wrapper, router, usersStore } = await renderNavbar();
    const authStore = useAuthStore();
    const logout = vi.spyOn(authStore, "logout");

    await wrapper.find('button[aria-label="Keluar"]').trigger("click");
    await flushPromises();

    expect(logout).toHaveBeenCalled();
    expect(usersStore.profile).toBeNull();
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });
});