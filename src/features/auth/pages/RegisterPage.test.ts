import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises } from "@vue/test-utils";
import RegisterPage from "./RegisterPage.vue";
import { postRegister } from "../api/authApi";
import {
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";
import { renderWithProviders } from "../../../test-utils";

vi.mock("../api/authApi", () => ({
  postLogin: vi.fn(),
  postRegister: vi.fn(),
}));

vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn().mockResolvedValue({}),
  showErrorDialog: vi.fn().mockResolvedValue({}),
}));

const postRegisterMock = vi.mocked(postRegister);
const successDialogMock = vi.mocked(showSuccessDialog);
const errorDialogMock = vi.mocked(showErrorDialog);

const Stub = defineComponent({ render: () => h("div") });
const routes = [
  { path: "/auth/register", component: RegisterPage },
  { path: "/auth/login", component: Stub },
];

async function renderPage() {
  return renderWithProviders(RegisterPage, {
    route: "/auth/register",
    routes,
  });
}

async function fillForm(
  wrapper: Awaited<ReturnType<typeof renderPage>>["wrapper"],
  values: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }
) {
  await wrapper.find("#name").setValue(values.name ?? "");
  await wrapper.find("#email").setValue(values.email ?? "");
  await wrapper.find("#password").setValue(values.password ?? "");
  await wrapper.find("#confirmPassword").setValue(values.confirmPassword ?? "");
}

const validValues = {
  name: "Budi Santoso",
  email: "budi@mail.com",
  password: "rahasia123",
  confirmPassword: "rahasia123",
};

beforeEach(() => {
  postRegisterMock.mockReset();
  successDialogMock.mockClear();
  errorDialogMock.mockClear();
});

describe("tampilan awal", () => {
  it("menampilkan judul, seluruh kolom, dan tautan ke halaman login", async () => {
    const { wrapper } = await renderPage();

    expect(wrapper.text()).toContain("Buat akun baru");
    expect(wrapper.find("#name").exists()).toBe(true);
    expect(wrapper.find("#email").exists()).toBe(true);
    expect(wrapper.find("#password").attributes("type")).toBe("password");
    expect(wrapper.find("#confirmPassword").attributes("type")).toBe("password");
    expect(wrapper.find('a[href="/auth/login"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe("Daftar");
    expect(wrapper.find("p.text-red-500").exists()).toBe(false);
  });

  it("tombol mata mengubah tampilan kedua kolom kata sandi", async () => {
    const { wrapper } = await renderPage();
    const toggle = wrapper.find('button[type="button"]');

    expect(toggle.attributes("aria-label")).toBe("Tampilkan kata sandi");

    await toggle.trigger("click");
    expect(wrapper.find("#password").attributes("type")).toBe("text");
    expect(wrapper.find("#confirmPassword").attributes("type")).toBe("text");
    expect(toggle.attributes("aria-label")).toBe("Sembunyikan kata sandi");

    await toggle.trigger("click");
    expect(wrapper.find("#password").attributes("type")).toBe("password");
    expect(wrapper.find("#confirmPassword").attributes("type")).toBe("password");
  });
});

describe("validasi", () => {
  it("menampilkan pesan wajib diisi untuk semua kolom kosong", async () => {
    const { wrapper } = await renderPage();

    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Nama lengkap wajib diisi.");
    expect(wrapper.text()).toContain("Email wajib diisi.");
    expect(wrapper.text()).toContain("Kata sandi wajib diisi.");
    expect(wrapper.text()).toContain("Konfirmasi kata sandi wajib diisi.");
    expect(postRegisterMock).not.toHaveBeenCalled();
  });

  it("menolak format email yang tidak valid", async () => {
    const { wrapper } = await renderPage();

    await fillForm(wrapper, { ...validValues, email: "bukan-email" });
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Format email tidak valid.");
    expect(postRegisterMock).not.toHaveBeenCalled();
  });

  it("menolak kata sandi kurang dari 6 karakter", async () => {
    const { wrapper } = await renderPage();

    await fillForm(wrapper, {
      ...validValues,
      password: "12345",
      confirmPassword: "12345",
    });
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Kata sandi minimal 6 karakter.");
    expect(postRegisterMock).not.toHaveBeenCalled();
  });

  it("menolak konfirmasi kata sandi yang tidak cocok", async () => {
    const { wrapper } = await renderPage();

    await fillForm(wrapper, { ...validValues, confirmPassword: "berbeda" });
    await wrapper.find("form").trigger("submit");

    expect(wrapper.text()).toContain("Konfirmasi kata sandi tidak cocok.");
    expect(wrapper.text()).not.toContain("Kata sandi minimal 6 karakter.");
    expect(postRegisterMock).not.toHaveBeenCalled();
  });

  it("menghapus pesan error setelah isian diperbaiki", async () => {
    const { wrapper } = await renderPage();

    await wrapper.find("form").trigger("submit");
    expect(wrapper.text()).toContain("Nama lengkap wajib diisi.");

    postRegisterMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: null,
    });
    await fillForm(wrapper, validValues);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find("p.text-red-500").exists()).toBe(false);
  });
});

describe("submit", () => {
  it("registrasi berhasil: menampilkan dialog lalu ke halaman login", async () => {
    postRegisterMock.mockResolvedValue({
      success: true,
      message: "Registrasi berhasil",
      data: null,
    });
    const { wrapper, router } = await renderPage();

    await fillForm(wrapper, {
      ...validValues,
      name: "  Budi Santoso  ",
      email: "  budi@mail.com  ",
    });
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(postRegisterMock).toHaveBeenCalledWith({
      name: "Budi Santoso",
      email: "budi@mail.com",
      password: "rahasia123",
    });
    expect(successDialogMock).toHaveBeenCalledWith("Registrasi berhasil");
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("memakai pesan bawaan bila server tidak mengirim pesan", async () => {
    postRegisterMock.mockResolvedValue({ success: true, message: "", data: null });
    const { wrapper } = await renderPage();

    await fillForm(wrapper, validValues);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(successDialogMock).toHaveBeenCalledWith(
      "Registrasi berhasil. Silakan login."
    );
  });

  it("registrasi gagal: menampilkan dialog error dan tetap di halaman", async () => {
    postRegisterMock.mockRejectedValue(new Error("Email sudah terdaftar"));
    const { wrapper, router } = await renderPage();

    await fillForm(wrapper, validValues);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(errorDialogMock).toHaveBeenCalledWith("Email sudah terdaftar");
    expect(successDialogMock).not.toHaveBeenCalled();
    expect(router.currentRoute.value.fullPath).toBe("/auth/register");
  });

  it("menonaktifkan tombol dan menampilkan 'Memproses...' selama registrasi", async () => {
    let resolveRegister!: (value: any) => void;
    postRegisterMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );
    const { wrapper } = await renderPage();

    await fillForm(wrapper, validValues);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe("Memproses...");
    expect(button.attributes("disabled")).toBeDefined();

    resolveRegister({ success: true, message: "ok", data: null });
    await flushPromises();

    expect(button.text()).toBe("Daftar");
    expect(button.attributes("disabled")).toBeUndefined();
  });
});