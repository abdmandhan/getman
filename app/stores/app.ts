// Utilities
import { defineStore } from 'pinia'
import type { Authorization, Environment } from '~~/prisma/generated/client'

const SELECTED_ENV_STORAGE_KEY = 'getman-selected-environment-id'

export const useAppStore = defineStore('app', {
  state: () => ({
    //
    authorizations: [] as Authorization[],
    environments: [] as Environment[],
    selectedEnvironment: null as Environment | null,
  }),
  actions: {
    setSelectedEnvironment(env: Environment | null) {
      this.selectedEnvironment = env
      if (import.meta.client) {
        if (env) {
          localStorage.setItem(SELECTED_ENV_STORAGE_KEY, env.id)
        } else {
          localStorage.removeItem(SELECTED_ENV_STORAGE_KEY)
        }
      }
    },
    async fetchAuthorizations() {
      const res = await $fetch<Authorization[]>("/api/authorizations", {});
      this.authorizations = res ?? [];
    },
    async fetchEnvironments() {
      const res = await $fetch<Environment[]>("/api/environments", {});
      this.environments = res ?? [];
      console.log('storedId', import.meta.client)
      if (import.meta.client) {
        const storedId = localStorage.getItem(SELECTED_ENV_STORAGE_KEY)
        if (storedId) {
          const env = this.environments.find((e) => e.id === storedId) ?? null
          this.selectedEnvironment = env
        }
      }
    },
  },
})
