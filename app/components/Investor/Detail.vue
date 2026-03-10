<template>
  <v-form>
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        Investor Details
        <v-chip
          :color="investor?.investor_type_id === 'I' ? 'primary' : 'secondary'"
          density="compact"
        >
          {{ investor?.investor_type_id === "I" ? "Individual" : "Corporate" }}
        </v-chip>
      </div>
      <v-btn color="primary" @click="save">SAVE</v-btn>
    </div>
    <v-row density="compact">
      <v-col cols="12" md="6">
        <v-text-field label="ID" v-model="form.id" disabled />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field label="SID" v-model="form.sid" />
      </v-col>
      <v-col cols="12" md="12">
        <v-text-field label="Full Name" v-model="form.full_name" disabled />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field label="First Name" v-model="form.first_name" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field label="Middle Name" v-model="form.middle_name" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field label="Last Name" v-model="form.last_name" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field label="Email" v-model="form.email" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field label="Phone Number" v-model="form.phone_number" />
      </v-col>

      <!-- investor individual -->
      <template v-if="form.investor_type_id === 'I'">
        <!-- {{ form.investor_individual }} -->
        <v-col cols="12" md="12">
          <v-subheader>Investor Individual</v-subheader>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            label="Birth Date"
            v-model="form.investor_individual.birth_date"
            type="date"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            label="Birth Place"
            v-model="form.investor_individual.birth_place"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            label="Mother Name"
            v-model="form.investor_individual.mother_name"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-switch
            label="Is Employee"
            v-model="form.investor_individual.is_employee"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            label="Tax Number"
            v-model="form.investor_individual.tax_number"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            label="Tax Effective Date"
            v-model="form.investor_individual.tax_effective_date"
            type="date"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Gender"
            v-model="form.investor_individual.gender_id"
            :items="genderReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Education"
            v-model="form.investor_individual.education_id"
            :items="educationReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Card Type"
            v-model="form.investor_individual.card_type_id"
            :items="cardTypeReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            label="Card Number"
            v-model="form.investor_individual.card_number"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Income"
            v-model="form.investor_individual.income_id"
            :items="incomeReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Income Source"
            v-model="form.investor_individual.income_source_id"
            :items="incomeSourceReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Marital Status"
            v-model="form.investor_individual.marital_id"
            :items="maritalReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Nationality"
            v-model="form.investor_individual.nationality_id"
            :items="nationalityReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            label="Job"
            v-model="form.investor_individual.job_id"
            :items="jobReferences"
            item-title="name"
            item-value="code"
          />
        </v-col>
      </template>
      <v-col cols="12">
        <v-subheader>Investor Addresses</v-subheader>
        <v-data-table
          :items="form.investor_addresses"
          :headers="investorAddressHeaders"
        >
          <template #top>
            <div class="d-flex justify-end">
              <v-btn color="primary" @click="addInvestorAddress">
                <v-icon class="mr-2">mdi-plus</v-icon>
                Add Address
              </v-btn>
            </div>
          </template>

          <template #item.address_type_id="{ item }">
            {{
              addressTypes?.find((t) => t.code === item.address_type_id)?.name
            }}
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts" setup>
const { $trpc } = useNuxtApp();
const props = defineProps<{
  investorId: string;
}>();

const { data: investor } = await $trpc.investor.get.useQuery(() => ({
  id: props.investorId,
}));

const form = reactive({
  id: "",
  full_name: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  risk_level_id: 0,
  risk_point: 0,
  sid: "",
  investor_type_id: "",
  version: 1,

  investor_addresses: [] as {
    address: string;
    id: number;
    created_at: string;
    updated_at: string;
    investor_id: string;
    address_type_id: string;
    province_id: string;
    province_text: string | null;
    city_text: string | null;
    district_text: string | null;
    subdistrict_text: string | null;
    postal_code: string | null;
  }[],
  investor_heirs: [] as {
    name: string;
    id: number;
    created_at: string;
    updated_at: string;
    investor_id: string;
    relation_id: string;
  }[],

  investor_individual: {
    birth_date: "",
    birth_place: "",
    mother_name: "",
    is_employee: false,
    tax_number: "",
    tax_effective_date: "",
    gender_id: "",
    education_id: "",
    card_type_id: "",
    card_number: "",
    income_id: "",
    income_source_id: "",
    marital_id: "",
    nationality_id: "",
    job_id: "",
  },
});

