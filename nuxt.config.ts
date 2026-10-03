// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },

  // A static site on GitHub Pages: no server, everything runs in the browser
  // and reads Supabase directly (see app/composables/usePainel.ts).
  ssr: false,
  nitro: { preset: 'github_pages' },

  // Public Sans, as in the Nuxt UI dashboard template: @nuxt/fonts downloads
  // it at build time and the site serves it, no request to Google at runtime.

  // No server to answer icon requests: the icons in use ship in the bundle,
  // and anything missed falls back to the public Iconify API. The scan also
  // reads .ts files (the menu and the pages list live in composables), which
  // the default leaves out.
  icon: {
    provider: 'iconify',
    clientBundle: {
      scan: { globInclude: ['app/**/*.{vue,ts}', 'shared/**/*.ts'] }
    }
  },

  runtimeConfig: {
    public: {
      supabaseUrl: 'https://xywuqkyclbxhrpoyplry.supabase.co',
      // Publishable key: public by design, it is meant to ship in browsers.
      // With it, anonymous visitors reach exactly one thing, public.painel,
      // and that function answers only with the panel passphrase.
      supabaseKey: 'sb_publishable_R39lNS78E0FUb86G_KV6mQ_oBPi0JIe'
    }
  },

  app: {
    // GitHub Pages serves the project under /<repository>/. The deploy
    // workflow sets NUXT_APP_BASE_URL; locally it stays '/'.
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'UX Analytics · ENSPACE',
      meta: [{ name: 'robots', content: 'noindex' }]
    }
  }
})
