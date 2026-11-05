# Portal do Projeto Cristhaal

Portal do Projeto de Extensão Universitária **Cristhaal** (ICT/Unifesp, São José dos Campos):
*Ciência para o Reencontro Interdisciplinar da Sociedade com a Tecnologia, a História, o Ambiente, a Arte nas suas diferentes Linguagens.*

O portal reúne as publicações da equipe sobre os encontros, visitas e oficinas do projeto. Só a equipe publica; o público lê.

## Rodando localmente

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Roda o build de produção |
| `npm run lint` | Verifica o código |

## Páginas

| Rota | Conteúdo |
| --- | --- |
| `/` | Logo se formando, a sigla como navegação, as três frentes (Educa, Experimenta, Inspira) e as 3 publicações mais recentes já abertas |
| `/publicacoes` | Lista com busca e filtros por frente e pelas letras de CRISTHAAL (os filtros ficam na URL, ex.: `?area=H`) |
| `/publicacoes/[id]` | Publicação com capa, texto, galeria e navegação para a anterior e a próxima |
| `/galeria` | Todas as fotos das publicações, agrupadas por encontro |
| `/quem-somos` | História do projeto, Programa Decolar, coordenação, objetivos e contato (Instagram) |
| `/publicar` | Editor de nova publicação, no formato da página final. Não aparece no menu nem no Google: a equipe acessa pelo endereço direto |

## Onde mexer

- **Conteúdo** (publicações, frentes, áreas, nomes da coordenação): `src/lib/data.ts`
- **Visual** (cores, tipografia, layout, animações): `src/app/globals.css`
- **Logo**: `src/lib/logoShape.ts` (peças e cores) e `src/components/Logo.tsx`. A animação de formação fica em `src/components/HeroLogo.tsx`.
- **Ilustrações de cristal** que ocupam o lugar das fotos: `src/components/CrystalArt.tsx`

## Situação atual

O visual foi aprovado a partir do protótipo e ainda não existe backend:

- As publicações são exemplos fixos em `src/lib/data.ts`.
- O que for publicado em `/publicar` fica salvo **só no navegador** de quem testou (`localStorage`), com id começando por `teste-`, e as fotos escolhidas valem só até fechar a aba. Qualquer outro endereço de publicação que não exista mostra a página 404.
- O logo é uma releitura vetorial feita a partir de uma imagem. Com o arquivo original (SVG, AI ou PDF) dá para deixá-lo idêntico.

## Próximos passos

1. Preencher os nomes (e fotos) das coordenadoras em `COORDENACAO`, em `src/lib/data.ts`.
2. Supabase: login da equipe, tabela de publicações e armazenamento das fotos (plano gratuito). A troca fica concentrada em `src/lib/localPosts.ts` e `src/lib/data.ts`.
3. Publicar na Vercel, conectando este repositório.

## Stack

Next.js 16 (App Router, Cache Components) com React 19 e TypeScript. O CSS é próprio, sem framework. As fontes (Bricolage Grotesque, Atkinson Hyperlegible e Homemade Apple) são servidas pelo `next/font`.

> O Tailwind foi removido de propósito: neste computador, o Windows bloqueia o binário nativo dele ("Application Control policy"), o que travava o build. Como todo o visual já usa CSS próprio, ele não fazia falta.
