import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import ProfilePage from "./ProfilePage.vue";
import { getMe, postMePhoto, putMe, putMePassword } from "../api/userApi";
import { useUsersStore } from "../states/usersStore";
import {
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";
import { renderWithProviders } from "../../../test-utils";

vi.mock("../api/userApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/userApi")>();
  return {
    ...actual,
    getMe: vi.fn(),
    putMe: vi.fn(),
    postMePhoto: vi.fn(),
    putMePassword: vi.fn(),
  };
});

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return {
    ...actual,
    showErrorDialog: vi.fn().mockResolvedValue({}),
    showSuccessDialog: vi.fn().mockResolvedValue({}),
  };
});

const getMeMock = vi.mocked(getMe);
const putMeMock = vi.mocked(putMe);
const postMePhotoMock = vi.mocked(postMePhoto);
const putMePasswordMock = vi.mocked(putMePassword);
const errorDialogMock = vi.mocked(showErrorDialog);
const successDialogMock = vi.mocked(showSuccessDialog);

const profile = {
  id: "1",
  name: "Budi Santoso",
  email: "budi@mail.com",
  photo: null as string | null,
  created_at: "2026-01-15T12:00:00Z",
};

type Wrapper = Awaited<ReturnType<typeof renderPage>>["wrapper"];

function mockProfile(overrides: Record<string, unknown> = {}) {
  getMeMock.mockResolvedValue({
    success: true,
    message: "ok",
    data: { user: { ...profile, ...overrides } },
  });
}

function ok(message = "Berhasil") {
  return { success: true, message, data: null };
}

async function renderPage() {
  const result = await renderWithProviders(ProfilePage);
  await flushPromises();
  return result;
}

function input(wrapper: Wrapper, selector: string) {
  return wrapper.find(selector).element as HTMLInputElement;
}

async function submitProfile(wrapper: Wrapper, name: string, email: string) {
  await wrapper.find("#name").setValue(name);
  await wrapper.find("#email").setValue(email);
  await wrapper.findAll("form")[0].trigger("submit");
  await flushPromises();
}

async function submitPassword(
  wrapper: Wrapper,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  await wrapper.find("#oldPassword").setValue(oldPassword);
  await wrapper.find("#newPassword").setValue(newPassword);
  await wrapper.find("#confirmPassword").setValue(confirmPassword);
  await wrapper.findAll("form")[1].trigger("submit");
  await flushPromises();
}

async function chooseFile(wrapper: Wrapper, files: File[] | null) {
  const fileInput = wrapper.find('[data-testid="photo-input"]');
  Object.defineProperty(fileInput.element, "files", {
    value: files,
    configurable: true,
  });
  await fileInput.trigger("change");
  await flushPromises();
  return fileInput.element as HTMLInputElement;
}

const imageFile = new File(["isi"], "foto.png", { type: "image/png" });

beforeEach(() => {
  getMeMock.mockReset();
  putMeMock.mockReset();
  postMePhotoMock.mockReset();
  putMePasswordMock.mockReset();
  errorDialogMock.mockClear();
  successDialogMock.mockClear();
});

describe("pemuatan profil", () => {
  it("menampilkan kerangka loading selagi profil dimuat", async () => {
    getMeMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = await renderWithProviders(ProfilePage);
    await nextTick();

    expect(wrapper.find(".animate-pulse").exists()).toBe(true);
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("mengisi formulir dan kartu profil setelah data dimuat", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    expect(input(wrapper, "#name").value).toBe("Budi Santoso");
    expect(input(wrapper, "#email").value).toBe("budi@mail.com");
    expect(wrapper.find("h2.text-lg").text()).toBe("Budi Santoso");
    expect(wrapper.text()).toContain("budi@mail.com");
    expect(wrapper.text()).toMatch(/Bergabung .*Januari 2026/);
    expect(wrapper.find(".animate-pulse").exists()).toBe(false);
  });

  it("tidak mengisi formulir bila server tidak mengirim data pengguna", async () => {
    getMeMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: { user: null as any },
    });
    const { wrapper } = await renderPage();

    expect(input(wrapper, "#name").value).toBe("");
    expect(input(wrapper, "#email").value).toBe("");
    expect(errorDialogMock).not.toHaveBeenCalled();
  });

  it("menampilkan dialog error bila gagal dimuat", async () => {
    getMeMock.mockRejectedValue(new Error("Token tidak valid"));
    const { wrapper } = await renderPage();

    expect(errorDialogMock).toHaveBeenCalledWith("Token tidak valid");
    expect(input(wrapper, "#name").value).toBe("");
    expect(wrapper.text()).toContain("?");
  });
});

