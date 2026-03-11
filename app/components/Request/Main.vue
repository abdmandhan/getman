<template>
  <v-card v-if="selectedRequest" class="mb-4">
    <v-card-title class="d-flex align-center justify-space-between">
      <v-text-field
        v-model="selectedRequest.url"
        label="URL"
        hide-details
        placeholder="https://api.example.com/path"
        min-width="150"
      >
        <template #prepend>
          <v-select
            v-model="selectedRequest.method"
            :items="['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
            label="Method"
            variant="outlined"
            hide-details
            min-width="150"
          />
        </template>
        <template #append>
          <v-btn
            color="primary"
            :loading="sendLoading"
            @click="sendRequest"
            text="Send"
          />
        </template>
      </v-text-field>
    </v-card-title>
    <v-card-text>
      <div class="flex">{{ selectedRequest.url }}?{{ urlParams }}</div>
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
            <!-- <v-select
              v-model="selectedRequest.authorizationId"
              :items="availableAuthorizations?.data ?? []"
              label="Authorization"
              hide-details
              min-width="150"
            /> -->
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
          class="pa-3 rounded text-body-2"
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

const emit = defineEmits<{
  (e: "remove-request", id: string): void;
}>();

const props = defineProps<{
  request: Request;
}>();

const tabLists = ["docs", "params", "authorization", "headers", "body"];

const tab = ref("authorization");

const sendLoading = ref(false);
const sendError = ref<string | null>(null);
const sendResponse = ref<any | null>(null);

const params = reactive<{ key: string; value: string; checked: boolean }[]>([
  {
    key: "",
    value: "",
    checked: true,
  },
]);

const selectedRequest = ref<Request | null>(props.request);

async function sendRequest() {
  if (!selectedRequest.value) return;
  sendLoading.value = true;
  sendError.value = null;
  sendResponse.value = null;

  try {
    const res = await $fetch("/api/requests/send", {
      method: "POST",
      body: {
        url: selectedRequest.value.url,
        method: selectedRequest.value.method,
        body: {
          method: "public/user/login",
          jsonrpc: "2.0",
          id: 1,
          params: {
            userId: "abdmandhan",
            pin: "123123",
          },
        },
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
    selectedRequest.value = newVal;
  },
  {
    immediate: true,
  },
);

async function removeRequest() {
  if (!selectedRequest.value) return;
  await $fetch("/api/requests/" + selectedRequest.value.id, {
    method: "DELETE",
  });
  emit("remove-request", selectedRequest.value.id);
}
</script>
