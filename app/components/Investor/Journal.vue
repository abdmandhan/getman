<template>
  <v-data-table
    :headers="headers"
    :items="journals?.items ?? []"
    density="compact"
  >
    <template #item.requested_at="{ item }">
      {{ item.requested_at }}
    </template>
    <template #item.approved_at="{ item }">
      {{ item.approved_at }}
    </template>
    <template #item.rejection_reason="{ item }">
      {{ item.rejection_reason }}
    </template>
  </v-data-table>
</template>

<script lang="ts" setup>
const { $trpc } = useNuxtApp();

const props = defineProps<{
  investorId: string;
}>();

const { data: journals } = await $trpc.investor.journals.useQuery(() => ({
  investorId: props.investorId,
}));

const headers = ref([
  { title: "Requested By", sortable: true, key: "requested_by" },
  { title: "Requested At", sortable: true, key: "requested_at" },
  { title: "Reason", sortable: true, key: "reason" },
  { title: "Approved At", sortable: true, key: "approved_at" },
  { title: "Approved By", sortable: true, key: "approved_by" },
  { title: "Rejection Reason", sortable: true, key: "rejection_reason" },
  { title: "Status", sortable: true, key: "status" },
]);
</script>
