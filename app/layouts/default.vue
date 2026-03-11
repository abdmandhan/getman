<template>
  <v-layout class="rounded-md border">
    <v-app-bar title="Getman API">
      <template #append>
        <v-btn @click="theme.toggle()" icon>
          <v-icon>
            {{
              theme.global.name.value === "dark"
                ? "mdi-weather-night"
                : "mdi-weather-sunny"
            }}
          </v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <v-navigation-drawer>
      <v-btn block color="primary" @click="showAddCollectionDialog = true">
        <v-icon>mdi-plus</v-icon>
        Add Collection
      </v-btn>
      <v-treeview
        v-model:opened="open"
        v-model:activated="activated"
        :items="items"
        density="compact"
        item-value="id"
        activatable
        open-on-click
        indent-lines="default"
      >
        <template v-slot:prepend="{ item, isOpen }">
          <v-icon
            v-if="item.type === 'collection'"
            :icon="isOpen ? 'mdi-folder-open' : 'mdi-folder'"
          ></v-icon>
          <v-icon
            v-else-if="item.type === 'folder'"
            :icon="isOpen ? 'mdi-folder-open' : 'mdi-folder'"
          ></v-icon>
          <v-icon
            v-else
            :icon="
              (item.request &&
                methodIcons[item.request.method?.toUpperCase()]!) ||
              'mdi-file-document-outline'
            "
          ></v-icon>
        </template>
        <template #append="{ item }">
          <v-btn
            v-if="item.type != 'request'"
            icon
            flat
            size="small"
            @click.stop="openCollectionItemDialog(item)"
          >
            <v-icon size="small">mdi-plus</v-icon>
          </v-btn>
        </template>
      </v-treeview>
      <template #append>
        <v-list-item @click="logout">
          <template #prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </template>
    </v-navigation-drawer>

    <v-main class="d-flex justify-center">
      <v-container class="py-4" style="max-width: 960px; width: 100%">
        <v-alert v-if="treeError" type="error" density="compact" class="mb-4">
          {{ treeError }}
        </v-alert>

        <v-skeleton-loader
          v-if="loadingTree"
          type="card, list-item-three-line"
          class="mb-4"
        />

        <RequestMain v-if="selectedRequest" :request="selectedRequest" />

        <!-- {{ items }} -->

        <slot />
      </v-container>

      <!-- Add Collection dialog -->
      <v-dialog v-model="showAddCollectionDialog" max-width="480">
        <v-card title="Add Collection">
          <v-card-text>
            <v-text-field
              v-model="addCollectionForm.name"
              label="Name"
              autofocus
              required
            />
            <v-textarea
              v-model="addCollectionForm.description"
              label="Description"
              rows="2"
              auto-grow
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="plain"
              text="Cancel"
              @click="closeAddCollectionDialog"
            />
            <v-btn
              color="primary"
              variant="tonal"
              text="Create"
              :loading="addCollectionLoading"
              :disabled="!addCollectionForm.name"
              @click="submitAddCollection"
            />
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Per-collection: add folder or request -->
      <v-dialog v-model="showCollectionItemDialog" max-width="420">
        <v-card
          :title="`Add to ${activeCollectionForDialog?.title ?? 'Collection'}`"
        >
          <v-card-text>
            <p class="mb-4">What would you like to add?</p>
            <v-btn
              block
              variant="tonal"
              color="primary"
              class="mb-2"
              @click="onAddFolderFromDialog"
            >
              <v-icon start>mdi-folder-plus</v-icon>
              Add Folder
            </v-btn>
            <v-btn
              block
              variant="tonal"
              color="secondary"
              @click="onAddRequestFromDialog"
            >
              <v-icon start>mdi-file-plus</v-icon>
              Add Request
            </v-btn>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="plain"
              text="Close"
              @click="showCollectionItemDialog = false"
            />
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Add Folder dialog -->
      <v-dialog v-model="showAddFolderDialog" max-width="480">
        <v-card
          :title="`Add Folder to ${activeCollectionForDialog?.title ?? ''}`"
        >
          <v-card-text>
            <v-text-field
              v-model="addFolderForm.name"
              label="Folder name"
              autofocus
              required
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="plain"
              text="Cancel"
              @click="closeAddFolderDialog"
            />
            <v-btn
              color="primary"
              variant="tonal"
              text="Create"
              :loading="addFolderLoading"
              :disabled="!addFolderForm.name"
              @click="submitAddFolder"
            />
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Add Request dialog -->
      <v-dialog v-model="showAddRequestDialog" max-width="600">
        <v-card
          :title="`Add Request to ${activeCollectionForDialog?.title ?? ''}`"
        >
          <v-card-text>
            <v-row dense>
              <v-col cols="12" sm="12">
                <v-text-field
                  v-model="addRequestForm.name"
                  label="Request name"
                  required
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="addRequestForm.method"
                  :items="['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
                  label="Method"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="addRequestForm.url"
                  label="URL"
                  placeholder="https://api.example.com/path"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="addRequestForm.description"
                  label="Description"
                  rows="2"
                  auto-grow
                />
              </v-col>
              <v-col>
                <v-select
                  v-model="addRequestForm.body_type"
                  :items="[
                    'NONE',
                    'JSON',
                    'FORM_DATA',
                    'URL_ENCODED',
                    'RAW',
                    'BINARY',
                  ]"
                  label="Body Type"
                />
              </v-col>
              <v-col cols="12">
                asdf
                <json-editor-vue v-model="addRequestForm.body" />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="plain"
              text="Cancel"
              @click="closeAddRequestDialog"
            />
            <v-btn
              color="primary"
              variant="tonal"
              text="Create"
              :loading="addRequestLoading"
              :disabled="!addRequestForm.name || !addRequestForm.url"
              @click="submitAddRequest"
            />
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import { useTheme } from "vuetify";
import type { Request } from "~~/prisma/generated/client";
const theme = useTheme();

