import type { RouterConfig } from "nuxt/schema";
import { routes } from "./routes";

export default <RouterConfig>{
  routes: () => routes,
};