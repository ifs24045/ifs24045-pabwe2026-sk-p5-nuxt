import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises } from "@vue/test-utils";
import LoginPage from "./LoginPage.vue";
import { postLogin } from "../api/authApi";
import {
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";
import { getAccessToken } from "../../../helpers/apiHelper";
import { renderWithProviders } from "../../../test-utils";

vi.mock("../api/authApi", () => ({
  postLogin: vi.fn(),
  postRegister: vi.fn(),
}));

vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn().mockResolvedValue({}),
  showErrorDialog: vi.fn().mockResolvedValue({}),
}));

const postLoginMock = vi.mocked(postLogin);
const successDialogMock = vi.mocked(showSuccessDialog);
const errorDialogMock = vi.mocked(showErrorDialog);

const Stub = defineComponent({ render: () => h("div") });
const routes = [
  { path: "/", component: Stub },
  { path: "/auth/login", component: LoginPage },
  { path: "/auth/register", component: Stub },
];

async function renderPage() {
  return renderWithProviders(LoginPage, { route: "/auth/login", routes });
}

async function fillForm(
  wrapper: Awaited<ReturnType<typeof renderPage>>["wrapper"],
  email: string,
  password: string
) {
  await wrapper.find("#email").setValue(email);
  await wrapper.find("#password").setValue(password);
}

beforeEach(() => {
  postLoginMock.mockReset();
  successDialogMock.mockClear();
  errorDialogMock.mockClear();
});

describe("tampilan awal", () => {
  it("menampilkan judul, kolom isian, dan tautan ke halaman daftar", async () => {
    const { wrapper } = await renderPage();

    expect(wrapper.text()).toContain("Selamat datang kembali");
    expect(wrapper.find("#email").exists()).toBe(true);
    expect(wrapper.find("#password").attributes("type")).toBe("password");
    expect(wrapper.find('a[href="/auth/register"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe("Masuk");
    expect(wrapper.find("p.text-red-500").exists()).toBe(false);
  });

  it("mengubah tampilan kata sandi saat tombol mata diklik", async () => {
    const { wrapper } = await renderPage();
    const toggle = wrapper.find('button[type="button"]');

    expect(toggle.attributes("aria-label")).toBe("Tampilkan kata sandi");

    await toggle.trigger("click");
    expect(wrapper.find("#password").attributes("type")).toBe("text");
    expect(toggle.attributes("aria-label")).toBe("Sembunyikan kata sandi");

    await toggle.trigger("click");
    expect(wrapper.find("#password").attributes("type")).toBe("password");
  });
});

describe("validasi", () => {
  it("menampilkan pesan wajib diisi bila kolom kosong", async () => {
    const { wrapper } = await renderPage();

    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Email wajib diisi.");
    expect(wrapper.text()).toContain("Kata sandi wajib diisi.");
    expect(postLoginMock).not.toHaveBeenCalled();
  });

  it("menolak format email yang tidak valid", async () => {
    const { wrapper } = await renderPage();

    await fillForm(wrapper, "bukan-email", "rahasia");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Format email tidak valid.");
    expect(wrapper.text()).not.toContain("Kata sandi wajib diisi.");
    expect(postLoginMock).not.toHaveBeenCalled();
  });

  it("hanya menampilkan error kata sandi bila email sudah benar", async () => {
    const { wrapper } = await renderPage();

    await fillForm(wrapper, "a@b.com", "");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).not.toContain("Email wajib diisi.");
    expect(wrapper.text()).toContain("Kata sandi wajib diisi.");
  });

  it("menghapus pesan error setelah isian diperbaiki", async () => {
    const { wrapper } = await renderPage();

    await wrapper.find("form").trigger("submit");
    expect(wrapper.text()).toContain("Email wajib diisi.");

    postLoginMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: { token: "t" },
    });
    await fillForm(wrapper, "a@b.com", "rahasia");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).not.toContain("Email wajib diisi.");
    expect(wrapper.text()).not.toContain("Kata sandi wajib diisi.");
  });
});

describe("submit", () => {
  it("login berhasil: menyimpan token, menampilkan dialog, lalu ke beranda", async () => {
    postLoginMock.mockResolvedValue({
      success: true,
      message: "Login berhasil",
      data: { token: "token-baru" },
    });
    const { wrapper, router } = await renderPage();

    await fillForm(wrapper, "  a@b.com  ", "rahasia");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(postLoginMock).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "rahasia",
    });
    expect(getAccessToken()).toBe("token-baru");
    expect(successDialogMock).toHaveBeenCalledWith("Login berhasil");
    expect(router.currentRoute.value.fullPath).toBe("/");
  });

  it("memakai pesan bawaan bila server tidak mengirim pesan", async () => {
    postLoginMock.mockResolvedValue({
      success: true,
      message: "",
      data: { token: "token-baru" },
    });
    const { wrapper } = await renderPage();

    await fillForm(wrapper, "a@b.com", "rahasia");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(successDialogMock).toHaveBeenCalledWith("Login berhasil.");
  });

  it("login gagal: menampilkan dialog error dan tetap di halaman login", async () => {
    postLoginMock.mockRejectedValue(new Error("Email atau password salah"));
    const { wrapper, router } = await renderPage();

    await fillForm(wrapper, "a@b.com", "salah");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(errorDialogMock).toHaveBeenCalledWith("Email atau password salah");
    expect(successDialogMock).not.toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("menonaktifkan tombol dan menampilkan 'Memproses...' selama login", async () => {
    let resolveLogin!: (value: any) => void;
    postLoginMock.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    const { wrapper } = await renderPage();

    await fillForm(wrapper, "a@b.com", "rahasia");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe("Memproses...");
    expect(button.attributes("disabled")).toBeDefined();

    resolveLogin({ success: true, message: "ok", data: { token: "t" } });
    await flushPromises();

    expect(button.text()).toBe("Masuk");
    expect(button.attributes("disabled")).toBeUndefined();
  });
});