const { clear } = useUserSession();
const menus = [
  {
    title: "Dashboard",
    icon: "mdi-view-dashboard",
    to: "/",
    iconColor: "primary",
  },
];

async function logout() {
  await clear();
  await navigateTo("/login");
}

const open = shallowRef<string[]>([]);
const activated = shallowRef<string[]>([]);

type TreeItem = {
  id: string;
  title: string;
  type: "collection" | "folder" | "request";
  children?: TreeItem[];
  request?: Request;
  collectionId?: string;
  folderId?: string;
};

const items = ref<TreeItem[]>([]);
const loadingTree = ref(false);
const treeError = ref<string | null>(null);
const selectedRequest = ref<Request | null>(null);

const showAddCollectionDialog = ref(false);
const addCollectionForm = ref({
  name: "",
  description: "",
});
const addCollectionLoading = ref(false);

const showCollectionItemDialog = ref(false);
const activeCollectionForDialog = ref<TreeItem | null>(null);

const showAddFolderDialog = ref(false);
const addFolderForm = ref({
  name: "",
});
const addFolderLoading = ref(false);

const showAddRequestDialog = ref(false);
const addRequestForm = ref({
  name: "",
  url: "",
  method: "GET",
  description: "",
  body_type: "NONE",
  body: null,
});
const addRequestLoading = ref(false);
const activeRequestCollectionId = ref<string | null>(null);
const activeRequestFolderId = ref<string | null>(null);

const methodIcons: Record<string, string> = {
  GET: "mdi-arrow-right",
  POST: "mdi-arrow-down",
  PUT: "mdi-arrow-up",
  PATCH: "mdi-arrow-top-right",
  DELETE: "mdi-trash-can",
};

async function fetchCollectionsTree() {
  loadingTree.value = true;
  treeError.value = null;
  try {
    const collections = await $fetch("/api/collections");

    // collections, folders, requests from API
    items.value = (collections as any[]).map((collection) => {
      const folderItems: TreeItem[] = (collection.folders || []).map(
        (folder: any) => ({
          id: folder.id,
          title: folder.name,
          type: "folder",
          collectionId: collection.id,
          folderId: folder.id,
          children: (folder.requests || []).map(
            (req: Request): TreeItem => ({
              id: req.id,
              title: req.name,
              type: "request",
              request: req,
            }),
          ),
        }),
      );

      const looseRequests: TreeItem[] = (collection.requests || []).map(
        (req: Request): TreeItem => ({
          id: req.id,
          title: req.name,
          type: "request",
          request: req,
        }),
      );

      return {
        id: collection.id,
        title: collection.name,
        type: "collection",
        collectionId: collection.id,
        children: [...folderItems, ...looseRequests],
      } as TreeItem;
    });

    // open all collections by default
    open.value = items.value.map((item) => item.id);
  } catch (err: any) {
    console.error(err);
    treeError.value =
      err?.data?.message ||
      err?.data?.statusMessage ||
      "Failed to load collections";
  } finally {
    loadingTree.value = false;
  }
}