describe("foto profil", () => {
  it("memakai inisial bila belum ada foto", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    expect(wrapper.find("aside img").exists()).toBe(false);
    expect(wrapper.find("aside span").text()).toBe("BS");
  });

  it("menampilkan foto bila tersedia", async () => {
    mockProfile({ photo: "uploads/budi.jpg" });
    const { wrapper } = await renderPage();

    const img = wrapper.find("aside img");
    expect(img.attributes("src")).toBe(`${DELCOM_BASEURL}/uploads/budi.jpg`);
    expect(img.attributes("alt")).toBe("Budi Santoso");
  });

  it("beralih ke inisial bila foto gagal dimuat, lalu mencoba lagi saat foto berganti", async () => {
    mockProfile({ photo: "uploads/budi.jpg" });
    const { wrapper } = await renderPage();

    await wrapper.find("aside img").trigger("error");
    expect(wrapper.find("aside img").exists()).toBe(false);
    expect(wrapper.find("aside span").text()).toBe("BS");

    useUsersStore().profile!.photo = "uploads/baru.jpg";
    await nextTick();

    expect(wrapper.find("aside img").attributes("src")).toBe(
      `${DELCOM_BASEURL}/uploads/baru.jpg`
    );
  });

  it("tombol kamera membuka pemilih berkas", async () => {
    mockProfile();
    const { wrapper } = await renderPage();
    const clickSpy = vi
      .spyOn(input(wrapper, '[data-testid="photo-input"]'), "click")
      .mockImplementation(() => {});

    await wrapper.find('button[aria-label="Ganti foto profil"]').trigger("click");

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("tidak melakukan apa-apa bila tidak ada berkas dipilih", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await chooseFile(wrapper, []);
    await chooseFile(wrapper, null);

    expect(postMePhotoMock).not.toHaveBeenCalled();
    expect(errorDialogMock).not.toHaveBeenCalled();
  });

  it("menolak berkas yang bukan gambar", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    const fileInput = await chooseFile(wrapper, [
      new File(["teks"], "catatan.txt", { type: "text/plain" }),
    ]);

    expect(errorDialogMock).toHaveBeenCalledWith("Berkas harus berupa gambar.");
    expect(postMePhotoMock).not.toHaveBeenCalled();
    expect(fileInput.value).toBe("");
  });

  it("menolak gambar lebih dari 2 MB", async () => {
    mockProfile();
    const { wrapper } = await renderPage();
    const bigFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "besar.png", {
      type: "image/png",
    });

    await chooseFile(wrapper, [bigFile]);

    expect(errorDialogMock).toHaveBeenCalledWith("Ukuran foto maksimal 2 MB.");
    expect(postMePhotoMock).not.toHaveBeenCalled();
  });

  it("menerima gambar tepat 2 MB", async () => {
    mockProfile();
    postMePhotoMock.mockResolvedValue(ok("Foto diubah"));
    const { wrapper } = await renderPage();
    const exactFile = new File([new Uint8Array(2 * 1024 * 1024)], "pas.png", {
      type: "image/png",
    });

    await chooseFile(wrapper, [exactFile]);

    expect(postMePhotoMock).toHaveBeenCalledWith(exactFile);
  });

  it("mengunggah foto, memuat ulang profil, dan menampilkan dialog sukses", async () => {
    mockProfile();
    postMePhotoMock.mockResolvedValue(ok("Foto diubah"));
    const { wrapper } = await renderPage();

    const fileInput = await chooseFile(wrapper, [imageFile]);

    expect(postMePhotoMock).toHaveBeenCalledWith(imageFile);
    expect(getMeMock).toHaveBeenCalledTimes(2);
    expect(successDialogMock).toHaveBeenCalledWith("Foto diubah");
    expect(fileInput.value).toBe("");
  });

  it("memakai pesan bawaan bila server tidak mengirim pesan", async () => {
    mockProfile();
    postMePhotoMock.mockResolvedValue(ok(""));
    const { wrapper } = await renderPage();

    await chooseFile(wrapper, [imageFile]);

    expect(successDialogMock).toHaveBeenCalledWith(
      "Foto profil berhasil diperbarui."
    );
  });

  it("menampilkan dialog error bila unggah gagal", async () => {
    mockProfile();
    postMePhotoMock.mockRejectedValue(new Error("Unggah gagal"));
    const { wrapper } = await renderPage();

    await chooseFile(wrapper, [imageFile]);

    expect(errorDialogMock).toHaveBeenCalledWith("Unggah gagal");
    expect(successDialogMock).not.toHaveBeenCalled();
  });

  it("menonaktifkan tombol kamera selama mengunggah", async () => {
    mockProfile();
    postMePhotoMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = await renderPage();

    await chooseFile(wrapper, [imageFile]);

    const button = wrapper.find('button[aria-label="Ganti foto profil"]');
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.find(".animate-spin").exists()).toBe(true);
  });
});

