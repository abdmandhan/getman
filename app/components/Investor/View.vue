<template>
  <v-sheet elevation="2">
    <v-tabs v-model="tab" color="primary">
      <v-tab value="details">Details</v-tab>
      <v-tab value="portfolio">Portfolio</v-tab>
      <v-tab value="transactions">Transactions</v-tab>
      <v-tab value="journals">Journals</v-tab>
    </v-tabs>

    <v-divider></v-divider>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="details">
        <v-sheet class="pa-5">
          <InvestorDetail :investor-id="investorId" />
        </v-sheet>
      </v-tabs-window-item>
      <v-tabs-window-item value="portfolio">
        <v-sheet class="pa-5">
          <InvestorPortfolio :investor-id="investorId" />
        </v-sheet>
      </v-tabs-window-item>
      <v-tabs-window-item value="transactions">
        <v-sheet class="pa-5">
          <InvestorTransactions :investor-id="investorId" />
        </v-sheet>
      </v-tabs-window-item>
      <v-tabs-window-item value="journals">
        <v-sheet class="pa-5">
          <InvestorJournal :investor-id="investorId" />
        </v-sheet>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-sheet>
</template>

<script lang="ts" setup>
const { $trpc } = useNuxtApp();
const tab = ref("details");

const props = defineProps<{
  investorId: string;
}>();

const { data: investor } = await $trpc.investor.get.useQuery(() => ({
  id: props.investorId,
}));

if (!investor) {
  throw new Error("Investor not found");
}

// const { data: jobCategoryReferences } = await $trpc.references.useQuery(() => ({ reference_name: "UnitAmountValidationMode" }));
// const { data: jobRoleReferences } = await $trpc.references.useQuery(() => ({ reference_name: "ProductCategory" }));
</script>
