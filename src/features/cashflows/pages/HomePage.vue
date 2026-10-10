<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  Banknote,
  Eye,
  FilterX,
  HandCoins,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-vue-next";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import type { CashFlow, CashFlowQueryParams } from "../api/cashFlowApi";
import {
  SOURCE_OPTIONS,
  TYPE_OPTIONS,
  getSourceLabel,
  getTypeLabel,
} from "../cashFlowOptions";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import {
  formatDate,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

const cashFlowsStore = useCashFlowsStore();

const filters = reactive({
  type: "",
  source: "",
  label: "",
  start_date: "",
  end_date: "",
});

const showAdd = ref(false);
const showChange = ref(false);
const selected = ref<CashFlow | null>(null);

const hasFilter = computed(() => Object.values(filters).some(Boolean));

const metrics = computed(() => [
  {
    key: "net",
    label: "Total Saldo Kas Bersih",
    value: cashFlowsStore.netBalance,
    icon: Wallet,
    iconClass: "bg-emerald-600 text-white",
    highlight: true,
  },
  {
    key: "inflow",
    label: "Total Pemasukan",
    value: cashFlowsStore.stats.total_inflow,
    icon: TrendingUp,
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    key: "outflow",
    label: "Total Pengeluaran",
    value: cashFlowsStore.stats.total_outflow,
    icon: TrendingDown,
    iconClass: "bg-red-100 text-red-600",
  },
  {
    key: "cash",
    label: "Saldo Kas Tunai",
    value: cashFlowsStore.stats.cash,
    icon: Banknote,
    iconClass: "bg-amber-100 text-amber-600",
  },
  {
    key: "savings",
    label: "Saldo Rekening Tabungan",
    value: cashFlowsStore.stats.savings,
    icon: PiggyBank,
    iconClass: "bg-sky-100 text-sky-600",
  },
  {
    key: "loans",
    label: "Saldo Pinjaman",
    value: cashFlowsStore.stats.loans,
    icon: HandCoins,
    iconClass: "bg-violet-100 text-violet-600",
  },
]);

function typeBadgeClass(type: string): string {
  return type === "inflow"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";
}

function amountClass(type: string): string {
  return type === "inflow" ? "text-emerald-600" : "text-red-600";
}

function formatAmount(item: CashFlow): string {
  return `${item.type === "inflow" ? "+" : "-"} ${formatRupiah(item.nominal)}`;
}

async function loadCashFlows() {
  const result = await cashFlowsStore.fetchCashFlows({
    ...filters,
  } as CashFlowQueryParams);

  if (!result.success) {
    await showErrorDialog(result.message);
  }
}

async function refresh() {
  await Promise.all([loadCashFlows(), cashFlowsStore.fetchLabels()]);
}

function resetFilters() {
  filters.type = "";
  filters.source = "";
  filters.label = "";
  filters.start_date = "";
  filters.end_date = "";
}

function openChange(item: CashFlow) {
  selected.value = item;
  showChange.value = true;
}

async function handleSaved() {
  showAdd.value = false;
  showChange.value = false;
  selected.value = null;
  await refresh();
}

async function handleDelete(item: CashFlow) {
  const confirmed = await showConfirmDialog(
    `Transaksi "${item.label}" akan dihapus permanen.`,
    "Hapus transaksi?",
    "Ya, hapus"
  );
  if (!confirmed) return;

  const result = await cashFlowsStore.removeCashFlow(item.id);
  if (result.success) {
    await showSuccessDialog(result.message || "Transaksi berhasil dihapus.");
    await refresh();
  } else {
    await showErrorDialog(result.message);
  }
}

async function handleDeleteAll() {
  const confirmed = await showConfirmDialog(
    "Seluruh transaksi arus kas Anda akan dihapus dan tidak dapat dikembalikan.",
    "Reset semua transaksi?",
    "Ya, reset semua"
  );
  if (!confirmed) return;

  const result = await cashFlowsStore.removeAllCashFlows();
  if (result.success) {
    await showSuccessDialog(result.message || "Seluruh transaksi berhasil direset.");
    await cashFlowsStore.fetchLabels();
  } else {
    await showErrorDialog(result.message);
  }
}

watch(filters, loadCashFlows);

onMounted(refresh);
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
          Ringkasan Arus Kas
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Pantau pemasukan, pengeluaran, dan saldo Anda.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="btn-danger"
          :disabled="cashFlowsStore.isCashFlowDeleteAll"
          @click="handleDeleteAll"
        >
          <Trash2 class="size-4" />
          Reset Semua
        </button>
        <button type="button" class="btn-primary" @click="showAdd = true">
          <Plus class="size-4" />
          Tambah Transaksi
        </button>
      </div>
    </header>

    <!-- Kartu metrik -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="metric in metrics"
        :key="metric.key"
        class="flex items-center gap-4 rounded-2xl border p-5 shadow-sm"
        :class="
          metric.highlight
            ? 'border-emerald-200 bg-emerald-50/60'
            : 'border-slate-200 bg-white'
        "
      >
        <span class="grid size-12 shrink-0 place-items-center rounded-xl" :class="metric.iconClass">
          <component :is="metric.icon" class="size-6" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {{ metric.label }}
          </p>
          <p class="mt-1 truncate text-xl font-extrabold text-slate-900">
            {{ formatRupiah(metric.value) }}
          </p>
        </div>
      </article>
    </div>

    <!-- Filter -->
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label for="filter-type" class="field-label">Jenis</label>
          <select id="filter-type" v-model="filters.type" class="field-input">
            <option value="">Semua</option>
            <option v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <label for="filter-source" class="field-label">Sumber Dana</label>
          <select id="filter-source" v-model="filters.source" class="field-input">
            <option value="">Semua</option>
            <option v-for="option in SOURCE_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <label for="filter-label" class="field-label">Label</label>
          <select id="filter-label" v-model="filters.label" class="field-input">
            <option value="">Semua</option>
            <option v-for="item in cashFlowsStore.labels" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <div>
          <label for="filter-start" class="field-label">Tanggal Awal</label>
          <input id="filter-start" v-model="filters.start_date" type="date" class="field-input" />
        </div>

        <div>
          <label for="filter-end" class="field-label">Tanggal Akhir</label>
          <input id="filter-end" v-model="filters.end_date" type="date" class="field-input" />
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-3">
        <button type="button" class="btn-secondary" @click="loadCashFlows">
          <RefreshCw class="size-4" :class="{ 'animate-spin': cashFlowsStore.isCashFlows }" />
          Muat Ulang
        </button>
        <button v-if="hasFilter" type="button" class="btn-secondary" @click="resetFilters">
          <FilterX class="size-4" />
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="cashFlowsStore.isCashFlows && cashFlowsStore.cashFlows.length === 0"
      class="space-y-3"
    >
      <div v-for="n in 4" :key="n" class="h-16 animate-pulse rounded-2xl bg-slate-200/70"></div>
    </div>

    <!-- Kosong -->
    <div
      v-else-if="cashFlowsStore.cashFlows.length === 0"
      class="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
    >
      <span class="grid size-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Receipt class="size-7" />
      </span>
      <p class="mt-4 font-semibold text-slate-700">Belum ada transaksi</p>
      <p class="mt-1 text-sm text-slate-500">
        {{ hasFilter ? "Tidak ada transaksi yang cocok dengan filter." : "Mulai catat arus kas pertama Anda." }}
      </p>
    </div>

    <template v-else>
      <!-- Tabel (desktop) -->
      <div class="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-3 font-semibold">Tanggal</th>
              <th class="px-5 py-3 font-semibold">Jenis</th>
              <th class="px-5 py-3 font-semibold">Label</th>
              <th class="px-5 py-3 font-semibold">Sumber</th>
              <th class="px-5 py-3 text-right font-semibold">Nominal</th>
              <th class="px-5 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in cashFlowsStore.cashFlows" :key="item.id" class="hover:bg-slate-50/60">
              <td class="whitespace-nowrap px-5 py-4 text-slate-600">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="px-5 py-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="typeBadgeClass(item.type)"
                >
                  {{ getTypeLabel(item.type) }}
                </span>
              </td>
              <td class="px-5 py-4 font-semibold text-slate-900">{{ item.label }}</td>
              <td class="px-5 py-4 text-slate-600">{{ getSourceLabel(item.source) }}</td>
              <td
                class="whitespace-nowrap px-5 py-4 text-right font-bold"
                :class="amountClass(item.type)"
              >
                {{ formatAmount(item) }}
              </td>
              <td class="px-5 py-4">
                <div class="flex justify-end gap-1">
                  <RouterLink
                    :to="`/cash-flows/${item.id}`"
                    class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Lihat detail"
                  >
                    <Eye class="size-4" />
                  </RouterLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                    aria-label="Ubah"
                    @click="openChange(item)"
                  >
                    <Pencil class="size-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Hapus"
                    @click="handleDelete(item)"
                  >
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Kartu (mobile) -->
      <div class="space-y-3 md:hidden">
        <article
          v-for="item in cashFlowsStore.cashFlows"
          :key="item.id"
          class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate font-semibold text-slate-900">{{ item.label }}</h3>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ getSourceLabel(item.source) }} &middot; {{ formatDate(item.created_at) }}
              </p>
            </div>
            <span
              class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="typeBadgeClass(item.type)"
            >
              {{ getTypeLabel(item.type) }}
            </span>
          </div>

          <p class="mt-3 text-lg font-extrabold" :class="amountClass(item.type)">
            {{ formatAmount(item) }}
          </p>

          <div class="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            <RouterLink :to="`/cash-flows/${item.id}`" class="btn-secondary flex-1 py-2!">
              <Eye class="size-4" /> Detail
            </RouterLink>
            <button type="button" class="btn-secondary py-2!" aria-label="Ubah" @click="openChange(item)">
              <Pencil class="size-4" />
            </button>
            <button type="button" class="btn-danger py-2!" aria-label="Hapus" @click="handleDelete(item)">
              <Trash2 class="size-4" />
            </button>
          </div>
        </article>
      </div>
    </template>

    <AddModal :open="showAdd" @close="showAdd = false" @saved="handleSaved" />
    <ChangeModal
      :open="showChange"
      :cash-flow="selected"
      @close="showChange = false"
      @saved="handleSaved"
    />
  </section>
</template>