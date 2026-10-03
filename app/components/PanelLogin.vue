<script setup lang="ts">
// Shown instead of the app until the panel passphrase is known. The passphrase
// is checked against public.panel ('ping') before anything is remembered.
const { set } = usePanelPassphrase()
const config = useRuntimeConfig().public as unknown as { supabaseUrl: string, supabaseKey: string }

const passphrase = ref('')
const remember = ref(true)
const reveal = ref(false)
const sending = ref(false)
const failure = ref<string | null>(null)

async function signIn() {
  if (!passphrase.value || sending.value) return
  sending.value = true
  failure.value = null
  try {
    await fetchPanel(config, passphrase.value, 'ping')
    set(passphrase.value, remember.value)
  } catch (error) {
    failure.value = (error as { statusMessage?: string }).statusMessage ?? 'Não foi possível entrar.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center px-4 py-10 bg-elevated/25">
    <UCard class="w-full max-w-sm">
      <form class="flex flex-col gap-5" @submit.prevent="signIn">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-activity" class="size-6 text-primary" />
          <div>
            <h1 class="font-semibold text-highlighted">UX Analytics</h1>
            <p class="text-sm text-muted">Painel de UX do ENSPACE</p>
          </div>
        </div>

        <UFormField label="Senha do painel" name="passphrase" :error="failure ?? undefined">
          <UInput
            id="passphrase"
            v-model="passphrase"
            :type="reveal ? 'text' : 'password'"
            autocomplete="current-password"
            autofocus
            class="w-full"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="reveal ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="reveal ? 'Esconder senha' : 'Mostrar senha'"
                @click="reveal = !reveal"
              />
            </template>
          </UInput>
        </UFormField>

        <UCheckbox id="remember" v-model="remember" label="Lembrar neste navegador" />

        <UButton type="submit" block :loading="sending" :disabled="!passphrase" icon="i-lucide-lock-open">
          Entrar
        </UButton>

        <p class="text-xs text-muted">
          Peça a senha a quem administra o painel. Os dados são do Microsoft Clarity, coletados todo dia.
        </p>
      </form>
    </UCard>
  </div>
</template>
