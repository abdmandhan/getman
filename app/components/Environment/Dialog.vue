<template>
  <v-dialog v-model="dialog" max-width="720" persistent>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        size="small"
        variant="tonal"
        color="primary"
        class="mr-2"
      >
        Environments ({{ store.selectedEnvironment?.name ?? "None" }})
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="text-h5">Environments</span>
      </v-card-title>
      <v-card-text>
        <v-tabs v-model="tab">
          <v-tab value="environments">Environments</v-tab>
          <v-tab value="env-form">
            {{ editingEnvId ? "Edit" : "Add" }} Environment
          </v-tab>
          <v-tab value="variables">Variables</v-tab>
          <v-tab value="var-form">
            {{ editingVarId ? "Edit" : "Add" }} Variable
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="environments">
            <v-data-table
              :items="store.environments"
              :headers="envHeaders"
              :loading="loadingEnvs"
              density="compact"
              class="mt-2"
            >
              <template #item.actions="{ item }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  :class="{
                    'v-btn--active': store.selectedEnvironment?.id === item.id,
                  }"
                  @click="selectEnvironment(item)"
                >
                  <v-icon size="small">mdi-check-circle</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="startEditEnv(item)"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDeleteEnv(item)"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-tabs-window-item>
          <v-tabs-window-item value="env-form">
            <v-form ref="envFormRef" class="mt-2">
              <v-text-field
                v-model="envForm.name"
                label="Name"
                required
                :rules="[(v) => !!v || 'Name is required']"
              />
              <v-text-field
                v-model="envForm.description"
                label="Description"
                placeholder="Optional"
              />
            </v-form>
          </v-tabs-window-item>
          <v-tabs-window-item value="variables">
            <div
              v-if="!store.selectedEnvironment"
              class="mt-2 text-medium-emphasis"
            >
              Select an environment first to manage its variables.
            </div>
            <template v-else>
              <v-data-table
                :items="variables"
                :headers="varHeaders"
                :loading="loadingVars"
                density="compact"
                class="mt-2"
              >
                <template #item.value="{ item }">
                  <!-- <span>{{ maskSecret(item.value) }}</span> -->
                  <span>{{ item.value }}</span>
                </template>
                <template #item.actions="{ item }">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    @click="startEditVar(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDeleteVar(item)"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </template>
          </v-tabs-window-item>
          <v-tabs-window-item value="var-form">
            <div
              v-if="!store.selectedEnvironment"
              class="mt-2 text-medium-emphasis"
            >
              Select an environment first.
            </div>
            <v-form v-else ref="varFormRef" class="mt-2">
              <v-text-field
                v-model="varForm.key"
                label="Key"
                required
                :rules="[(v) => !!v || 'Key is required']"
                placeholder="e.g. API_URL"
              />
              <v-text-field
                v-model="varForm.value"
                label="Value"
                placeholder="e.g. https://api.example.com"
              />
            </v-form>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="tab === 'env-form'"
          variant="tonal"
          color="primary"
          :loading="savingEnv"
          :disabled="!envForm.name"
          @click="submitEnvForm"
        >
          {{ editingEnvId ? "Update" : "Create" }}
        </v-btn>
        <v-btn
          v-if="tab === 'var-form' && store.selectedEnvironment"
          variant="tonal"
          color="primary"
          :loading="savingVar"
          :disabled="!varForm.key"
          @click="submitVarForm"
        >
          {{ editingVarId ? "Update" : "Create" }}
        </v-btn>
        <v-btn variant="plain" text="Close" @click="close" />
      </v-card-actions>
    </v-card>

    <!-- Delete environment confirmation -->
    <v-dialog v-model="showDeleteEnvConfirm" max-width="400" persistent>
      <v-card title="Delete Environment">
        <v-card-text> Delete "{{ envToDelete?.name }}"? </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="plain" @click="showDeleteEnvConfirm = false"
            >Cancel</v-btn
          >
          <v-btn
            color="error"
            variant="tonal"
            :loading="deletingEnv"
            @click="doDeleteEnv"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete variable confirmation -->
    <v-dialog v-model="showDeleteVarConfirm" max-width="400" persistent>
      <v-card title="Delete Variable">
        <v-card-text> Delete "{{ varToDelete?.key }}"? </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="plain" @click="showDeleteVarConfirm = false"
            >Cancel</v-btn
          >
          <v-btn
            color="error"
            variant="tonal"
            :loading="deletingVar"
            @click="doDeleteVar"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
import type {
  Environment,
  EnvironmentVariable,
} from "~~/prisma/generated/client";

const dialog = ref(false);
const store = useAppStore();

const tab = ref<"environments" | "env-form" | "variables" | "var-form">(
  "environments",
);

const loadingEnvs = ref(false);
const loadingVars = ref(false);
const savingEnv = ref(false);
const savingVar = ref(false);
const deletingEnv = ref(false);
const deletingVar = ref(false);

const envFormRef = ref<any>(null);
const varFormRef = ref<any>(null);

const editingEnvId = ref<string | null>(null);
const editingVarId = ref<string | null>(null);

const showDeleteEnvConfirm = ref(false);
const showDeleteVarConfirm = ref(false);
const envToDelete = ref<Environment | null>(null);
const varToDelete = ref<EnvironmentVariable | null>(null);

