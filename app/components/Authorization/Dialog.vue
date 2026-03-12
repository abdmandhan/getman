<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card title="Authorization">
      <v-card-text>
        <v-tabs v-model="tab">
          <v-tab value="list">Authorizations</v-tab>
          <v-tab value="form">
            {{ editingId ? "Edit" : "Add" }} Authorization
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="list">
            <v-data-table
              :items="store.authorizations"
              :headers="headers"
              :loading="loading"
              density="compact"
              class="mt-2"
            >
              <template #item.token="{ item }">
                <span v-if="item.token">{{ maskSecret(item.token) }}</span>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template #item.credentials="{ item }">
                <span v-if="item.credentials">{{
                  maskSecret(JSON.stringify(item.credentials))
                }}</span>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="startEdit(item)"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDelete(item)"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-tabs-window-item>
          <v-tabs-window-item value="form">
            <v-form ref="formRef" class="mt-2">
              <v-text-field
                v-model="form.name"
                label="Name"
                required
                :rules="[(v) => !!v || 'Name is required']"
              />
              <v-select
                v-model="form.authType"
                :items="authTypeItems"
                label="Auth Type"
                required
              />
              <v-text-field
                v-model="form.token"
                label="Token"
                type="password"
                autocomplete="off"
                placeholder="Optional"
              />
              <v-textarea
                v-model="form.credentialsStr"
                label="Credentials (JSON)"
                placeholder='e.g. {"username":"user","password":"pass"}'
                rows="3"
                auto-grow
              />
            </v-form>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="tab === 'form'"
          variant="tonal"
          color="primary"
          :loading="saving"
          :disabled="!form.name"
          @click="submitForm"
        >
          {{ editingId ? "Update" : "Create" }}
        </v-btn>
        <v-btn variant="plain" text="Close" @click="close" />
      </v-card-actions>
    </v-card>

    <!-- Delete confirmation -->
    <v-dialog v-model="showDeleteConfirm" max-width="400" persistent>
      <v-card title="Delete Authorization">
        <v-card-text> Delete "{{ authorizationToDelete?.name }}"? </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="plain" @click="showDeleteConfirm = false"
            >Cancel</v-btn
          >
          <v-btn
            color="error"
            variant="tonal"
            :loading="deleting"
            @click="doDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { Authorization } from "~~/prisma/generated/client";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const store = useAppStore();
const tab = ref<"list" | "form">("list");
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const formRef = ref<any>(null);
const editingId = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const authorizationToDelete = ref<Authorization | null>(null);

const authTypeItems = ["BASIC", "BEARER", "API_KEY"] as const;

const headers = [
  { title: "Name", key: "name", sortable: true },
  { title: "Auth Type", key: "authType", sortable: true },
  { title: "Token", key: "token" },
  { title: "Credentials", key: "credentials" },
  { title: "", key: "actions", sortable: false },
];

const form = reactive({
  name: "",
  authType: "BASIC" as "BASIC" | "BEARER" | "API_KEY",
  token: "",
  credentialsStr: "",
});

function maskSecret(value: string): string {
  if (!value || value.length <= 4) return "••••";
  return "••••" + value.slice(-4);
}

function getCredentialsPayload(): Record<string, unknown> | undefined {
  const s = form.credentialsStr?.trim();
  if (!s) return undefined;
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function resetForm() {
  form.name = "";
  form.authType = "BASIC";
  form.token = "";
  form.credentialsStr = "";
  editingId.value = null;
}

function startEdit(item: Authorization) {
  editingId.value = item.id;
  form.name = item.name;
  form.authType = item.authType as "BASIC" | "BEARER" | "API_KEY";
  form.token = item.token ?? "";
  form.credentialsStr = item.credentials
    ? typeof item.credentials === "string"
      ? item.credentials
      : JSON.stringify(item.credentials, null, 2)
    : "";
  tab.value = "form";
}

function confirmDelete(item: Authorization) {
  authorizationToDelete.value = item;
  showDeleteConfirm.value = true;
}

async function doDelete() {
  if (!authorizationToDelete.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/authorizations/${authorizationToDelete.value.id}`, {
      method: "DELETE",
    });
    await store.fetchAuthorizations();
    showDeleteConfirm.value = false;
    authorizationToDelete.value = null;
  } catch (e: any) {
    console.error(e);
    // Could show snackbar
  } finally {
    deleting.value = false;
  }
}

async function submitForm() {
  const valid = await formRef.value?.validate();
  if (!valid?.valid || !form.name) return;
  saving.value = true;
  try {
    const body = {
      name: form.name,
      authType: form.authType,
      token: form.token || undefined,
      credentials: getCredentialsPayload(),
    };
    if (editingId.value) {
      await $fetch(`/api/authorizations/${editingId.value}`, {
        method: "PUT",
        body,
      });
    } else {
      await $fetch("/api/authorizations", { method: "POST", body });
    }
    await store.fetchAuthorizations();
    resetForm();
    tab.value = "list";
  } catch (e: any) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}

function close() {
  resetForm();
  tab.value = "list";
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loading.value = true;
      store.fetchAuthorizations().finally(() => {
        loading.value = false;
      });
    }
  },
);
</script>
