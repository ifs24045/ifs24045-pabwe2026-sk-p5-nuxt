<script setup lang="ts">
import { useRoute } from "vue-router";
import { LayoutDashboard, Users, User, X } from "lucide-vue-next";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const route = useRoute();

const menus = [
  { label: "Ringkasan Arus Kas", to: "/", icon: LayoutDashboard },
  { label: "Direktori Pengguna", to: "/users", icon: Users },
  { label: "Profil Saya", to: "/profile", icon: User },
];

function isActive(to: string): boolean {
  if (to === "/") {
    return route.path === "/" || route.path.startsWith("/cash-flows");
  }
  return route.path.startsWith(to);
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
    data-testid="sidebar-backdrop"
    @click="emit('close')"
  ></div>

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-16 items-center justify-between border-b border-slate-200 px-5">
      <div class="flex items-center gap-3">
        <img src="/logo.svg" alt="Logo" width="36" height="36" class="size-9 rounded-xl" />
        <span class="font-bold tracking-tight text-slate-900">Delcom Cash Flow</span>
      </div>
      <button
        type="button"
        class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Tutup menu"
        @click="emit('close')"
      >
        <X class="size-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-1 p-4">
      <RouterLink
        v-for="menu in menus"
        :key="menu.to"
        :to="menu.to"
        class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
        :class="
          isActive(menu.to)
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        "
        @click="emit('close')"
      >
        <component :is="menu.icon" class="size-5" />
        {{ menu.label }}
      </RouterLink>
    </nav>

    <p class="p-5 text-xs text-slate-400">
      &copy; {{ new Date().getFullYear() }} Delcom Cash Flow
    </p>
  </aside>
</template>