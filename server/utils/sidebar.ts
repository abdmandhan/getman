import type { H3Event } from "h3";
import type { Request } from "~~/prisma/generated/client";
import { prisma } from "~~/server/utils/db";

type SidebarClient = {
  collection: {
    findFirst: (...args: any[]) => Promise<any>;
    findMany: (...args: any[]) => Promise<any[]>;
  };
  folder: {
    findFirst: (...args: any[]) => Promise<any>;
    findMany: (...args: any[]) => Promise<any[]>;
    update: (...args: any[]) => Promise<any>;
    updateMany: (...args: any[]) => Promise<any>;
  };
  request: {
    findMany: (...args: any[]) => Promise<any[]>;
    update: (...args: any[]) => Promise<any>;
    updateMany: (...args: any[]) => Promise<any>;
  };
};

export type ParentContext = {
  collectionId: string;
  parentFolderId: string | null;
};

export type SidebarChildRef = {
  id: string;
  type: "folder" | "request";
  index: number;
  createdAt: Date | string;
};

type SidebarFolderRecord = {
  id: string;
  name: string;
  index: number;
  collectionId: string;
  parentFolderId: string | null;
  createdAt: Date | string;
};

export type SidebarFolderTree = SidebarFolderRecord & {
  folders: SidebarFolderTree[];
  requests: Request[];
};

export async function requireCurrentUser(event: H3Event) {
  const session = await getUserSession(event);

  if (!session?.user?.username) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: session.user.username,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not found",
    });
  }

  return user;
}

export async function ensureCollectionAccess(
  tx: SidebarClient,
  userId: string,
  collectionId: string,
) {
  const collection = await tx.collection.findFirst({
    where: {
      id: collectionId,
      userCollections: {
        some: {
          userId,
        },
      },
    },
  });

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  return collection;
}

export async function ensureFolderAccess(
  tx: SidebarClient,
  userId: string,
  folderId: string,
  collectionId?: string,
) {
  const folder = await tx.folder.findFirst({
    where: {
      id: folderId,
      userId,
      ...(collectionId ? { collectionId } : {}),
    },
  });

  if (!folder) {
    throw createError({
      statusCode: 404,
      statusMessage: "Folder not found",
    });
  }

  return folder;
}

export function clampIndex(index: number, length: number) {
  if (index < 0) return 0;
  if (index > length) return length;
  return index;
}

export function reorderChildren<T extends { id: string }>(
  children: T[],
  movedId: string,
  requestedIndex: number,
) {
  const next = [...children];
  const currentIndex = next.findIndex((child) => child.id === movedId);

  if (currentIndex === -1) {
    return next;
  }

  const [moved] = next.splice(currentIndex, 1);

  if (!moved) {
    return next;
  }

  next.splice(clampIndex(requestedIndex, next.length), 0, moved);

  return next;
}

export async function getOrderedChildren(
  tx: SidebarClient,
  parent: ParentContext,
) {
  const folders = await tx.folder.findMany({
    where: {
      collectionId: parent.collectionId,
      parentFolderId: parent.parentFolderId,
    },
    select: {
      id: true,
      index: true,
      createdAt: true,
    },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
  });

  const requests = await tx.request.findMany({
    where: {
      collectionId: parent.collectionId,
      folderId: parent.parentFolderId,
    },
    select: {
      id: true,
      index: true,
      createdAt: true,
    },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
  });

  return [...folders.map((folder) => ({
    ...folder,
    type: "folder" as const,
  })), ...requests.map((request) => ({
    ...request,
    type: "request" as const,
  }))].sort(sortSidebarChildren);
}

export async function applyOrderedChildren(
  tx: SidebarClient,
  children: SidebarChildRef[],
  movedNode?: {
    id: string;
    type: "folder" | "request";
    data: Record<string, unknown>;
  },
) {
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (!child) {
      continue;
    }

    const updateData: Record<string, unknown> =
      movedNode && child.id === movedNode.id && child.type === movedNode.type
        ? { ...movedNode.data, index }
        : { index };

    if (child.type === "folder") {
      await tx.folder.update({
        where: { id: child.id },
        data: updateData,
      });
      continue;
    }

    await tx.request.update({
      where: { id: child.id },
      data: updateData,
    });
  }
}

export async function getDescendantFolderIds(
  tx: SidebarClient,
  userId: string,
  rootFolderId: string,
) {
  const folders = await tx.folder.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      parentFolderId: true,
    },
  });

  const childrenByParent = new Map<string, string[]>();

  for (const folder of folders) {
    if (!folder.parentFolderId) continue;

    const children = childrenByParent.get(folder.parentFolderId) ?? [];
    children.push(folder.id);
    childrenByParent.set(folder.parentFolderId, children);
  }

  const descendants: string[] = [];
  const stack = [rootFolderId];

  while (stack.length) {
    const currentFolderId = stack.pop();

    if (!currentFolderId || descendants.includes(currentFolderId)) {
      continue;
    }

    descendants.push(currentFolderId);
    const childIds = childrenByParent.get(currentFolderId) ?? [];
    stack.push(...childIds);
  }

  return descendants;
}

export async function getSidebarCollections(userId: string) {
  const collections = await prisma.collection.findMany({
    where: {
      userCollections: {
        some: {
          userId,
        },
      },
    },
    include: {
      folders: {
        orderBy: [{ index: "asc" }, { createdAt: "asc" }],
      },
      requests: {
        orderBy: [{ index: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
  });

  return collections.map((collection) => {
    const foldersByParent = new Map<string | null, SidebarFolderRecord[]>();
    const requestsByFolder = new Map<string | null, Request[]>();

    for (const folder of collection.folders) {
      const siblings = foldersByParent.get(folder.parentFolderId) ?? [];
      siblings.push({
        id: folder.id,
        name: folder.name,
        index: folder.index,
        collectionId: folder.collectionId,
        parentFolderId: folder.parentFolderId,
        createdAt: folder.createdAt,
      });
      foldersByParent.set(folder.parentFolderId, siblings);
    }

    for (const request of collection.requests) {
      const siblings = requestsByFolder.get(request.folderId) ?? [];
      siblings.push(request);
      requestsByFolder.set(request.folderId, siblings);
    }

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      index: collection.index,
      folders: buildFolderTree(null, foldersByParent, requestsByFolder),
      requests: requestsByFolder.get(null) ?? [],
    };
  });
}

function buildFolderTree(
  parentFolderId: string | null,
  foldersByParent: Map<string | null, SidebarFolderRecord[]>,
  requestsByFolder: Map<string | null, Request[]>,
): SidebarFolderTree[] {
  const folders = foldersByParent.get(parentFolderId) ?? [];

  return [...folders]
    .sort(sortSidebarChildren)
    .map((folder) => ({
      ...folder,
      folders: buildFolderTree(folder.id, foldersByParent, requestsByFolder),
      requests: requestsByFolder.get(folder.id) ?? [],
    }));
}

function sortSidebarChildren(
  a: { index: number; createdAt: Date | string; id: string },
  b: { index: number; createdAt: Date | string; id: string },
) {
  if (a.index !== b.index) {
    return a.index - b.index;
  }

  const timeA = new Date(String(a.createdAt)).getTime();
  const timeB = new Date(String(b.createdAt)).getTime();

  if (timeA !== timeB) {
    return timeA - timeB;
  }

  return a.id.localeCompare(b.id);
}
