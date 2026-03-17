import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestTabsStore, type HttpMethod } from '@/stores/tabs'

interface SyncRequestTabOptions {
    enabled: boolean
    requestId?: string
    title?: string
    method?: HttpMethod
}

export function useRequestTabsSync(options: SyncRequestTabOptions) {
    const route = useRoute()
    const tabsStore = useRequestTabsStore()

    const routePath = computed(() => route.fullPath)

    function syncFromRoute() {
        if (!options.enabled) return

        if (!options.requestId || !options.title || !options.method) return

        tabsStore.ensureTab({
            requestId: options.requestId,
            title: options.title,
            method: options.method,
            route: routePath.value,
        })

        tabsStore.setActiveByRoute(routePath.value)
    }

    watch(
        () => route.fullPath,
        () => {
            tabsStore.setActiveByRoute(route.fullPath)
        },
        { immediate: true }
    )

    watch(
        () => [options.requestId, options.title, options.method, options.enabled],
        () => {
            syncFromRoute()
        },
        { immediate: true }
    )

    return {
        syncFromRoute,
    }
}