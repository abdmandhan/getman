<template>
  <v-card v-if="selectedRequest" class="mb-4">
    <v-card-title class="d-flex align-center justify-space-between gap-2">
      <v-select
        v-model="selectedRequest.method"
        :items="['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
        label="Method"
        variant="outlined"
        hide-details
        min-width="150"
      />

      <env-input
        v-if="selectedRequest"
        v-model="selectedRequest.url"
        label="Request URL"
        type="url"
        placeholder="{{ API_URL }}/api/v1/users"
      />

      <v-chip v-if="saveLoading" size="small" color="primary" variant="tonal">
        Saving...
      </v-chip>
      <v-btn
        color="primary"
        :loading="sendLoading"
        @click="sendRequest"
        text="Send"
      />
    </v-card-title>
    <v-card-text>
      <!-- <div class="flex">{{ selectedRequest.url }}?{{ urlParams }}</div> -->
      <v-tabs v-model="tab" color="primary" density="compact">
        <v-tab
          v-for="tab in tabLists"
          :key="tab"
          :value="tab"
          density="compact"
          class="text-capitalize"
        >
          {{ tab.replace("_", " ") }}
        </v-tab>
      </v-tabs>

      <v-divider></v-divider>

      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="docs">
          <v-sheet class="py-4">
            <v-textarea
              v-model="selectedRequest.description"
              label="Description"
              rows="10"
              auto-grow
            ></v-textarea>
          </v-sheet>
        </v-tabs-window-item>

        <v-tabs-window-item value="params">
          <v-sheet class="py-4">
            <v-table>
              <thead>
                <tr>
                  <th style="max-width: 32px" class="px-0"></th>
                  <th>Key</th>
                  <th>Value</th>
                  <th style="max-width: 32px" class="px-0">
                    <v-btn
                      icon="mdi-plus"
                      color="primary"
                      flat
                      size="small"
                      variant="text"
                      @click="addParam"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(param, index) in params" :key="index">
                  <td style="max-width: 32px" class="px-0">
                    <v-checkbox-btn v-model="param.checked" />
                  </td>
                  <td>
                    <v-text-field
                      v-model="param.key"
                      label="Key"
                      hide-details
                      min-width="150"
                    />
                  </td>
                  <td>
                    <v-text-field
                      v-model="param.value"
                      label="Value"
                      hide-details
                      min-width="150"
                    />
                  </td>
                  <td style="max-width: 32px" class="px-0">
                    <v-btn
                      v-if="params.length > 1"
                      icon="mdi-delete"
                      color="error"
                      size="small"
                      flat
                      variant="text"
                      @click="removeParam(param)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="body">
          <v-sheet class="py-4">
            <v-radio-group v-model="selectedRequest.body_type" inline>
              <v-radio label="none" value="NONE"></v-radio>
              <v-radio label="json" value="JSON"></v-radio>
              <v-radio label="form_data" value="FORM_DATA"></v-radio>
            </v-radio-group>
            <json-editor-vue
              v-model="selectedRequest.body"
              v-if="selectedRequest.body_type === 'JSON'"
            />
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="authorization">
          <v-sheet class="py-4">
            <v-select
              v-model="selectedRequest.authorizationId"
              :items="store.authorizations"
              label="Authorization"
              item-title="name"
              item-value="id"
              hide-details
            />
            <!-- {{ availableAuthorizations }} -->
          </v-sheet>
        </v-tabs-window-item>
      </v-tabs-window>
      <v-alert v-if="sendError" type="error" density="compact" class="mb-3">
        {{ sendError }}
      </v-alert>
      <div v-if="sendResponse">
        <div class="mb-2 text-body-2">
          <strong>Status:</strong> {{ sendResponse.status }}
          {{ sendResponse.statusText }}
        </div>
        <pre
          style="
            background-color: rgba(255, 255, 255, 0.04);
            max-height: 320px;
            overflow: auto;
          "
        >
            {{ JSON.stringify(sendResponse.data, null, 2) }}
          </pre
        >
      </div>
    </v-card-text>
    <v-card-actions>
      <v-divider></v-divider>
      <v-btn color="error" variant="tonal" @click="removeRequest">
        Remove Request
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { Request } from "~~/prisma/generated/client";
const store = useAppStore();

