<template>
  <v-container
    class="d-flex justify-center align-center"
    style="min-height: 100vh"
  >
    <v-card max-width="420" class="w-100">
      <v-card-title class="text-h6">Sign in</v-card-title>
      <v-card-subtitle
        >Use your username or email and password.</v-card-subtitle
      >
      <v-card-text>
        <v-alert v-if="error" type="error" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <v-form @submit.prevent="onSubmit">
          <v-text-field
            v-model="username"
            label="Username or Email"
            autocomplete="username"
            :hide-details="true"
            class="mb-4"
            variant="outlined"
            required
          />

          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            autocomplete="current-password"
            :hide-details="true"
            class="mb-6"
            variant="outlined"
            required
          />

          <v-btn type="submit" color="primary" block :loading="loading">
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "guest",
});
const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

const { fetch } = useUserSession();

async function onSubmit() {
  error.value = null;
  loading.value = true;
  try {
    await $fetch("/api/login", {
      method: "POST",
      body: {
        username: username.value,
        password: password.value,
      },
    });

    await fetch();
    await navigateTo("/");
  } catch (err: any) {
    const message =
      err?.data?.message ||
      err?.data?.statusMessage ||
      "Invalid username or password";
    error.value = message;
  } finally {
    loading.value = false;
  }
}
</script>
