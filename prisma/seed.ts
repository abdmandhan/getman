import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import bcrypt from "bcryptjs";
import { prisma } from "../server/utils/db";

type InsomniaRequest = {
  url?: string;
  name: string;
  method?: string;
  body?: { mimeType?: string; text?: string };
  headers?: Array<{ name?: string; value?: string; disabled?: boolean }>;
  meta?: { description?: string };
};

type InsomniaFolder = {
  name: string;
  children?: InsomniaChild[];
};

type InsomniaChild = InsomniaFolder | InsomniaRequest;

function isRequest(node: InsomniaChild): node is InsomniaRequest {
  return "url" in node && typeof (node as InsomniaRequest).url === "string";
}

type InsomniaCollection = {
  name: string;
  children?: InsomniaChild[];
};

type InsomniaSpec = {
  name?: string;
  collection?: InsomniaCollection[];
};

const METHOD_MAP: Record<string, "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"> = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
};

function toBodyType(mimeType: string | undefined): "NONE" | "JSON" | "FORM_DATA" | "URL_ENCODED" | "RAW" | "BINARY" {
  if (!mimeType) return "NONE";
  const m = mimeType.toLowerCase();
  if (m.includes("json")) return "JSON";
  if (m.includes("form-data") || m.includes("multipart")) return "FORM_DATA";
  if (m.includes("x-www-form-urlencoded")) return "URL_ENCODED";
  return "RAW";
}

function parseBodyText(
  text: string | undefined,
  bodyType: "NONE" | "JSON" | "FORM_DATA" | "URL_ENCODED" | "RAW" | "BINARY"
): Record<string, unknown> | null {
  if (!text?.trim()) return null;
  if (bodyType !== "JSON") return { raw: text };
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { raw: text };
  } catch {
    return { raw: text };
  }
}

function headersToJson(
  headers: InsomniaRequest["headers"]
): Record<string, string> | null {
  if (!headers?.length) return null;
  const out: Record<string, string> = {};
  for (const h of headers) {
    if (h.disabled) continue;
    const name = h?.name?.trim();
    const value = h?.value?.trim();
    if (name && value !== undefined) out[name] = value;
  }
  return Object.keys(out).length ? out : null;
}

async function processChildren(
  children: InsomniaChild[] | undefined,
  collectionId: string,
  folderId: string | null,
  userId: string
) {
  if (!children?.length) return;
  for (const child of children) {
    if (isRequest(child)) {
      const method = child.method?.toUpperCase() || "GET";
      const bodyType = toBodyType(child.body?.mimeType);
      const bodyJson = parseBodyText(child.body?.text, bodyType);
      const headersJson = headersToJson(child.headers);
      await prisma.request.create({
        data: {
          name: child.name || "Unnamed",
          url: child.url ?? "",
          method: METHOD_MAP[method] ?? "GET",
          description: child.meta?.description ?? null,
          headers: headersJson,
          body_type: bodyType,
          body: bodyJson,
          folderId,
          collectionId,
        },
      });
    } else {
      const folder = await prisma.folder.create({
        data: {
          name: child.name,
          userId,
          collectionId,
        },
      });
      await processChildren(child.children, collectionId, folder.id, userId);
    }
  }
}

export default async function seed() {
  console.log("Seeding database...");

  const userData = {
    name: "Abdurrahman Ramadhan",
    email: "abdmandhan@gmail.com",
    password: await bcrypt.hash("12341234", 10),
  };

  let user = await prisma.user.findFirst({
    where: { email: userData.email },
  });

  if (!user) {
    user = await prisma.user.create({ data: userData });
    console.log("Created user:", user.email);
  } else {
    console.log("Using existing user:", user.email);
  }

  // When run via `pnpm prisma db seed`, cwd is project root; resolve relative to that
  const yamlPath = resolve(process.cwd(), "prisma", "insomnia.yaml");
  let spec: InsomniaSpec;
  try {
    const raw = readFileSync(yamlPath, "utf-8");
    spec = yaml.load(raw) as InsomniaSpec;
  } catch (e) {
    console.error("Failed to read or parse insomnia.yaml:", e);
    throw e;
  }

  const collections = spec?.collection ?? [];
  if (!collections.length) {
    console.log("No collections found in insomnia.yaml");
    return;
  }

  for (const col of collections) {
    const name = col.name || "Imported Collection";
    const existing = await prisma.collection.findFirst({
      where: { name },
    });
    let collection;
    if (existing) {
      collection = existing;
      console.log("Using existing collection:", name);
    } else {
      collection = await prisma.collection.create({
        data: { name, description: `Imported from ${spec.name ?? "Insomnia"}` },
      });
      console.log("Created collection:", name);
    }

    const existingLink = await prisma.userCollection.findFirst({
      where: { userId: user.id, collectionId: collection.id },
    });
    if (!existingLink) {
      await prisma.userCollection.create({
        data: { userId: user.id, collectionId: collection.id },
      });
    }

    await processChildren(col.children, collection.id, null, user.id);
  }

  console.log("Database seeded successfully.");
}

seed().catch(console.error);
