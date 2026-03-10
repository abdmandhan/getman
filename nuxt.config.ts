// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-12-21',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    'nuxt-auth-utils'
  ],

  eslint: {
    config: {
      import: {
        package: 'eslint-plugin-import-lite',
      },
    },
  },

  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
      },
    },
  },
  nitro: {
    preset: 'bun'
  },
  vite: {
    server: {
      allowedHosts: ['3000.abdmandhan.com', 'nuc.test']
    }
  },

  css: [
    '~/assets/css/main.css',
  ],

  // i18n: {
  //   defaultLocale: 'en',
  //   vueI18n: './i18n.config.ts',
  // },
})