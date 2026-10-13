import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  // Auth Routes: /auth membungkus AuthLayout
  {
    path: "/auth",
    component: () => import("./features/auth/layouts/AuthLayout.vue"),
    children: [
      { path: "", redirect: "/auth/login" },
      {
        path: "login",
        name: "login",
        component: () => import("./features/auth/pages/LoginPage.vue"),
      },
      {
        path: "register",
        name: "register",
        component: () => import("./features/auth/pages/RegisterPage.vue"),
      },
    ],
  },

  // Protected Dashboard Routes: / membungkus CashFlowLayout
  {
    path: "/",
    component: () => import("./features/cashflows/layouts/CashFlowLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        component: () => import("./features/cashflows/pages/HomePage.vue"),
      },
      {
        path: "cash-flows/:cashFlowId",
        name: "cash-flow-detail",
        component: () => import("./features/cashflows/pages/DetailPage.vue"),
      },
      {
        path: "users",
        name: "users",
        component: () => import("./features/users/pages/UsersPage.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("./features/users/pages/ProfilePage.vue"),
      },
    ],
  },

  // Wildcard Route: 404
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("./features/common/pages/NotFoundPage.vue"),
  },
];