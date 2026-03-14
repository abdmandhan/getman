<template>
  <div class="w-full">
    <div
      ref="editorRef"
      contenteditable="true"
      spellcheck="false"
      class="min-h-[40px] w-full rounded-md border border-gray-600 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
      @input="handleInput"
      @paste="handlePaste"
      @keydown="handleKeydown"
      :placeholder="placeholder"
    ></div>

    <div
      v-if="showResolvedPreview && hasVariables"
      class="mt-2 text-xs text-slate-400"
    >
      Resolved:
      <span class="text-slate-200">{{ resolvedValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";
import type {
  Environment,
  EnvironmentVariable,
} from "~~/prisma/generated/client";

type EnvironmentWithVariables = Environment & {
  environmentVariables: EnvironmentVariable[];
};

interface Props {
  modelValue: string;
  showResolvedPreview?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  showResolvedPreview: false,
  placeholder: "Enter your request URL",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "resolved", value: string): void;
}>();

const editorRef = ref<HTMLDivElement | null>(null);
const appStore = useAppStore();
const { selectedEnvironment } = storeToRefs(appStore);

const ENV_REGEX = /{{\s*([\w.-]+)\s*}}/g;

const envMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  const env = selectedEnvironment.value as EnvironmentWithVariables | null;

  if (!env?.environmentVariables?.length) return map;

  for (const item of env.environmentVariables) {
    if (!item.key) continue;
    map[item.key] = item.value ?? "";
  }

  return map;
});

const matchedKeys = computed(() => {
  return [...props.modelValue.matchAll(ENV_REGEX)].map((m) => m[1]);
});

const uniqueKeys = computed(() => [...new Set(matchedKeys.value)]);
const hasVariables = computed(() => uniqueKeys.value.length > 0);

const resolvedValue = computed(() => {
  return props.modelValue.replace(ENV_REGEX, (_, key: string) => {
    return key in envMap.value ? (envMap.value[key] ?? "") : `{{${key}}}`;
    //   return key in envMap.value ? envMap.value[key] : `{{${key}}}`
  });
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isEnvValid(key: string) {
  return key in envMap.value;
}

function getTokenClass(key: string) {
  return isEnvValid(key) ? "text-blue-400" : "text-red-400";
}

function renderStyledHtml(value: string) {
  let lastIndex = 0;
  let html = "";

  for (const match of value.matchAll(ENV_REGEX)) {
    const fullMatch = match[0];
    const key = match[1] ?? "";
    const start = match.index ?? 0;
    const end = start + fullMatch.length;

    html += escapeHtml(value.slice(lastIndex, start));

    html += `<span data-env-token="${escapeHtml(key)}" class="${getTokenClass(
      key,
    )}">${escapeHtml(fullMatch)}</span>`;

    lastIndex = end;
  }

  html += escapeHtml(value.slice(lastIndex));

  return html;
}

function getCaretCharacterOffsetWithin(element: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return preCaretRange.toString().length;
}

function setCaretCharacterOffsetWithin(element: HTMLElement, offset: number) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  let currentOffset = 0;
  let found = false;

  function walk(node: Node) {
    if (found) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length ?? 0;
      if (currentOffset + textLength >= offset) {
        range.setStart(node, Math.max(0, offset - currentOffset));
        range.collapse(true);
        found = true;
      } else {
        currentOffset += textLength;
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of Array.from(node.childNodes)) {
        walk(child);
        if (found) return;
      }
    }
  }

  walk(element);

  if (!found) {
    range.selectNodeContents(element);
    range.collapse(false);
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

function syncEditorFromModel() {
  if (!editorRef.value) return;

  const caret = getCaretCharacterOffsetWithin(editorRef.value);
  const html = renderStyledHtml(props.modelValue);

  if (editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html;
    setCaretCharacterOffsetWithin(editorRef.value, caret);
  }
}

function extractRawValueFromEditor() {
  if (!editorRef.value)
    return (editorRef.value as unknown as HTMLDivElement)?.innerText ?? "";

  return editorRef.value.innerText.replace(/\n/g, "");
}

function handleInput() {
  const rawValue = extractRawValueFromEditor();
  emit("update:modelValue", rawValue);

  nextTick(() => {
    syncEditorFromModel();
  });
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text/plain") ?? "";
  document.execCommand("insertText", false, text.replace(/\n/g, ""));
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
  }
}

watch(
  () => props.modelValue,
  () => {
    nextTick(() => syncEditorFromModel());
  },
  { immediate: true },
);

watch(
  resolvedValue,
  (value) => {
    emit("resolved", value);
  },
  { immediate: true },
);

watch(
  envMap,
  () => {
    nextTick(() => syncEditorFromModel());
  },
  { deep: true },
);

onMounted(() => {
  syncEditorFromModel();
});
</script>