describe("formulir informasi akun", () => {
  it("menampilkan pesan wajib diisi bila nama dan email kosong", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await submitProfile(wrapper, "", "");

    expect(wrapper.text()).toContain("Nama wajib diisi.");
    expect(wrapper.text()).toContain("Email wajib diisi.");
    expect(putMeMock).not.toHaveBeenCalled();
  });

  it("menolak email kosong saat nama terisi", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await submitProfile(wrapper, "Budi", "");

    expect(wrapper.text()).not.toContain("Nama wajib diisi.");
    expect(wrapper.text()).toContain("Email wajib diisi.");
    expect(putMeMock).not.toHaveBeenCalled();
  });

  it("menolak format email yang tidak valid", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await submitProfile(wrapper, "Budi", "bukan-email");

    expect(wrapper.text()).toContain("Format email tidak valid.");
    expect(putMeMock).not.toHaveBeenCalled();
  });

  it("menyimpan perubahan dengan nilai yang sudah dirapikan", async () => {
    mockProfile();
    putMeMock.mockResolvedValue(ok("Profil diubah"));
    const { wrapper } = await renderPage();

    await submitProfile(wrapper, "  Budi Baru  ", "  baru@mail.com  ");

    expect(putMeMock).toHaveBeenCalledWith({
      name: "Budi Baru",
      email: "baru@mail.com",
    });
    expect(successDialogMock).toHaveBeenCalledWith("Profil diubah");
    expect(wrapper.find("p.text-red-500").exists()).toBe(false);
  });

  it("memakai pesan bawaan bila server tidak mengirim pesan", async () => {
    mockProfile();
    putMeMock.mockResolvedValue(ok(""));
    const { wrapper } = await renderPage();

    await submitProfile(wrapper, "Budi", "budi@mail.com");

    expect(successDialogMock).toHaveBeenCalledWith("Profil berhasil diperbarui.");
  });

  it("menampilkan dialog error bila gagal menyimpan", async () => {
    mockProfile();
    putMeMock.mockRejectedValue(new Error("Email sudah dipakai"));
    const { wrapper } = await renderPage();

    await submitProfile(wrapper, "Budi", "budi@mail.com");

    expect(errorDialogMock).toHaveBeenCalledWith("Email sudah dipakai");
    expect(successDialogMock).not.toHaveBeenCalled();
  });

  it("menonaktifkan tombol dan menampilkan 'Menyimpan...' selama proses", async () => {
    mockProfile();
    let resolvePut!: (value: any) => void;
    putMeMock.mockReturnValue(
      new Promise((resolve) => {
        resolvePut = resolve;
      })
    );
    const { wrapper } = await renderPage();

    await submitProfile(wrapper, "Budi", "budi@mail.com");

    const button = wrapper.findAll("form")[0].find('button[type="submit"]');
    expect(button.text()).toBe("Menyimpan...");
    expect(button.attributes("disabled")).toBeDefined();

    resolvePut(ok());
    await flushPromises();

    expect(button.text()).toBe("Simpan Perubahan");
    expect(button.attributes("disabled")).toBeUndefined();
  });
});

