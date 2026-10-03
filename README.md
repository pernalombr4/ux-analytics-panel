# UX Analytics · ENSPACE

Painel de UX e qualidade do ENSPACE: o uso do produto (Microsoft Clarity,
coletado todo dia) e os chamados e demandas do workspace `produtos` do ENSPACE.

**https://pernalombr4.github.io/ux-analytics-panel/**

A página é pública, mas os números só aparecem depois da senha do painel.
Peça a senha a quem administra o painel.

## O que tem

O menu lateral é dividido pela origem dos dados. O Panorama junta as duas
fontes; cada fonte tem a sua seção, com submenus.

| Seção | Página | Pergunta |
|---|---|---|
| — | Panorama | Como foi o período no uso (Clarity) e na qualidade (ENSPACE), e onde os dois se encontram: chamados por mil visitas de cada área do sistema |
| Clarity › Uso | Visão geral | Sessões, atrito no período, telas mais usadas e onde olhar primeiro |
| Clarity › Uso | Audiência | Dispositivos, países, navegadores, sistemas e origens de acesso |
| Clarity › Uso | Segmentos e funis | Leituras feitas na tela do Clarity (segmentos, funis, eventos) |
| Clarity › Atrito | Por tela | Em que tela as pessoas tropeçam (cliques mortos, retornos rápidos, erros) |
| Clarity › Atrito | Desktop × Mobile | Qual a pior versão de cada tela |
| ENSPACE › Qualidade | Riscos por área | Onde estão os defeitos e os chamados, por área do sistema |
| ENSPACE › Qualidade | Chamados | Quem abre chamados, de que tipo, por qual origem e com que desfecho |
| Painel | Saúde dos dados | Dias que faltam, coletas fora de hora e o que revisar |

Taxas e médias são ponderadas por sessão. Usuários nunca são somados entre dias.

Nenhum gráfico tem eixo de dias: cada um agrega o período escolhido, e a
comparação com o período anterior é uma segunda barra. Os gráficos usam
Unovis, a biblioteca do template de dashboard do Nuxt UI, e todo gráfico tem
a opção de ver a tabela.

A estrutura segue o [template de dashboard do Nuxt UI](https://github.com/nuxt-ui-templates/dashboard):
menu lateral recolhível, busca com `Ctrl K` (páginas, período, aparência),
atalhos `g` + letra para trocar de página (`g p` Panorama, `g u` Visão geral
do uso, `g q` Riscos por área, `g c` Chamados...), seletor de período com
calendário e menu de tema e aparência. A única peça do template que fica de fora é o gráfico de linha por
dia, pela regra acima.

## Como funciona

Site estático (Nuxt 4 + Nuxt UI) no GitHub Pages. Ele roda no navegador e lê
o Supabase direto, pela Data API, com a chave publicável do projeto. Essa
chave é pública por desenho: com ela, um visitante alcança uma única coisa, a
função `public.painel`, e ela só responde com a senha do painel. As tabelas
continuam fechadas.

A coleta, o modelo de dados e a função `painel` ficam no repositório privado
`ux-analytics` (`sql/11_painel_api.sql`).

## Senha do painel

Definir ou trocar, no SQL Editor do Supabase:

```sql
select dashboard.set_panel_passphrase('uma frase longa que o time vai usar');
```

Trocar a senha desloga todo mundo na hora: quem tinha a antiga volta para a
tela de senha.

## Publicar

Cada push na `main` publica sozinho (`.github/workflows/deploy.yml`). Na
primeira vez, ative em Settings → Pages → Source: **GitHub Actions**.

## Rodar localmente

```sh
pnpm install
pnpm dev        # http://localhost:3000
pnpm generate   # site estático em .output/public
```
