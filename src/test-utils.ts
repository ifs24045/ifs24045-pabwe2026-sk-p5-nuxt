import { defineComponent, h, type Component } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import {
  createMemoryHistory,
  createRouter,
  type Router,
  type RouteRecordRaw,
} from "vue-router";

export function createMockPinia(): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

const BlankPage = defineComponent({ render: () => h("div") });

export interface RenderOptions {
  /** Alamat awal pada memory router. Default: "/" */
  route?: string;
  /** Daftar rute. Default: satu rute wildcard kosong. */
  routes?: RouteRecordRaw[];
  props?: Record<string, any>;
  slots?: Record<string, any>;
  pinia?: Pinia;
}

export interface RenderResult {
  wrapper: VueWrapper<any>;
  router: Router;
  pinia: Pinia;
}

export async function renderWithProviders(
  component: Component,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const pinia = options.pinia ?? createMockPinia();

  const router = createRouter({
    history: createMemoryHistory(),
    routes: options.routes ?? [
      { path: "/:pathMatch(.*)*", component: BlankPage },
    ],
  });

  await router.push(options.route ?? "/");
  await router.isReady();

  const wrapper = mount(component, {
    props: options.props,
    slots: options.slots,
    global: { plugins: [pinia, router] },
  });

  return { wrapper, router, pinia };
}