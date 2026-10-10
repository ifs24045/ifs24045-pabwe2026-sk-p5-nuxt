import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import App from "./App.vue";

describe("App", () => {
  it("merender NuxtPage sebagai konten utama", () => {
    const NuxtPage = defineComponent({
      render: () => h("main", { "data-testid": "nuxt-page" }, "Halaman"),
    });
    const wrapper = mount(App, { global: { stubs: { NuxtPage } } });
    expect(wrapper.find('[data-testid="nuxt-page"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Halaman");
  });
});