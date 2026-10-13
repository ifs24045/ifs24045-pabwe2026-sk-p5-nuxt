<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { TrendingUp, PiggyBank, ShieldCheck } from "lucide-vue-next";
import { useAuthStore } from "../states/authStore";

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace("/");
  }
});
</script>

<template>
  <div class="flex min-h-screen bg-white">
    <!-- Banner (desktop) -->
    <aside
      class="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 text-white lg:flex"
    >
      <div
        class="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-teal-300/20 blur-3xl"
      ></div>

      <div class="relative flex items-center gap-3">
        <img src="/logo.svg" alt="Logo" width="40" height="40" class="size-10 rounded-xl" />
        <span class="text-xl font-bold tracking-tight">Delcom Cash Flow</span>
      </div>

      <div class="relative space-y-8">
        <div class="space-y-3">
          <p class="text-4xl font-extrabold leading-tight">
            Kelola arus kas Anda dengan lebih cerdas.
          </p>
          <p class="max-w-md text-emerald-100">
            Catat pemasukan dan pengeluaran, pantau saldo tunai, tabungan, dan
            pinjaman dalam satu dashboard yang rapi.
          </p>
        </div>

        <ul class="space-y-4 text-sm">
          <li class="flex items-center gap-3">
            <span class="grid size-9 place-items-center rounded-lg bg-white/15">
              <TrendingUp class="size-5" />
            </span>
            Ringkasan pemasukan &amp; pengeluaran real-time
          </li>
          <li class="flex items-center gap-3">
            <span class="grid size-9 place-items-center rounded-lg bg-white/15">
              <PiggyBank class="size-5" />
            </span>
            Pisahkan dana tunai, tabungan, dan pinjaman
          </li>
          <li class="flex items-center gap-3">
            <span class="grid size-9 place-items-center rounded-lg bg-white/15">
              <ShieldCheck class="size-5" />
            </span>
            Data aman dengan autentikasi berbasis token
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-emerald-200">
        &copy; {{ new Date().getFullYear() }} Delcom Cash Flow
      </p>
    </aside>

    <!-- Form -->
    <main class="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
      <div class="w-full max-w-md">
        <div class="mb-8 flex items-center gap-3 lg:hidden">
          <img src="/logo.svg" alt="Logo" width="40" height="40" class="size-10 rounded-xl" />
          <span class="text-xl font-bold tracking-tight text-slate-900">
            Delcom Cash Flow
          </span>
        </div>

        <RouterView />
      </div>
    </main>
  </div>
</template>