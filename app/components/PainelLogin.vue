<script setup lang="ts">
// Shown instead of the app until the panel passphrase is known. The passphrase
// is checked against public.painel ('ping') before anything is remembered.
const { set } = usePainelChave()
const config = useRuntimeConfig().public as unknown as { supabaseUrl: string, supabaseKey: string }

const senha = ref('')
const lembrar = ref(true)
const mostrar = ref(false)
const enviando = ref(false)
const erro = ref<string | null>(null)

async function entrar() {
  if (!senha.value || enviando.value) return
  enviando.value = true
  erro.value = null
  try {
    await fetchPainel(config, senha.value, 'ping')
    set(senha.value, lembrar.value)
  } catch (error) {
    erro.value = (error as { statusMessage?: string }).statusMessage ?? 'Não foi possível entrar.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center px-4 py-10 bg-elevated/25">
    <UCard class="w-full max-w-sm">
      <form class="flex flex-col gap-5" @submit.prevent="entrar">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-activity" class="size-6 text-primary" />
          <div>
            <h1 class="font-semibold text-highlighted">UX Analytics</h1>
            <p class="text-sm text-muted">Painel de UX do ENSPACE</p>
          </div>
        </div>

        <UFormField label="Senha do painel" name="senha" :error="erro ?? undefined">
          <UInput
            id="senha"
            v-model="senha"
            :type="mostrar ? 'text' : 'password'"
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
                :icon="mostrar ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="mostrar ? 'Esconder senha' : 'Mostrar senha'"
                @click="mostrar = !mostrar"
              />
            </template>
          </UInput>
        </UFormField>

        <UCheckbox id="lembrar" v-model="lembrar" label="Lembrar neste navegador" />

        <UButton type="submit" block :loading="enviando" :disabled="!senha" icon="i-lucide-lock-open">
          Entrar
        </UButton>

        <p class="text-xs text-muted">
          Peça a senha a quem administra o painel. Os dados são do Microsoft Clarity, coletados todo dia.
        </p>
      </form>
    </UCard>
  </div>
</template>