const variables = ref<EnvironmentVariable[]>([]);

const envHeaders = [
  { title: "Name", key: "name", sortable: true },
  { title: "Description", key: "description", sortable: true },
  { title: "", key: "actions", sortable: false },
];

const varHeaders = [
  { title: "Key", key: "key", sortable: true },
  { title: "Value", key: "value" },
  { title: "", key: "actions", sortable: false },
];

const envForm = reactive({
  name: "",
  description: "",
});

const varForm = reactive({
  key: "",
  value: "",
});

function maskSecret(value: string): string {
  if (!value || value.length <= 4) return "••••";
  return "••••" + value.slice(-4);
}

function selectEnvironment(env: Environment) {
  store.setSelectedEnvironment(env);
  fetchVariables();
}

function resetEnvForm() {
  envForm.name = "";
  envForm.description = "";
  editingEnvId.value = null;
}

function resetVarForm() {
  varForm.key = "";
  varForm.value = "";
  editingVarId.value = null;
}

function startEditEnv(item: Environment) {
  editingEnvId.value = item.id;
  envForm.name = item.name;
  envForm.description = item.description ?? "";
  tab.value = "env-form";
}

function startEditVar(item: EnvironmentVariable) {
  editingVarId.value = item.id;
  varForm.key = item.key;
  varForm.value = item.value;
  tab.value = "var-form";
}

function confirmDeleteEnv(item: Environment) {
  envToDelete.value = item;
  showDeleteEnvConfirm.value = true;
}

function confirmDeleteVar(item: EnvironmentVariable) {
  varToDelete.value = item;
  showDeleteVarConfirm.value = true;
}

async function fetchVariables() {
  if (!store.selectedEnvironment) {
    variables.value = [];
    return;
  }
  loadingVars.value = true;
  try {
    variables.value = await $fetch<EnvironmentVariable[]>(
      `/api/environments/${store.selectedEnvironment.id}/variables`,
    );
  } catch (e: any) {
    console.error(e);
    variables.value = [];
  } finally {
    loadingVars.value = false;
  }
}

async function doDeleteEnv() {
  if (!envToDelete.value) return;
  deletingEnv.value = true;
  try {
    await $fetch(`/api/environments/${envToDelete.value.id}`, {
      method: "DELETE",
    });
    if (store.selectedEnvironment?.id === envToDelete.value.id) {
      store.setSelectedEnvironment(null);
      variables.value = [];
    }
    await store.fetchEnvironments();
    showDeleteEnvConfirm.value = false;
    envToDelete.value = null;
  } catch (e: any) {
    console.error(e);
  } finally {
    deletingEnv.value = false;
  }
}

async function doDeleteVar() {
  if (!varToDelete.value || !store.selectedEnvironment) return;
  deletingVar.value = true;
  try {
    await $fetch(
      `/api/environments/${store.selectedEnvironment.id}/variables/${varToDelete.value.id}`,
      { method: "DELETE" },
    );
    await fetchVariables();
    showDeleteVarConfirm.value = false;
    varToDelete.value = null;
  } catch (e: any) {
    console.error(e);
  } finally {
    deletingVar.value = false;
  }
}

async function submitEnvForm() {
  const valid = await envFormRef.value?.validate();
  if (!valid?.valid || !envForm.name) return;
  savingEnv.value = true;
  try {
    const body = {
      name: envForm.name,
      description: envForm.description || undefined,
    };
    if (editingEnvId.value) {
      await $fetch(`/api/environments/${editingEnvId.value}`, {
        method: "PUT",
        body,
      });
    } else {
      await $fetch("/api/environments", { method: "POST", body });
    }
    await store.fetchEnvironments();
    resetEnvForm();
    tab.value = "environments";
  } catch (e: any) {
    console.error(e);
  } finally {
    savingEnv.value = false;
  }
}

async function submitVarForm() {
  if (!store.selectedEnvironment) return;
  const valid = await varFormRef.value?.validate();
  if (!valid?.valid || !varForm.key) return;
  savingVar.value = true;
  try {
    const body = { key: varForm.key, value: varForm.value };
    if (editingVarId.value) {
      await $fetch(
        `/api/environments/${store.selectedEnvironment.id}/variables/${editingVarId.value}`,
        { method: "PUT", body },
      );
    } else {
      await $fetch(
        `/api/environments/${store.selectedEnvironment.id}/variables`,
        { method: "POST", body } as any,
      );
    }
    await fetchVariables();
    resetVarForm();
    tab.value = "variables";
  } catch (e: any) {
    console.error(e);
  } finally {
    savingVar.value = false;
  }
}

function close() {
  dialog.value = false;
  resetEnvForm();
  resetVarForm();
  tab.value = "environments";
}

watch(dialog, (open) => {
  if (open) {
    loadingEnvs.value = true;
    store.fetchEnvironments().finally(() => {
      loadingEnvs.value = false;
    });
    if (store.selectedEnvironment) {
      fetchVariables();
    }
  }
});

watch(
  () => store.selectedEnvironment,
  (env) => {
    if (env && dialog.value) {
      fetchVariables();
    } else if (!env) {
      variables.value = [];
    }
  },
);
</script>
