<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { LoaderCircle } from "lucide-vue-next";
import { useAuthStore } from "../../auth/states/authStore";
import { useUsersStore } from "../../users/states/usersStore";
import NavbarComponent from "../components/NavbarComponent.vue";
import SidebarComponent from "../components/SidebarComponent.vue";

const router = useRouter();
const authStore = useAuthStore();
const usersStore = useUsersStore();

const sidebarOpen = ref(false);
const ready = ref(false);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await router.replace("/auth/login");
    return;
  }

  const result = await usersStore.fetchProfile();
  if (!result.success) {
    authStore.logout();
    await router.replace("/auth/login");
    return;
  }

  ready.value = true;
});
</script>

<template>
  <div v-if="ready" class="min-h-screen bg-slate-50">
    <SidebarComponent :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="lg:pl-64">
      <NavbarComponent @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="mx-auto max-w-7xl p-4 sm:p-6">
        <RouterView />
      </main>
    </div>
  </div>

  <div v-else class="grid min-h-screen place-items-center bg-slate-50">
    <LoaderCircle class="size-8 animate-spin text-emerald-600" />
  </div>
</template>