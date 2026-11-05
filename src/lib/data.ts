// Conteúdo do portal. Enquanto não existe backend, tudo o que aparece no site vem daqui.
// Quando o Supabase entrar, POSTS passa a vir do banco e este arquivo fica só com as constantes.

export type AreaKey = "C" | "R" | "I" | "S" | "T" | "H" | "A1" | "A2" | "L";
export type FrenteKey = "educa" | "experimenta" | "inspira" | "geral";
export type AutorKey = "equipe" | "coord";

export type Area = { k: AreaKey; l: string; n: string; c: string; rest: string };
export type Frente = { nome: string; full: string; c: string; seed: number; text?: string };
/** Blocos do texto. Em `p` e `ul`, `**negrito**` e `*itálico*` (com `\` para escapar). */
export type Bloco = { p: string } | { h: string } | { ul: string[] } | { steps: true };

export type Post = {
  id: string;
  frente: FrenteKey;
  areas: AreaKey[];
  autor: AutorKey;
  data: string; // AAAA-MM-DD
  fotos: number;
  seed: number;
  titulo: string;
  resumo: string;
  corpo: Bloco[];
  /** Fotos reais (URLs). Enquanto vazio, a galeria mostra ilustrações. */
  imagens?: string[];
};

export const AREAS: Area[] = [
  { k: "C", l: "C", n: "Ciência", c: "#E5332A", rest: "iência" },
  { k: "R", l: "R", n: "Reencontro", c: "#F28C28", rest: "eencontro" },
  { k: "I", l: "I", n: "Interdisciplinar", c: "#D99A00", rest: "nterdisciplinar" },
  { k: "S", l: "S", n: "Sociedade", c: "#2FA84F", rest: "ociedade" },
  { k: "T", l: "T", n: "Tecnologia", c: "#2E6FD8", rest: "ecnologia" },
  { k: "H", l: "H", n: "História", c: "#8E5BA8", rest: "istória" },
  { k: "A1", l: "A", n: "Ambiente", c: "#1E9E8A", rest: "mbiente" },
  { k: "A2", l: "A", n: "Arte", c: "#E6197F", rest: "rte" },
  { k: "L", l: "L", n: "Linguagens", c: "#3D47B5", rest: "inguagens" },
];
export const AREA = Object.fromEntries(AREAS.map((a) => [a.k, a])) as Record<AreaKey, Area>;
export const isAreaKey = (k: string): k is AreaKey => k in AREA;

export const FRENTES: Record<FrenteKey, Frente> = {
  educa: {
    nome: "Educa", full: "Cristhaal Educa", c: "#3D47B5", seed: 11,
    text: "Aproxima a Unifesp SJC das escolas públicas da região, com aulas e oficinas que mostram os cristais escondidos no dia a dia.",
  },
  experimenta: {
    nome: "Experimenta", full: "Cristhaal Experimenta", c: "#E8541E", seed: 23,
    text: "Leva os estudantes para dentro dos laboratórios para viver um experimento de cristalização do início ao fim.",
  },
  inspira: {
    nome: "Inspira", full: "Cristhaal Inspira", c: "#D6187A", seed: 37,
    text: "Registra e compartilha a trajetória de mulheres negras brasileiras que fizeram e fazem história na ciência. Representatividade importa.",
  },
  geral: { nome: "Projeto", full: "Projeto Cristhaal", c: "#1E9E8A", seed: 5 },
};
export const isFrenteKey = (k: string): k is FrenteKey => k in FRENTES;

export const STEPS: [string, string][] = [
  ["Solução", "Preparação da solução saturada."],
  ["Inserção", "Colocação do fio-semente."],
  ["Crescimento", "Observação do surgimento e do desenvolvimento dos cristais."],
  ["Análise", "Registro, análise e apresentação dos resultados."],
];

export const AUTHORS: Record<AutorKey, { nome: string; papel: string; ini: string; c: string }> = {
  equipe: { nome: "Equipe Cristhaal", papel: "Bolsistas", ini: "EC", c: "#3D47B5" },
  coord: { nome: "Coordenação", papel: "Professoras do projeto", ini: "CO", c: "#E6197F" },
};

// Coordenadoras (nomes autorizados pela professora para a página Quem somos).
// `foto` aceita um caminho dentro de /public, por exemplo "/coordenacao/ana.jpg".
export const COORDENACAO: { nome: string; area: string; ini: string; c: string; foto?: string }[] = [
  { nome: "Ana Maria do Espírito Santo Slapnik", area: "Professora Adjunta de Física / Ciências dos Materiais", ini: "AM", c: "#2E6FD8" },
  { nome: "Cláudia Aline Azevedo dos Santos Mesquita", area: "Professora Adjunta de Matemática", ini: "CA", c: "#E6197F" },
  { nome: "Silvia Lucia Cuffini", area: "Professora Adjunta de Química / Ciências Químicas e de Materiais", ini: "SL", c: "#F28C28" },
];

export const INSTAGRAM = "https://www.instagram.com/projetocristhaal/";
export const YOUTUBE = "https://www.youtube.com/@CristhaalUnifesp";
export const UNIFESP = "https://www.unifesp.br";

