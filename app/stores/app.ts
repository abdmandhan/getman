// Utilities
import { defineStore } from 'pinia'
import type { Authorization, Environment } from '~~/prisma/generated/client'

export const useAppStore = defineStore('app', {
  state: () => ({
    //
    authorizations: [] as Authorization[],
    environments: [] as Environment[],
    selectedEnvironment: null as Environment | null,
  }),
  actions: {
    setSelectedEnvironment(env: Environment | null) {
      this.selectedEnvironment = env;
    },
    async fetchAuthorizations() {
      const res = await $fetch<Authorization[]>("/api/authorizations", {});
      this.authorizations = res ?? [];
    },
    async fetchEnvironments() {
      const res = await $fetch<Environment[]>("/api/environments", {});
      this.environments = res ?? [];
    },
  },
})