const emit = defineEmits<{
  (e: "remove-request", id: string): void;
}>();

const props = defineProps<{
  request: Request;
}>();

const tabLists = ["docs", "params", "authorization", "headers", "body"];

const tab = ref("params");

const sendLoading = ref(false);
const sendError = ref<string | null>(null);
const sendResponse = ref<any | null>(null);

const DEBOUNCE_MS = 500;

type ParamRow = { key: string; value: string; checked: boolean };

const params = reactive<ParamRow[]>([
  { key: "", value: "", checked: false },
]);

const selectedRequest = ref<Request | null>(props.request);

const saveLoading = ref(false);

function parseUrl(url: string): { base: string; params: ParamRow[] } {
  const [base = "", search] = url.split("?");
  const paramRows: ParamRow[] = [];
  if (search) {
    for (const pair of search.split("&")) {
      const eq = pair.indexOf("=");
      const key = eq >= 0 ? decodeURIComponent(pair.slice(0, eq)) : decodeURIComponent(pair);
      const value = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : "";
      if (key) paramRows.push({ key, value, checked: true });
    }
  }
  if (paramRows.length === 0) paramRows.push({ key: "", value: "", checked: false });
  return { base, params: paramRows };
}

function buildUrlWithParams(): string {
  if (!selectedRequest.value) return "";
  const base = selectedRequest.value.url.split("?")[0] ?? selectedRequest.value.url;
  const q = params
    .filter((p) => p.checked && p.key)
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");
  return q ? `${base}?${q}` : base;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let skipNextSave = false;

async function saveToDb() {
  if (skipNextSave) return;
  if (!selectedRequest.value) return;
  saveLoading.value = true;
  try {
    await $fetch(`/api/requests/${selectedRequest.value.id}`, {
      method: "PUT",
      body: {
        name: selectedRequest.value.name,
        url: buildUrlWithParams(),
        method: selectedRequest.value.method,
        description: selectedRequest.value.description ?? undefined,
        body_type: selectedRequest.value.body_type,
        body: selectedRequest.value.body,
        authorizationId: selectedRequest.value.authorizationId ?? null,
      },
    });
  } catch (err: any) {
    console.error("Failed to save request", err);
  } finally {
    saveLoading.value = false;
  }
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToDb, DEBOUNCE_MS);
}

async function sendRequest() {
  if (!selectedRequest.value) return;
  sendLoading.value = true;
  sendError.value = null;
  sendResponse.value = null;

  try {
    const res = await $fetch(`/api/requests/${selectedRequest.value.id}/send`, {
      method: "POST",
      body: {
        environmentId: store.selectedEnvironment?.id ?? null,
      },
    });
    sendResponse.value = res;
  } catch (err: any) {
    console.error(err);
    sendError.value =
      err?.data?.statusMessage ||
      err?.data?.message ||
      err?.message ||
      "Failed to send request";
  } finally {
    sendLoading.value = false;
  }
}

function addParam() {
  params.push({
    key: "",
    value: "",
    checked: true,
  });
}

function removeParam(param: { key: string; value: string; checked: boolean }) {
  params.splice(params.indexOf(param), 1);
}

const urlParams = computed(() => {
  return (
    params
      .filter((param) => param.checked)
      .map((param) => `${param.key}=${param.value}`)
      .join("&") || ""
  );
});

watch(
  () => props.request,
  (newVal) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    skipNextSave = true;
    selectedRequest.value = newVal ? { ...newVal } : null;
    if (newVal?.url) {
      const { base, params: parsed } = parseUrl(newVal.url);
      if (selectedRequest.value) selectedRequest.value.url = base;
      params.length = 0;
      parsed.forEach((p) => params.push({ ...p }));
      if (params.length === 0) params.push({ key: "", value: "", checked: false });
    }
    setTimeout(() => {
      skipNextSave = false;
    }, DEBOUNCE_MS + 100);
  },
  { immediate: true },
);

watch(selectedRequest, () => debouncedSave(), { deep: true });
watch(params, () => debouncedSave(), { deep: true });

async function removeRequest() {
  if (!selectedRequest.value) return;
  await $fetch("/api/requests/" + selectedRequest.value.id, {
    method: "DELETE",
  });
  emit("remove-request", selectedRequest.value.id);
}
</script>
