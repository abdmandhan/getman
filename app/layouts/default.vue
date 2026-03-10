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
      <v-btn block @click="addCollection" color="primary">
        <v-icon>mdi-plus</v-icon>
        Add Collection
      </v-btn>
      <v-treeview
        v-model:opened="open"
        :items="items"
        density="compact"
        item-value="title"
        activatable
        open-on-click
        indent-lines="default"
      >
        <template v-slot:prepend="{ item, isOpen }">
          <v-icon
            v-if="!item.file"
            :icon="isOpen ? 'mdi-folder-open' : 'mdi-folder'"
          ></v-icon>

          <v-icon v-else :icon="files[item.file]"></v-icon>
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
      <slot />
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
import { useTheme } from "vuetify";
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

const open = shallowRef(["public"]);
const files = shallowRef({
  html: "mdi-language-html5",
  js: "mdi-nodejs",
  json: "mdi-code-json",
  md: "mdi-language-markdown",
  pdf: "mdi-file-pdf-box",
  png: "mdi-file-image",
  txt: "mdi-file-document-outline",
  xls: "mdi-file-excel",
});

const items = [
  {
    title: ".git",
  },
  {
    title: "node_modules",
  },
  {
    title: "public",
    children: [
      {
        title: "static",
        children: [
          {
            title: "logo.png",
            file: "png",
          },
        ],
      },
      {
        title: "favicon.ico",
        file: "png",
      },
      {
        title: "index.html",
        file: "html",
      },
    ],
  },
  {
    title: ".gitignore",
    file: "txt",
  },
  {
    title: "babel.config.js",
    file: "js",
  },
  {
    title: "package.json",
    file: "json",
  },
  {
    title: "README.md",
    file: "md",
  },
  {
    title: "vue.config.js",
    file: "js",
  },
  {
    title: "yarn.lock",
    file: "txt",
  },
];

function addCollection() {
  console.log("addCollection");
}
</script>
