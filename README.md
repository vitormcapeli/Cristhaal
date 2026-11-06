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
| `/publicar` | Login da equipe e editor de nova publicação, no formato da página final. Não aparece no Google; no menu, só para quem entrou |

## Onde mexer

- **Publicações**: no Supabase (tabela `posts` e bucket `fotos`). A equipe publica em `/publicar` e apaga pelo botão na página do post; também dá para editar pelo Table Editor do Supabase.
- **Constantes** (frentes, áreas, nomes da coordenação, links): `src/lib/data.ts`
- **Visual** (cores, tipografia, layout, animações): `src/app/globals.css`
- **Logo**: `src/lib/logoShape.ts` (peças e cores) e `src/components/Logo.tsx`. A animação de formação fica em `src/components/HeroLogo.tsx`.
- **Ilustrações de cristal** que ocupam o lugar das fotos: `src/components/CrystalArt.tsx`

## Supabase

- **Banco**: `supabase/schema.sql` cria a tabela, as regras de acesso (todos leem, só contas da equipe escrevem) e o bucket de fotos. `supabase/exemplos.sql` traz os posts de exemplo. Rodar no SQL Editor do Supabase.
- **Contas**: os cadastros pelo site estão desligados. O administrador cria cada conta em *Authentication → Users → Add user* (com "Auto Confirm User"); é assim também que se troca uma senha esquecida.
- **Chaves**: a URL e a chave pública ficam em `src/lib/supabaseConfig.ts` (podem ser trocadas por `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_KEY`). A chave secreta nunca entra no código.
- **Cache**: as páginas guardam as publicações por até 1 hora e são renovadas na hora quando alguém publica ou apaga pelo site. Mudanças feitas direto no painel do Supabase aparecem em até 1 hora.
- **Projeto acordado**: a Vercel chama `/api/manter` uma vez por dia (`vercel.json`), para o Supabase grátis não pausar por falta de uso.

## Próximos passos

- Editar uma publicação já publicada pelo próprio site (hoje: apagar e publicar de novo, ou o Table Editor).
- O logo é uma releitura vetorial feita a partir de uma imagem. Com o arquivo original (SVG, AI ou PDF) dá para deixá-lo idêntico.

## Stack

Next.js 16 (App Router, Cache Components) com React 19 e TypeScript. O CSS é próprio, sem framework. As fontes (Bricolage Grotesque, Atkinson Hyperlegible e Homemade Apple) são servidas pelo `next/font`.

> O Tailwind foi removido de propósito: neste computador, o Windows bloqueia o binário nativo dele ("Application Control policy"), o que travava o build. Como todo o visual já usa CSS próprio, ele não fazia falta.
