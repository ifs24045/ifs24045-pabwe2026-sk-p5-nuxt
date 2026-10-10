import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "./routes";
import routerOptions from "./router.options";

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

describe("routes", () => {
  it("memiliki rute auth, dashboard, dan wildcard", () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toEqual(["/auth", "/", "/:pathMatch(.*)*"]);
  });

  it("/auth dialihkan ke /auth/login", async () => {
    const router = makeRouter();
    await router.push("/auth");
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
    expect(router.currentRoute.value.name).toBe("login");
  });

  it("mengenali /auth/register", async () => {
    const router = makeRouter();
    await router.push("/auth/register");
    expect(router.currentRoute.value.name).toBe("register");
  });

  it.each([
    ["/", "home"],
    ["/users", "users"],
    ["/profile", "profile"],
  ])("mengenali %s sebagai %s", async (path, name) => {
    const router = makeRouter();
    await router.push(path);
    expect(router.currentRoute.value.name).toBe(name);
  });

  it("mengenali detail cash flow beserta parameternya", async () => {
    const router = makeRouter();
    await router.push("/cash-flows/abc-123");
    expect(router.currentRoute.value.name).toBe("cash-flow-detail");
    expect(router.currentRoute.value.params.cashFlowId).toBe("abc-123");
  });

  it("alamat tidak dikenal menuju halaman 404", async () => {
    const router = makeRouter();
    await router.push("/tidak/ada");
    expect(router.currentRoute.value.name).toBe("not-found");
  });

  it("router.options menyediakan daftar rute yang sama", () => {
    const options = routerOptions as unknown as { routes: () => unknown };
    expect(options.routes()).toBe(routes);
  });
});