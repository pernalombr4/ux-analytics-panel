# Painel de UX Analytics do ENSPACE

**A spec do agente `ux-analytics` fica no repositório privado `ux-analytics`, em `AGENTE_UX_ANALYTICS.md`. Leia
inteira antes de qualquer ação; em conflito, ela vence.**

Painel estático (Nuxt 4 + Nuxt UI 4 + SDK do ENSPACE) publicado no GitHub Pages a cada push na `main`.
Os dados, o SQL e os robôs ficam no repositório irmão `ux-analytics` (privado). Este repositório é público: nada de
dado, nome de cliente ou chave entra nele. O essencial, para a sessão que só tiver o painel aberto, vem a seguir.

## Interface: primeiro o SDK do ENSPACE, depois o Nuxt UI

1. **SDK do ENSPACE antes de tudo** (`@be-enlighten/enspace-sdk-ui`, só os componentes base):
   - `EnApp` na raiz (já em `app/app.vue`; não acrescente outro `UApp`);
   - tabela é `EnTable`, pelo `DataTable` (`app/components/DataTable.vue`) ou direto com slots `#cell-{key}`;
   - quadro é `EnKanbanBoard`; casca de tela é `EnLayout`.
2. **Depois, só Nuxt UI.** Nenhuma outra biblioteca de componente. Gráfico é Unovis, a biblioteca do template de
   dashboard do Nuxt UI.
3. **Dúvida de componente:** skill `nuxt-ui` e MCP `nuxt-ui` (`.mcp.json`) antes de qualquer CSS próprio. Prop,
   variante, slot e a prop `ui` resolvem quase tudo.
4. **O módulo de dados do SDK fica fora** (`@be-enlighten/enspace-sdk-vue/nuxt`, com Keycloak). O navegador só fala
   com a função `public.panel` do Supabase, pela chave publicável. Chave do ENSPACE nunca vai para o navegador.

## Nomes

- Nome técnico em inglês: identificador de código, função e parâmetro SQL, recurso do `public.panel`, workflow,
  secret (decisão da redatora em 2026-10-03).
- Português só no que vive no ENSPACE (slug de categoria e de campo, valor de opção) e no texto que a pessoa lê.

## Texto de tela (regras de escrita da redatora)

Sessão na nuvem não lê o `~/.claude` da máquina dela, então o essencial vai aqui:

- Comece pelo objetivo; voz ativa; verbo específico (Salvar, Enviar), presente do indicativo.
- Sem dupla negativa, sem "com sucesso", "vale notar", "basicamente" e afins.
- Números em dígitos. Uma ideia por frase. Status nunca só por cor: ícone mais palavra.

## Antes de enviar

```bash
pnpm typecheck && pnpm generate
```

- Mudança que depende de SQL novo no `ux-analytics`: a migração entra no Supabase **antes** do push na `main`. O push
  publica na hora, e o painel sem a função quebra todas as páginas.

## Commits

- Nunca adicione `Co-Authored-By` (nem nenhuma outra linha que coloque o Claude como coautor) em mensagens de commit
  ou descrições de PR.
