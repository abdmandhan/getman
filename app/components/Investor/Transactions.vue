<template>
  <v-data-table :headers="headers" :items="transactions" density="compact">
    <template #body.prepend>
      <tr>
        <td>
          <v-select
            density="compact"
            :items="[
              { fund: { id: null, code: 'All', name: 'All' } },
              ...transactionFunds,
            ]"
            item-title="fund.code"
            item-value="fund.id"
            hide-details
            v-model="selectedFundId"
          />
        </td>
        <td>
          <v-select
            density="compact"
            :items="[
              { transaction_type: null, name: 'All' },
              { transaction_type: 'SUBSCRIPTION', name: 'Subscription' },
              { transaction_type: 'REDEMPTION', name: 'Redemption' },
              { transaction_type: 'SWITCHING_IN', name: 'Switching In' },
              { transaction_type: 'SWITCHING_OUT', name: 'Switching Out' },
            ]"
            item-title="name"
            item-value="transaction_type"
            hide-details
            v-model="selectedTransactionType"
          />
        </td>
        <td colspan="3"></td>
      </tr>
    </template>
    <template #item.fund.name="{ item }">
      {{ item.fund?.name }}
    </template>
    <template #item.transaction_type="{ item }">
      <v-chip
        density="compact"
        :color="
          item.transaction_type === 'SUBSCRIPTION'
            ? 'green'
            : item.transaction_type === 'REDEMPTION'
              ? 'red'
              : 'blue'
        "
      >
        {{ item.transaction_type }}
      </v-chip>
    </template>
    <template #item.amount="{ item }">
      {{ formatCurrency(Number(item.amount ?? 0)) }}
    </template>
    <template #item.units="{ item }">
      {{ formatThousand(Number(item.units ?? 0)) }}
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
const { $trpc } = useNuxtApp();

const props = defineProps<{
  investorId: string;
}>();

const selectedFundId = ref<number | null>(null);
const selectedTransactionType = ref<
  "SUBSCRIPTION" | "REDEMPTION" | "SWITCHING_IN" | "SWITCHING_OUT" | null
>(null);

const { data: transactions } = await $trpc.investor.transactions.useQuery(
  () => ({
    id: props.investorId,
    fundId: selectedFundId.value ?? undefined,
    transactionType: selectedTransactionType.value ?? undefined,
  }),
);

const { data: transactionFunds } =
  await $trpc.investor.transactionFunds.useQuery(() => ({
    id: props.investorId,
  }));

const headers = ref([
  { title: "Fund", sortable: true, key: "fund.code" },
  { title: "Transaction Type", sortable: true, key: "transaction_type" },
  { title: "Transaction Date", sortable: true, key: "transaction_date" },
  { title: "Units", sortable: true, key: "units" },
  { title: "Amount", sortable: true, key: "amount" },
]);
</script>
