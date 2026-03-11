<template>
  <!-- {{ props.request }}
  <br />
  {{ selectedRequest }} -->
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
    <!-- <v-card-subtitle class="pb-0">
            <code>{{ selectedRequest.url }}</code>
          </v-card-subtitle> -->
    <v-card-text>
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
        <!-- <v-tabs-window-item v-for="tab in tabLists" :key="tab" :value="tab">
          <v-sheet class="py-4">{{ tab.replace("_", " ") }}</v-sheet>
        </v-tabs-window-item> -->

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
            <!-- <v-subtitle class="text-body-2">Query Parameters</v-subtitle> -->
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
                <tr v-for="param in params" :key="param.key">
                  <td style="max-width: 32px" class="px-0">
                    <v-checkbox-btn></v-checkbox-btn>
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
          >{{ JSON.stringify(sendResponse.data, null, 2) }}</pre
        >
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Request } from "~~/prisma/generated/client";

const props = defineProps<{
  request: Request;
}>();

const tabLists = [
  "docs",
  "params",
  "authorization",
  "headers",
  "body",
  "scripts",
];

const tab = ref("params");

const sendLoading = ref(false);
const sendError = ref<string | null>(null);
const sendResponse = ref<any | null>(null);

const params = ref<{ key: string; value: string; checked: boolean }[]>([
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
  params.value.push({
    key: "",
    value: "",
    checked: true,
  });
}

function removeParam(param: { key: string; value: string; checked: boolean }) {
  params.value = params.value.filter((p) => p !== param);
}

watch(
  () => props.request,
  (newVal) => {
    selectedRequest.value = newVal;
  },
  {
    immediate: true,
  },
);
</script>
