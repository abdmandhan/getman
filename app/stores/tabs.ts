import { defineStore } from 'pinia'

export type HttpMethod =
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'

export interface RequestTab {
    id: string
    requestId: string
    title: string
    method: HttpMethod
    route: string
    dirty?: boolean
}

interface OpenTabPayload {
    requestId: string
    title: string
    method: HttpMethod
    route: string
}

export const useRequestTabsStore = defineStore('request-tabs', {
    state: () => ({
        tabs: [
            {
                id: '1',
                requestId: '1',
                title: 'Request 1',
                method: 'GET',
                route: '/requests/1',
                dirty: false,
            },
            {
                id: '2',
                requestId: '2',
                title: 'Request 2',
                method: 'POST',
                route: '/requests/2',
                dirty: false,
            },
            {
                id: '3',
                requestId: '3',
                title: 'Request 3',
                method: 'PUT',
                route: '/requests/3',
                dirty: false,
            },
        ] as RequestTab[],
        activeTabId: null as string | null,
    }),

    getters: {
        activeTab: (state) => {
            return state.tabs.find((tab) => tab.id === state.activeTabId) ?? null
        },
        hasTabs: (state) => state.tabs.length > 0,
    },

    actions: {
        openTab(payload: OpenTabPayload) {
            const existing = this.tabs.find((tab) => tab.route === payload.route)

            if (existing) {
                this.activeTabId = existing.id
                return existing
            }

            const newTab: RequestTab = {
                id: crypto.randomUUID(),
                requestId: payload.requestId,
                title: payload.title,
                method: payload.method,
                route: payload.route,
                dirty: false,
            }

            this.tabs.push(newTab)
            this.activeTabId = newTab.id

            return newTab
        },

        setActiveById(tabId: string | null) {
            this.activeTabId = tabId
        },

        setActiveByRoute(route: string) {
            const tab = this.tabs.find((item) => item.route === route)
            this.activeTabId = tab?.id ?? null
        },

        closeTab(tabId: string) {
            const closingIndex = this.tabs.findIndex((tab) => tab.id === tabId)
            if (closingIndex === -1) return null

            const closingTab = this.tabs[closingIndex]
            const wasActive = this.activeTabId === tabId

            this.tabs.splice(closingIndex, 1)

            if (!wasActive) {
                return null
            }

            const nextTab =
                this.tabs[closingIndex] ??
                this.tabs[closingIndex - 1] ??
                null

            this.activeTabId = nextTab?.id ?? null

            return nextTab
        },

        closeOtherTabs(tabId: string) {
            const keep = this.tabs.find((tab) => tab.id === tabId)
            if (!keep) return

            this.tabs = [keep]
            this.activeTabId = keep.id
        },

        closeAllTabs() {
            this.tabs = []
            this.activeTabId = null
        },

        updateTab(tabId: string, partial: Partial<RequestTab>) {
            const index = this.tabs.findIndex((tab) => tab.id === tabId)

            if (index === -1) return

            const tab = this.tabs[index]
            if (!tab) return

            this.tabs[index] = {
                ...tab,
                ...this.tabs[index],
                ...partial,
            }
        },

        markDirty(tabId: string, dirty = true) {
            const tab = this.tabs.find((item) => item.id === tabId)
            if (!tab) return
            tab.dirty = dirty
        },

        reorderTabs(newTabs: RequestTab[]) {
            this.tabs = newTabs
        },

        ensureTab(payload: OpenTabPayload) {
            const existing = this.tabs.find((tab) => tab.route === payload.route)

            if (existing) {
                this.updateTab(existing.id, {
                    title: payload.title,
                    method: payload.method,
                    requestId: payload.requestId,
                    route: payload.route,
                })
                return existing
            }

            return this.openTab(payload)
        },
    },

})