// Utilities
import { defineStore } from 'pinia'
import type { Authorization } from '~~/prisma/generated/client'

export const useAppStore = defineStore('app', {
  state: () => ({
    //
    authorizations: [] as Authorization[],
  }),
  actions: {
    async fetchAuthorizations() {
      // const { data } = await useAsyncData("/api/authorizations", async () => {
      //   const res = await $fetch("/api/authorizations");
      //   return res as Authorization[];
      // });
      const res = await $fetch<Authorization[]>("/api/authorizations", {});
      this.authorizations = res ?? [];
    },
  },
})