const { data: addressTypes } = await $trpc.references.useQuery(() => ({
  reference_name: "AddressType",
}));

const { data: genderReferences } = await $trpc.references.useQuery(() => ({
  reference_name: "Sex",
}));
const { data: educationReferences } = await $trpc.references.useQuery(() => ({
  reference_name: "Education",
}));
const { data: cardTypeReferences } = await $trpc.references.useQuery(() => ({
  reference_name: "IDType",
}));
const { data: incomeReferences } = await $trpc.references.useQuery(() => ({
  reference_name: "Pendapatan/Bulan(I)",
}));
const { data: incomeSourceReferences } = await $trpc.references.useQuery(
  () => ({ reference_name: "IDSourceOfMainIncome" }),
);
const { data: maritalReferences } = await $trpc.references.useQuery(() => ({
  reference_name: "MaritalStatus",
}));
const { data: nationalityReferences } = await $trpc.references.useQuery(() => ({
  reference_name: "Kewarganegaraan",
}));
const { data: jobReferences } = await $trpc.references.useQuery(() => ({
  reference_name: "Jabatan",
}));

watch(
  investor,
  (newVal) => {
    console.log("investor", newVal);
    form.id = newVal?.id ?? "";
    form.full_name = newVal?.full_name ?? "";
    form.first_name = newVal?.first_name ?? "";
    form.middle_name = newVal?.middle_name ?? "";
    form.last_name = newVal?.last_name ?? "";
    form.email = newVal?.email ?? "";
    form.phone_number = newVal?.phone_number ?? "";
    form.risk_level_id = newVal?.risk_level_id ?? 0;
    form.risk_point = newVal?.risk_point ?? 0;
    form.sid = newVal?.sid ?? "";
    form.investor_type_id = newVal?.investor_type_id ?? "";
    form.version = newVal?.version ?? 1;
    form.investor_addresses = newVal?.investor_addresses ?? [];
    form.investor_heirs = newVal?.investor_heirs ?? [];

    if (newVal?.investor_type_id === "I") {
      form.investor_individual = {
        birth_date:
          new Date(newVal?.investor_individuals?.birth_date ?? "")
            .toISOString()
            .split("T")[0] ?? "",
        birth_place: newVal?.investor_individuals?.birth_place ?? "",
        mother_name: newVal?.investor_individuals?.mother_name ?? "",
        is_employee: newVal?.investor_individuals?.is_employee ?? false,
        tax_number: newVal?.investor_individuals?.tax_number ?? "",
        tax_effective_date:
          new Date(newVal?.investor_individuals?.tax_effective_date ?? "")
            .toISOString()
            .split("T")[0] ?? "",
        gender_id: newVal?.investor_individuals?.gender_id ?? "",
        education_id: newVal?.investor_individuals?.education_id ?? "",
        card_type_id: newVal?.investor_individuals?.card_type_id ?? "",
        card_number: newVal?.investor_individuals?.card_number ?? "",
        income_id: newVal?.investor_individuals?.income_id ?? "",
        income_source_id: newVal?.investor_individuals?.income_source_id ?? "",
        marital_id: newVal?.investor_individuals?.marital_id ?? "",
        nationality_id: newVal?.investor_individuals?.nationality_id ?? "",
        job_id: newVal?.investor_individuals?.job_id ?? "",
      };
    }
  },
  { immediate: true, deep: true },
);

const save = () => {
  console.log("submit");
};

const investorAddressHeaders = ref([
  { title: "Address", key: "address", maxWidth: 300 },
  { title: "Address Type", key: "address_type_id" },
  { title: "Province", key: "province_text" },
  { title: "City", key: "city_text" },
  { title: "District", key: "district_text" },
  { title: "Subdistrict", key: "subdistrict_text" },
  { title: "Postal Code", key: "postal_code" },
]);

const addInvestorAddress = () => {
  //   form.investor_addresses.push({
  //     address: "",
  //     id: 0,
  //     created_at: "",
  //     updated_at: "",
  //     investor_id: "",
  //     address_type_id: "Home",
  //     province_id: "",
  //   });
};
</script>
