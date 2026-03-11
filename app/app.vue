<template>
  <v-theme-provider>
    <v-app>
      <v-defaults-provider
        :defaults="{
          VSelect: { density: 'compact', color: 'primary' },
          VDataTable: { density: 'compact', color: 'primary' },
          VDataTableServer: { density: 'compact', color: 'primary' },
          VTextField: {
            density: 'compact',
            color: 'primary',
            variant: 'outlined',
          },
          VSwitch: { density: 'compact', color: 'primary' },
          VTab: { density: 'compact', color: 'primary' },
          VTable: { density: 'compact', color: 'primary' },
          VCheckboxBtn: { density: 'compact', color: 'primary' },
          VRadioGroup: { color: 'primary' },
          // VCard: {
          //   rounded: 'lg',
          //   elevation: 2,
          //   color: 'grey-lighten-4',
          // },
          // VCardTitle: {
          //   class: 'bg-white mx-1 mt-1 rounded-t-lg px-3',
          // },
          // VCardText: {
          //   class: 'bg-white mx-1 mb-1 rounded-b-lg px-3',
          // },
          // VCardActions: {
          //   class: 'mx-1 mb-1 rounded-b-lg px-3 !py-0',
          // },
          VButton: { rounded: 'lg' },
        }"
      >
        <NuxtLayout>
          <NuxtLoadingIndicator />
          <NuxtPage />
        </NuxtLayout>
      </v-defaults-provider>
    </v-app>
  </v-theme-provider>
</template>

<script lang="ts" setup>
import type { VTab, VTable } from "vuetify/components";
</script>
