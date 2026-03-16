<template>
  <Tree
    draggableNodes
    droppableNodes
    v-model:selectionKeys="selectedKey"
    :value="nodes"
    selectionMode="single"
    :metaKeySelection="false"
    @nodeSelect="onNodeSelect"
    @nodeDrop="onNodeDrop"
    class="w-full p-0!"
  ></Tree>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { TreeNodeDropEvent } from "primevue/tree";

const selectedKey = ref();
const toast = useToast();

const onNodeSelect = (node: any) => {
  console.log(node);
  navigateTo(`/d/${node.key}`);
  toast.add({
    severity: "success",
    summary: "Node Selected",
    detail: node.label,
    life: 3000,
  });
};

type SidebarCollectionResponse = {
  id: string;
  name: string;
  index: number;
  folders: SidebarFolderResponse[];
  requests: SidebarRequestResponse[];
};

type SidebarFolderResponse = {
  id: string;
  name: string;
  index: number;
  collectionId: string;
  parentFolderId: string | null;
  folders: SidebarFolderResponse[];
  requests: SidebarRequestResponse[];
};

type SidebarRequestResponse = {
  id: string;
  name: string;
  index: number;
};

type SidebarTreeNodeData =
  | {
      type: "collection";
      collectionId: string;
      index: number;
    }
  | {
      type: "folder";
      collectionId: string;
      folderId: string;
      parentFolderId: string | null;
      index: number;
    }
  | {
      type: "request";
      collectionId: string;
      requestId: string;
      folderId?: string;
      index: number;
    };

type SidebarTreeNode = {
  key: string;
  label: string;
  data: SidebarTreeNodeData;
  icon: string;
  children?: SidebarTreeNode[];
};

type SidebarNodeLocation = {
  node: SidebarTreeNode;
  parent: SidebarTreeNode | null;
  index: number;
};

const nodes = ref<SidebarTreeNode[]>([]);
const saving = ref(false);

const onNodeDrop = async (event: TreeNodeDropEvent) => {
  const drag = event?.dragNode as SidebarTreeNode | undefined;
  const nextNodes = (event?.value as SidebarTreeNode[] | undefined) ?? nodes.value;

  if (!drag?.data) return;

  nodes.value = nextNodes;

  const movedNode = findNodeLocation(nextNodes, drag.key);

  if (!movedNode) {
    await fetchSidebarTree();
    return;
  }

  try {
    saving.value = true;
    await persistMovedNode(movedNode);
    await fetchSidebarTree();
  } catch (err: any) {
    console.error("Failed to move request", err);
    await fetchSidebarTree();
    toast.add({
      severity: "error",
      summary: "Failed to move node",
      detail:
        err?.data?.message ||
        err?.data?.statusMessage ||
        err?.message ||
        "Failed to update sidebar order",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

async function fetchSidebarTree() {
  try {
    const collections = await $fetch("/api/collections");

    nodes.value = (collections as SidebarCollectionResponse[]).map(
      (collection) => ({
        key: collection.id,
        label: collection.name,
        data: {
          type: "collection",
          collectionId: collection.id,
          index: collection.index,
        },
        icon: "pi pi-fw pi-folder",
        children: buildChildNodes(
          collection.id,
          null,
          collection.folders,
          collection.requests,
        ),
      }),
    );
  } catch (err: any) {
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Failed to load sidebar",
      detail:
        err?.data?.message ||
        err?.data?.statusMessage ||
        "Failed to load collections",
      life: 3000,
    });
  }
}

async function persistMovedNode(location: SidebarNodeLocation) {
  const { node, parent, index } = location;

  if (node.data.type === "collection") {
    if (parent) {
      throw new Error("Collections can only be reordered at the root");
    }

    await $fetch(`/api/collections/${node.data.collectionId}`, {
      method: "PUT",
      body: {
        index,
      },
    });
    return;
  }

  if (!parent || parent.data.type === "request") {
    throw new Error(
      node.data.type === "folder"
        ? "Folders must stay inside a collection or folder"
        : "Requests must stay inside a collection or folder",
    );
  }

  if (node.data.type === "folder") {
    await $fetch(`/api/folders/${node.data.folderId}`, {
      method: "PUT",
      body: {
        collectionId: parent.data.collectionId,
        parentFolderId:
          parent.data.type === "folder" ? parent.data.folderId : null,
        index,
      },
    });
    return;
  }

  await $fetch(`/api/requests/${node.data.requestId}`, {
    method: "PUT",
    body: {
      collectionId: parent.data.collectionId,
      folderId: parent.data.type === "folder" ? parent.data.folderId : null,
      index,
    },
  });
}

function buildChildNodes(
  collectionId: string,
  parentFolderId: string | null,
  folders: SidebarFolderResponse[],
  requests: SidebarRequestResponse[],
) {
  return [
    ...folders.map((folder) => buildFolderNode(folder)),
    ...requests.map((request) =>
      buildRequestNode(request, collectionId, parentFolderId),
    ),
  ].sort((left, right) => left.data.index - right.data.index);
}

function buildFolderNode(folder: SidebarFolderResponse): SidebarTreeNode {
  return {
    key: folder.id,
    label: folder.name,
    data: {
      type: "folder",
      collectionId: folder.collectionId,
      folderId: folder.id,
      parentFolderId: folder.parentFolderId,
      index: folder.index,
    },
    icon: "pi pi-fw pi-folder",
    children: buildChildNodes(
      folder.collectionId,
      folder.id,
      folder.folders || [],
      folder.requests || [],
    ),
  };
}

function buildRequestNode(
  request: SidebarRequestResponse,
  collectionId: string,
  folderId: string | null,
): SidebarTreeNode {
  return {
    key: request.id,
    label: request.name,
    data: {
      type: "request",
      collectionId,
      requestId: request.id,
      folderId: folderId ?? undefined,
      index: request.index,
    },
    icon: "pi pi-fw pi-file",
  };
}

function findNodeLocation(
  tree: SidebarTreeNode[],
  key: string,
  parent: SidebarTreeNode | null = null,
): SidebarNodeLocation | null {
  for (let index = 0; index < tree.length; index += 1) {
    const node = tree[index];

    if (!node) {
      continue;
    }

    if (node.key === key) {
      return {
        node,
        parent,
        index,
      };
    }

    const childLocation = findNodeLocation(node.children || [], key, node);

    if (childLocation) {
      return childLocation;
    }
  }

  return null;
}

onMounted(fetchSidebarTree);
</script>