describe("formulir kata sandi", () => {
  function findToggle(wrapper: Wrapper) {
    return wrapper
      .findAll("button")
      .find((b) => /Tampilkan|Sembunyikan/.test(b.text()))!;
  }

  it("tombol tampilkan/sembunyikan mengubah ketiga kolom", async () => {
    mockProfile();
    const { wrapper } = await renderPage();
    const ids = ["#oldPassword", "#newPassword", "#confirmPassword"];

    expect(findToggle(wrapper).text()).toBe("Tampilkan");
    ids.forEach((id) => expect(wrapper.find(id).attributes("type")).toBe("password"));

    await findToggle(wrapper).trigger("click");
    expect(findToggle(wrapper).text()).toBe("Sembunyikan");
    ids.forEach((id) => expect(wrapper.find(id).attributes("type")).toBe("text"));

    await findToggle(wrapper).trigger("click");
    ids.forEach((id) => expect(wrapper.find(id).attributes("type")).toBe("password"));
  });

  it("menampilkan pesan wajib diisi untuk semua kolom kosong", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "", "", "");

    expect(wrapper.text()).toContain("Kata sandi lama wajib diisi.");
    expect(wrapper.text()).toContain("Kata sandi baru wajib diisi.");
    expect(wrapper.text()).toContain("Konfirmasi kata sandi wajib diisi.");
    expect(putMePasswordMock).not.toHaveBeenCalled();
  });

  it("menolak kata sandi lama yang kosong saat kolom lain benar", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "", "baru1234", "baru1234");

    expect(wrapper.text()).toContain("Kata sandi lama wajib diisi.");
    expect(putMePasswordMock).not.toHaveBeenCalled();
  });

  it("menolak kata sandi baru kurang dari 6 karakter", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "lama123", "12345", "12345");

    expect(wrapper.text()).toContain("Kata sandi baru minimal 6 karakter.");
    expect(putMePasswordMock).not.toHaveBeenCalled();
  });

  it("menolak konfirmasi yang tidak cocok", async () => {
    mockProfile();
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "lama123", "baru1234", "berbeda");

    expect(wrapper.text()).toContain("Konfirmasi kata sandi tidak cocok.");
    expect(putMePasswordMock).not.toHaveBeenCalled();
  });

  it("mengubah kata sandi lalu mengosongkan ketiga kolom", async () => {
    mockProfile();
    putMePasswordMock.mockResolvedValue(ok("Kata sandi diubah"));
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "lama123", "baru1234", "baru1234");

    expect(putMePasswordMock).toHaveBeenCalledWith({
      password: "lama123",
      new_password: "baru1234",
    });
    expect(successDialogMock).toHaveBeenCalledWith("Kata sandi diubah");
    expect(input(wrapper, "#oldPassword").value).toBe("");
    expect(input(wrapper, "#newPassword").value).toBe("");
    expect(input(wrapper, "#confirmPassword").value).toBe("");
  });

  it("memakai pesan bawaan bila server tidak mengirim pesan", async () => {
    mockProfile();
    putMePasswordMock.mockResolvedValue(ok(""));
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "lama123", "baru1234", "baru1234");

    expect(successDialogMock).toHaveBeenCalledWith("Kata sandi berhasil diubah.");
  });

  it("menampilkan dialog error dan mempertahankan isian bila gagal", async () => {
    mockProfile();
    putMePasswordMock.mockRejectedValue(new Error("Kata sandi lama salah"));
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "salah", "baru1234", "baru1234");

    expect(errorDialogMock).toHaveBeenCalledWith("Kata sandi lama salah");
    expect(successDialogMock).not.toHaveBeenCalled();
    expect(input(wrapper, "#oldPassword").value).toBe("salah");
  });

  it("menonaktifkan tombol dan menampilkan 'Memproses...' selama proses", async () => {
    mockProfile();
    let resolvePut!: (value: any) => void;
    putMePasswordMock.mockReturnValue(
      new Promise((resolve) => {
        resolvePut = resolve;
      })
    );
    const { wrapper } = await renderPage();

    await submitPassword(wrapper, "lama123", "baru1234", "baru1234");

    const button = wrapper.findAll("form")[1].find('button[type="submit"]');
    expect(button.text()).toBe("Memproses...");
    expect(button.attributes("disabled")).toBeDefined();

    resolvePut(ok());
    await flushPromises();

    expect(button.text()).toBe("Ubah Kata Sandi");
    expect(button.attributes("disabled")).toBeUndefined();
  });
});