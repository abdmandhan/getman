<template>
  <!-- class="flex items-center border-b border-neutral-800 dark:border-neutral-200 bg-neutral-950 dark:bg-neutral-100 px-2 mt-2" -->
  <div
    class="flex items-center border-b border-neutral-800 px-2 mt-2"
    @keydown="onKeydown"
    tabindex="0"
  >
    <VueDraggable
      v-model="draggableTabs"
      item-key="id"
      class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-thin"
      :animation="180"
      ghost-class="opacity-50"
      chosen-class="opacity-80"
      drag-class="rotate-[1deg]"
      @end="onDragEnd"
    >
      <div
        v-for="tab in draggableTabs"
        :key="tab.id"
        class="group flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-t-md border border-b-0 px-3 text-sm transition"
        :class="
          tab.id === tabsStore.activeTabId
            ? 'border-neutral-700 dark:border-blue-500 bg-neutral-800 dark:bg-blue-500 text-white dark:text-neutral-900'
            : 'border-transparent bg-neutral-900 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-850 hover:text-neutral-200 dark:hover:bg-blue-500 dark:hover:text-white'
        "
        @click="goToTab(tab)"
        @auxclick="onMiddleClick($event, tab)"
      >
        <span
          class="text-[11px] font-semibold"
          :class="methodClass(tab.method)"
        >
          {{ tab.method }}
        </span>

        <span class="max-w-[180px] truncate">
          {{ tab.title }}
        </span>

        <span
          v-if="tab.dirty"
          class="h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-600"
          title="Unsaved changes"
        />

        <button
          class="ml-1 flex h-5 w-5 items-center justify-center rounded text-neutral-400 opacity-0 transition hover:bg-neutral-700 hover:text-white group-hover:opacity-100"
          @click.stop="close(tab.id)"
        >
          ×
        </button>
      </div>
    </VueDraggable>

    <button
      class="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded text-white hover:bg-neutral-800 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white dark:bg-blue-400"
      title="New request"
      @click="createNewRequestTab"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { useRouter } from "vue-router";
import {
  useRequestTabsStore,
  type RequestTab,
  type HttpMethod,
} from "@/stores/tabs";

const router = useRouter();
const tabsStore = useRequestTabsStore();

const draggableTabs = computed({
  get: () => tabsStore.tabs,
  set: (value) => tabsStore.reorderTabs(value),
});

function methodClass(method: HttpMethod) {
  switch (method) {
    case "GET":
      return "text-emerald-400";
    case "POST":
      return "text-amber-400";
    case "PUT":
      return "text-blue-400";
    case "PATCH":
      return "text-cyan-400";
    case "DELETE":
      return "text-red-400";
    case "OPTIONS":
      return "text-violet-400";
    case "HEAD":
      return "text-pink-400";
    default:
      return "text-neutral-400";
  }
}

async function goToTab(tab: RequestTab) {
  tabsStore.setActiveById(tab.id);
  await router.push(tab.route);
}

async function close(tabId: string) {
  const nextTab = tabsStore.closeTab(tabId);

  if (nextTab) {
    await router.push(nextTab.route);
    return;
  }

  await router.push("/requests");
}

function onMiddleClick(event: MouseEvent, tab: RequestTab) {
  if (event.button !== 1) return;
  close(tab.id);
}

function onDragEnd() {
  // already synced via computed setter
}

async function createNewRequestTab() {
  await router.push("/requests/new");
}

async function onKeydown(event: KeyboardEvent) {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const mod = isMac ? event.metaKey : event.ctrlKey;

  if (!mod) return;

  if (event.key.toLowerCase() === "w") {
    event.preventDefault();
    if (tabsStore.activeTabId) {
      await close(tabsStore.activeTabId);
    }
  }

  if (event.key === "Tab") {
    event.preventDefault();

    if (!tabsStore.tabs.length || !tabsStore.activeTabId) return;

    const currentIndex = tabsStore.tabs.findIndex(
      (tab) => tab.id === tabsStore.activeTabId,
    );
    if (currentIndex === -1) return;

    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + tabsStore.tabs.length) % tabsStore.tabs.length
      : (currentIndex + 1) % tabsStore.tabs.length;

    const nextTab = tabsStore.tabs[nextIndex];
    if (!nextTab) return;
    await goToTab(nextTab);
  }
}
</script>
