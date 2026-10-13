<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { LogOut, Menu } from "lucide-vue-next";
import { useAuthStore } from "../../auth/states/authStore";
import { useUsersStore } from "../../users/states/usersStore";
import { getUserInitials } from "../../users/api/userApi";
import { showConfirmDialog } from "../../../helpers/toolsHelper";

const emit = defineEmits<{ "toggle-sidebar": [] }>();

const router = useRouter();
const authStore = useAuthStore();
const usersStore = useUsersStore();

const name = computed(() => usersStore.profile?.name ?? "Pengguna");
const username = computed(() => {
  const email = usersStore.profile?.email ?? "";
  return email ? `@${email.split("@")[0]}` : "";
});

async function handleLogout() {
  const confirmed = await showConfirmDialog(
    "Anda akan keluar dari sesi ini.",
    "Keluar dari akun?",
    "Ya, keluar"
  );
  if (!confirmed) return;

  authStore.logout();
  usersStore.profile = null;
  await router.push("/auth/login");
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6"
  >
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
        @click="emit('toggle-sidebar')"
      >
        <Menu class="size-6" />
      </button>

      <span
        class="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex"
      >
        <span class="size-2 rounded-full bg-emerald-500"></span>
        Sesi aktif
      </span>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-3">
        <span
          class="grid size-10 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
        >
          {{ getUserInitials(usersStore.profile?.name) }}
        </span>
        <div class="hidden text-left leading-tight sm:block">
          <p class="text-sm font-semibold text-slate-900">{{ name }}</p>
          <p class="text-xs text-slate-500">{{ username }}</p>
        </div>
      </div>

      <button
        type="button"
        class="btn-secondary px-3! py-2!"
        aria-label="Keluar"
        @click="handleLogout"
      >
        <LogOut class="size-4" />
        <span class="hidden sm:inline">Keluar</span>
      </button>
    </div>
  </header>
</template>