// Publicações de exemplo, aprovadas no protótipo. Trocar pelos relatos reais.
export const POSTS: Post[] = [
  {
    id: "cristais-coloridos", frente: "experimenta", areas: ["C", "R", "A2"], autor: "equipe", data: "2026-10-14", fotos: 6, seed: 401,
    titulo: "Cristais azuis e vermelhos: estudantes cultivam os próprios cristais no ICT",
    resumo: "No laboratório, cada estudante preparou a solução, colocou o fio-semente e acompanhou o cristal crescer dia após dia.",
    corpo: [
      { p: "Nesta edição do Cristhaal Experimenta, os estudantes entraram no laboratório da Unifesp em São José dos Campos para viver um experimento de cristalização do começo ao fim." },
      { p: "O processo seguiu quatro etapas:" },
      { steps: true },
      { p: "O resultado foram cristais azuis, vermelhos e de outras cores, cada um com um formato diferente. Mais do que o cristal em si, o que ficou foi a emoção de ver a ciência acontecer com as próprias mãos." },
    ],
  },
  {
    id: "decolar-no-ict", frente: "educa", areas: ["C", "R", "S", "I"], autor: "coord", data: "2026-10-02", fotos: 8, seed: 517,
    titulo: "Programa Decolar no ICT: um dia dentro dos laboratórios",
    resumo: "Estudantes do Programa Decolar conheceram laboratórios de pesquisa e participaram de seminários de matemática, física, química e biologia.",
    corpo: [
      { p: "Recebemos estudantes do Programa Decolar para um dia inteiro no Instituto de Ciência e Tecnologia. A programação incluiu visitas a laboratórios e seminários pensados especialmente para eles." },
      { p: "Ao longo do dia, os estudantes conversaram com pesquisadores e fizeram perguntas que surpreenderam muita gente da casa. A ideia é que eles enxerguem a universidade como um lugar possível para o futuro deles." },
    ],
  },
  {
    id: "sonia-guimaraes", frente: "inspira", areas: ["C", "H", "S"], autor: "equipe", data: "2026-09-25", fotos: 2, seed: 263,
    titulo: "Sonia Guimarães e a física feita aqui do lado",
    resumo: "Primeira mulher negra brasileira doutora em física e professora do ITA, em São José dos Campos.",
    corpo: [
      { p: "Abrimos a série do Cristhaal Inspira com uma cientista que trabalha bem perto de nós. Sonia Guimarães é a primeira mulher negra brasileira com doutorado em física e é professora do ITA, aqui em São José dos Campos." },
      { p: "Contar a trajetória dela para os estudantes é mostrar que a ciência também tem rostos parecidos com os deles. Representatividade importa." },
    ],
  },
  {
    id: "cristais-no-cotidiano", frente: "educa", areas: ["C", "T", "L"], autor: "equipe", data: "2026-09-18", fotos: 4, seed: 88,
    titulo: "Do sal de cozinha ao chip do celular: tem cristal em tudo",
    resumo: "Uma aula numa escola pública da região sobre os cristais escondidos no dia a dia.",
    corpo: [
      { p: "Levamos lupas, amostras e muitas perguntas para uma turma de escola pública da região. O desafio era encontrar cristais em objetos comuns." },
      { p: "Sal, açúcar, gelo, a tela e o processador do celular: no fim da aula, a turma já estava vendo cristal em todo canto." },
    ],
  },
  {
    id: "enedina-alves-marques", frente: "inspira", areas: ["T", "H", "S"], autor: "equipe", data: "2026-09-11", fotos: 3, seed: 331,
    titulo: "Enedina Alves Marques, a primeira engenheira negra do Brasil",
    resumo: "Formada em engenharia civil no Paraná em 1945, abriu caminho para muitas outras.",
    corpo: [
      { p: "Enedina Alves Marques se formou em engenharia civil no Paraná, em 1945, e se tornou a primeira mulher negra engenheira do país." },
      { p: "Neste post, a equipe conta como foi a conversa com os estudantes sobre a trajetória dela e sobre o que ainda falta para a engenharia ser um lugar de todas e todos." },
    ],
  },
  {
    id: "prazer-cristhaal", frente: "geral", areas: ["R", "I", "A1", "A2", "L"], autor: "coord", data: "2026-09-04", fotos: 5, seed: 742,
    titulo: "Prazer, Cristhaal: de uma conversa entre professoras a um projeto",
    resumo: "Como três professoras de áreas diferentes transformaram uma conversa sobre cristais num projeto de extensão.",
    corpo: [
      { p: "O Cristhaal nasceu de uma conversa descontraída entre três professoras de áreas totalmente diferentes. O assunto era a presença dos cristais no cotidiano, enorme e quase invisível." },
      { p: "Daí surgiu a vontade de mostrar a importância dos cristais na ciência, na tecnologia, na matemática, na história, na filosofia, na arquitetura e na arte. Vamos explorar o lado lúdico dos cristais além da sua forma visível." },
    ],
  },
];

export const sortPosts = (list: Post[]) => [...list].sort((a, b) => b.data.localeCompare(a.data));
export const getPost = (id: string) => POSTS.find((p) => p.id === id);

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
