# UX Analytics · ENSPACE

Painel de UX e qualidade do ENSPACE: o uso do produto (Microsoft Clarity,
coletado todo dia) e os chamados e demandas do workspace `produtos` do ENSPACE.

**https://pernalombr4.github.io/ux-analytics-panel/**

A página é pública, mas os números só aparecem depois da senha do painel.
Peça a senha a quem administra o painel.

## O que tem

| Página | Pergunta |
|---|---|
| Panorama | Como foi o período, comparado com o anterior, e onde o atrito pesa mais |
| Atrito por tela | Em que tela as pessoas tropeçam (cliques mortos, retornos rápidos, erros) |
| Desktop × Mobile | Qual a pior versão de cada tela |
| Audiência | Dispositivos, países, navegadores, sistemas e origens de acesso |
| Segmentos e funis | Leituras feitas na tela do Clarity (segmentos, funis, eventos) |
| Qualidade do produto | Onde estão os defeitos e os chamados, por área do sistema, e quanto cada área é usada |
| Chamados | Quem abre chamados, de que tipo, por qual origem e com que desfecho |
| Saúde dos dados | Dias que faltam, coletas fora de hora e o que revisar |

Taxas e médias são ponderadas por sessão. Usuários nunca são somados entre dias.

Nenhum gráfico tem eixo de dias: cada um agrega o período escolhido, e a
comparação com o período anterior é uma segunda barra. Os gráficos usam
Unovis, a biblioteca do template de dashboard do Nuxt UI, e todo gráfico tem
a opção de ver a tabela.

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
