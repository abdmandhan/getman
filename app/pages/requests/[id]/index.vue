<template>
  <div>selected key: {{ selectedKey }}</div>
</template>

<script setup lang="ts">
const selectedKey = ref();

onMounted(() => {
  selectedKey.value = useRoute().params.id;
});
</script>
