import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import UsersPage from "./UsersPage.vue";
import { getUsers } from "../api/userApi";
import { showErrorDialog } from "../../../helpers/toolsHelper";
import { renderWithProviders } from "../../../test-utils";

vi.mock("../api/userApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/userApi")>();
  return { ...actual, getUsers: vi.fn() };
});

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showErrorDialog: vi.fn().mockResolvedValue({}) };
});

const getUsersMock = vi.mocked(getUsers);
const errorDialogMock = vi.mocked(showErrorDialog);

const users = [
  {
    id: "1",
    name: "Budi Santoso",
    email: "budi@mail.com",
    photo: null,
    created_at: "2026-01-15T12:00:00Z",
  },
  {
    id: "2",
    name: "Siti Aminah",
    email: "siti@mail.com",
    photo: "uploads/siti.jpg",
    created_at: "2026-02-20T12:00:00Z",
  },
  {
    id: "3",
    name: "Candra",
    email: "candra@mail.com",
    photo: "https://cdn.example.com/candra.png",
  },
];

function mockUsers(list = users) {
  getUsersMock.mockResolvedValue({
    success: true,
    message: "ok",
    data: { users: list },
  });
}

async function renderPage() {
  const result = await renderWithProviders(UsersPage);
  await flushPromises();
  return result;
}

beforeEach(() => {
  getUsersMock.mockReset();
  errorDialogMock.mockClear();
});

describe("pemuatan data", () => {
  it("memuat pengguna saat halaman dibuka", async () => {
    mockUsers();

    await renderPage();

    expect(getUsersMock).toHaveBeenCalledTimes(1);
    expect(errorDialogMock).not.toHaveBeenCalled();
  });

  it("menampilkan kerangka loading selagi daftar masih kosong", async () => {
    getUsersMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = await renderWithProviders(UsersPage);
    await nextTick();

    expect(wrapper.findAll(".animate-pulse")).toHaveLength(6);
    expect(wrapper.find("article").exists()).toBe(false);
  });

  it("menampilkan dialog error bila gagal memuat", async () => {
    getUsersMock.mockRejectedValue(new Error("Gagal memuat pengguna"));

    const { wrapper } = await renderPage();

    expect(errorDialogMock).toHaveBeenCalledWith("Gagal memuat pengguna");
    expect(wrapper.text()).toContain("Pengguna tidak ditemukan");
  });
});

describe("daftar pengguna", () => {
  it("menampilkan nama, email, dan tanggal bergabung", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    const cards = wrapper.findAll("article");
    expect(cards).toHaveLength(3);
    expect(cards[0].text()).toContain("Budi Santoso");
    expect(cards[0].text()).toContain("budi@mail.com");
    expect(cards[0].text()).toMatch(/Bergabung .*Januari 2026/);
    expect(cards[2].text()).toContain("Bergabung -");
  });

  it("memakai inisial bila pengguna tidak punya foto", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    const first = wrapper.findAll("article")[0];
    expect(first.find("img").exists()).toBe(false);
    expect(first.text()).toContain("BS");
  });

  it("menampilkan foto dari path relatif maupun URL absolut", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    const images = wrapper.findAll("img");
    expect(images).toHaveLength(2);
    expect(images[0].attributes("src")).toBe(`${DELCOM_BASEURL}/uploads/siti.jpg`);
    expect(images[1].attributes("src")).toBe("https://cdn.example.com/candra.png");
    expect(images[0].attributes("alt")).toBe("Siti Aminah");
  });

  it("beralih ke inisial bila foto gagal dimuat", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    await wrapper.findAll("img")[0].trigger("error");

    expect(wrapper.findAll("img")).toHaveLength(1);
    expect(wrapper.findAll("article")[1].text()).toContain("SA");
  });
});

describe("pencarian", () => {
  it("menyaring berdasarkan nama tanpa membedakan huruf besar-kecil", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    await wrapper.find('input[type="search"]').setValue("SITI");

    const cards = wrapper.findAll("article");
    expect(cards).toHaveLength(1);
    expect(cards[0].text()).toContain("Siti Aminah");
  });

  it("menyaring berdasarkan email dan mengabaikan spasi di tepi", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    await wrapper.find('input[type="search"]').setValue("  candra@mail  ");

    const cards = wrapper.findAll("article");
    expect(cards).toHaveLength(1);
    expect(cards[0].text()).toContain("Candra");
  });

  it("menampilkan semua pengguna bila kata kunci hanya spasi", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    await wrapper.find('input[type="search"]').setValue("   ");

    expect(wrapper.findAll("article")).toHaveLength(3);
  });

  it("menampilkan pesan kosong bila tidak ada yang cocok", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    await wrapper.find('input[type="search"]').setValue("tidak-ada");

    expect(wrapper.find("article").exists()).toBe(false);
    expect(wrapper.text()).toContain("Pengguna tidak ditemukan");
  });
});

describe("tombol Muat Ulang", () => {
  function findReloadButton(wrapper: Awaited<ReturnType<typeof renderPage>>["wrapper"]) {
    return wrapper.findAll("button").find((b) => b.text().includes("Muat Ulang"))!;
  }

  it("memuat ulang data pengguna", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    await findReloadButton(wrapper).trigger("click");
    await flushPromises();

    expect(getUsersMock).toHaveBeenCalledTimes(2);
  });

  it("tetap menampilkan daftar dan menonaktifkan tombol selama memuat ulang", async () => {
    mockUsers();
    const { wrapper } = await renderPage();

    getUsersMock.mockReturnValue(new Promise(() => {}));
    await findReloadButton(wrapper).trigger("click");
    await nextTick();

    expect(findReloadButton(wrapper).attributes("disabled")).toBeDefined();
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
    expect(wrapper.findAll("article")).toHaveLength(3);
    expect(wrapper.find(".animate-pulse").exists()).toBe(false);
  });
});