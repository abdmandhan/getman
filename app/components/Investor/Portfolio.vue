<template>
  <v-data-table :headers="headers" :items="portfolio">
    <template #item.units_after="{ item }">
      {{ Number(item.units_after).toLocaleString() }}
    </template>
    <template #item.modal="{ item }">
      {{ formatCurrency(Number(item.modal ?? 0)) }}
    </template>
    <template #item.fund.latest_nav.nav_per_unit="{ item }">
      {{ Number(item.fund?.latest_nav?.nav_per_unit ?? 0) }}
    </template>
    <template #item.value="{ item }">
      {{ formatCurrency(Number(item.value ?? 0)) }}
    </template>
    <template #item.profit_and_loss="{ item }">
      <div :class="item.profit_and_loss > 0 ? 'text-green' : 'text-red'">
        {{ formatCurrency(Number(item.profit_and_loss ?? 0)) }}
      </div>
    </template>
    <template #item.return_pct="{ item }">
      <div :class="item.return_pct > 0 ? 'text-green' : 'text-red'">
        {{ item.return_pct.toFixed(2) }}%
      </div>
    </template>
    <template #item.overall_profit_and_loss="{ item }">
      <div
        :class="item.overall_profit_and_loss > 0 ? 'text-green' : 'text-red'"
      >
        {{ formatCurrency(Number(item.overall_profit_and_loss ?? 0)) }}
      </div>
    </template>
    <template #item.overall_return_pct="{ item }">
      <div :class="item.overall_return_pct > 0 ? 'text-green' : 'text-red'">
        {{ item.overall_return_pct.toFixed(2) }}%
      </div>
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
const { $trpc } = useNuxtApp();

const props = defineProps<{
  investorId: string;
}>();

const { data: portfolio } = await $trpc.investor.portfolio.useQuery(() => ({
  id: props.investorId,
}));

const headers = ref([
  { title: "Fund", sortable: true, key: "fund.code" },
  { title: "Modal", sortable: true, key: "modal" },
  { title: "Units", sortable: true, key: "units_after" },
  { title: "Latest NAV", sortable: true, key: "fund.latest_nav.nav_per_unit" },
  { title: "Value", sortable: true, key: "value" },
  { title: "PNL", sortable: true, key: "profit_and_loss" },
  { title: "Return %", sortable: true, key: "return_pct" },
  {
    title: "Overall PNL",
    sortable: true,
    key: "overall_profit_and_loss",
  },
  { title: "Overall Return %", sortable: true, key: "overall_return_pct" },
]);
</script>