function findItemById(nodes: TreeItem[], id: string): TreeItem | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findItemById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

watch(
  activated,
  (ids) => {
    const id = ids[0];
    if (!id) {
      selectedRequest.value = null;
      return;
    }

    const item = findItemById(items.value, id);
    if (item?.type === "request" && item.request) {
      selectedRequest.value = item.request;
    } else {
      selectedRequest.value = null;
    }
  },
  { deep: true },
);

function resetAddCollectionForm() {
  addCollectionForm.value = {
    name: "",
    description: "",
  };
}

function closeAddCollectionDialog() {
  showAddCollectionDialog.value = false;
  resetAddCollectionForm();
}

async function submitAddCollection() {
  if (!addCollectionForm.value.name) return;
  addCollectionLoading.value = true;
  try {
    await $fetch("/api/collections", {
      method: "POST",
      body: {
        name: addCollectionForm.value.name,
        description: addCollectionForm.value.description || undefined,
      },
    });
    closeAddCollectionDialog();
    await fetchCollectionsTree();
  } catch (err) {
    console.error(err);
  } finally {
    addCollectionLoading.value = false;
  }
}

function openCollectionItemDialog(collectionItem: TreeItem) {
  activeCollectionForDialog.value = collectionItem;
  if (collectionItem.type === "collection") {
    activeRequestCollectionId.value =
      collectionItem.collectionId ?? collectionItem.id;
    activeRequestFolderId.value = null;
  } else if (collectionItem.type === "folder") {
    activeRequestCollectionId.value = collectionItem.collectionId ?? null;
    activeRequestFolderId.value = collectionItem.folderId ?? collectionItem.id;
  } else {
    activeRequestCollectionId.value = null;
    activeRequestFolderId.value = null;
  }
  showCollectionItemDialog.value = true;
}

function resetAddFolderForm() {
  addFolderForm.value = {
    name: "",
  };
}

function onAddFolderFromDialog() {
  showCollectionItemDialog.value = false;
  resetAddFolderForm();
  showAddFolderDialog.value = true;
}

function closeAddFolderDialog() {
  showAddFolderDialog.value = false;
  resetAddFolderForm();
}

async function submitAddFolder() {
  if (!addFolderForm.value.name || !activeCollectionForDialog.value) return;
  addFolderLoading.value = true;
  try {
    await $fetch("/api/folders", {
      method: "POST",
      body: {
        name: addFolderForm.value.name,
        collectionId: activeCollectionForDialog.value.id,
      },
    });
    closeAddFolderDialog();
    await fetchCollectionsTree();
  } catch (err) {
    console.error(err);
  } finally {
    addFolderLoading.value = false;
  }
}

function resetAddRequestForm() {
  addRequestForm.value = {
    name: "",
    url: "",
    method: "GET",
    description: "",
    body_type: "NONE",
    body: null,
  };
}

function onAddRequestFromDialog() {
  showCollectionItemDialog.value = false;
  resetAddRequestForm();
  showAddRequestDialog.value = true;
}

function closeAddRequestDialog() {
  showAddRequestDialog.value = false;
  resetAddRequestForm();
}

async function submitAddRequest() {
  if (
    !addRequestForm.value.name ||
    !addRequestForm.value.url ||
    !activeRequestCollectionId.value
  ) {
    return;
  }
  addRequestLoading.value = true;
  try {
    await $fetch("/api/requests", {
      method: "POST",
      body: {
        name: addRequestForm.value.name,
        url: addRequestForm.value.url,
        method: addRequestForm.value.method,
        description: addRequestForm.value.description || undefined,
        collectionId: activeRequestCollectionId.value,
        folderId: activeRequestFolderId.value ?? undefined,
      },
    });
    closeAddRequestDialog();
    await fetchCollectionsTree();
  } catch (err) {
    console.error(err);
  } finally {
    addRequestLoading.value = false;
  }
}

onMounted(() => {
  fetchCollectionsTree();
});
</script>
