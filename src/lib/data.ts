// Constantes do portal (áreas, frentes, autores, coordenação e links) e os tipos das publicações.
// As publicações vêm do Supabase (src/lib/posts.ts); as de exemplo estão em supabase/exemplos.sql.

export type AreaKey = "C" | "R" | "I" | "S" | "T" | "H" | "A1" | "A2" | "L";
export type FrenteKey = "educa" | "experimenta" | "inspira" | "geral";
export type AutorKey = "equipe" | "coord";

export type Area = { k: AreaKey; l: string; n: string; c: string; rest: string };
export type Frente = { nome: string; full: string; c: string; seed: number; text?: string };
export type Alinhamento = "left" | "center" | "right";
/** Largura (em % da largura do post) e alinhamento de um bloco. Sem `w`, ocupa a coluna de texto. */
export type Caixa = { w?: number; al?: Alinhamento };
/** Blocos do texto. Em `p` e `ul`, `**negrito**` e `*itálico*` (com `\` para escapar). */
export type Bloco = (
  | { p: string }
  | { h: string }
  | { ul: string[] }
  | { img: string; leg?: string }
  | { steps: true }
) & Caixa;
export const isAlinhamento = (s: unknown): s is Alinhamento => s === "left" || s === "center" || s === "right";

export type Post = {
  id: string;
  frente: FrenteKey;
  areas: AreaKey[];
  autor: AutorKey;
  data: string; // AAAA-MM-DD
  fotos: number;
  seed: number;
  titulo: string;
  /** Alinhamento do cabeçalho (frente, título e dados). Sem valor, à esquerda. */
  tituloAl?: Alinhamento;
  /** Largura do cabeçalho, em % da largura do post. Sem valor, a largura padrão. */
  tituloW?: number;
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

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
