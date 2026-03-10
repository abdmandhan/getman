<template>
  <v-container> </v-container>
</template>

<script setup lang="ts">
const page = ref(1);
const pageSize = ref(10);
const sortBy = ref<{ key: string; order: "desc" | "asc" }[]>([
  { key: "id", order: "desc" },
]);

const query = computed(() =>
  validate({
    page: page.value,
    page_size: pageSize.value,
    sort_by: sortBy.value[0]?.key ?? "id",
    sort_order: sortBy.value[0]?.order ?? "desc",
  }),
);

const { user } = useUserSession();

const headers = ref([
  { title: "ID", key: "id" },
  { title: "Fund", key: "name" },
]);
</script>
