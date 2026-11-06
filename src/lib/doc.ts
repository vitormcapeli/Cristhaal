// Texto das publicações. O editor (Tiptap) produz um documento em JSON no formato do ProseMirror,
// e é isso que vai para o banco (coluna `corpo`). Este arquivo, usado no servidor e no navegador:
//  - limpa qualquer documento que chega (só passa o que o portal sabe mostrar, com endereços seguros);
//  - converte as publicações antigas, que eram uma lista de blocos ({ p }, { h }, { ul }, { img }, { steps });
//  - tira do documento o texto para a busca e o resumo, e as imagens para enviar ao Storage.

import type { Bloco } from "./data";
import { parseInline, validW } from "./rich";
import { BUCKET, SUPABASE_URL } from "./supabaseConfig";

export type Marca = { type: "bold" | "italic" | "highlight" } | { type: "link"; attrs: { href: string } };
export type No = { type: string; attrs?: Record<string, unknown>; content?: No[]; text?: string; marks?: Marca[] };
export type Doc = { type: "doc"; content: No[] };

export type Tom = "nota" | "dica" | "atencao";
export const TONS: Tom[] = ["nota", "dica", "atencao"];
/** Onde fica uma imagem: no centro, ou de um lado com o texto correndo ao lado. */
export type Pos = "centro" | "esquerda" | "direita";
export type Foto = { src: string; legenda?: string };

export const DOC_VAZIO: Doc = { type: "doc", content: [] };
const MAX_TEXTO = 20000;
const MAX_LEGENDA = 300;
const MAX_FOTOS_GALERIA = 12;

// Endereços ---------------------------------------------------------------------------------------

/** Só links da web (http/https) e de e-mail. */
export function linkSeguro(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const h = href.trim();
  if (!h || h.length > 2000) return null;
  if (/^mailto:[^\s@<>"]+@[^\s@<>"]+$/i.test(h)) return h;
  try {
    const u = new URL(h);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

/** Link que a pessoa digitou ("unifesp.br" vira "https://unifesp.br"). */
export function normalizarLink(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return linkSeguro(`mailto:${t}`);
  return linkSeguro(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
}

const FOTOS_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

/**
 * Imagens aceitas no texto: as do Storage do portal, as do próprio site (/...) e, enquanto é rascunho,
 * as que o editor reduziu (data:). Nunca endereços de outros sites.
 */
export function imagemSegura(src: unknown): string | null {
  if (typeof src !== "string") return null;
  if (src.startsWith("data:image/")) return /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src) ? src : null;
  if (src.startsWith(FOTOS_URL)) return /^[^\s"'<>]+$/.test(src) ? src : null;
  return /^\/[\w\-./]+$/.test(src) ? src : null;
}

/** Caminho no Storage de uma imagem do portal (o que vem depois de .../fotos/), ou null. */
export const caminhoNoStorage = (src: string) => (src.startsWith(FOTOS_URL) ? decodeURIComponent(src.slice(FOTOS_URL.length)) : null);

/** O código do vídeo (11 caracteres) a partir de um link do YouTube em qualquer formato. */
export function youtubeId(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    const host = u.hostname.replace(/^(www|m|music)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v") ?? /^\/(?:embed|shorts|live|v)\/([\w-]{11})/.exec(u.pathname)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Limpeza -----------------------------------------------------------------------------------------

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const texto = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const alinhamento = (a: Record<string, unknown> | undefined) =>
  a?.textAlign === "center" || a?.textAlign === "right" ? { textAlign: a.textAlign } : undefined;
const pos = (v: unknown): Pos => (v === "esquerda" || v === "direita" ? v : "centro");
const tom = (v: unknown): Tom => (TONS.includes(v as Tom) ? (v as Tom) : "nota");

function marcas(m: unknown): Marca[] {
  if (!Array.isArray(m)) return [];
  const out: Marca[] = [];
  for (const x of m) {
    if (!obj(x)) continue;
    if ((x.type === "bold" || x.type === "italic" || x.type === "highlight") && !out.some((y) => y.type === x.type)) out.push({ type: x.type });
    else if (x.type === "link" && !out.some((y) => y.type === "link")) {
      const href = linkSeguro(obj(x.attrs) ? x.attrs.href : null);
      if (href) out.push({ type: "link", attrs: { href } });
    }
  }
  return out;
}

function inline(nodes: unknown): No[] {
  const out: No[] = [];
  if (!Array.isArray(nodes)) return out;
  for (const n of nodes) {
    if (!obj(n)) continue;
    if (n.type === "text" && typeof n.text === "string" && n.text) {
      const m = marcas(n.marks);
      out.push(m.length ? { type: "text", text: n.text.slice(0, MAX_TEXTO), marks: m } : { type: "text", text: n.text.slice(0, MAX_TEXTO) });
    } else if (n.type === "hardBreak") out.push({ type: "hardBreak" });
  }
  return out;
}

const comConteudo = (n: No, content: No[]): No => (content.length ? { ...n, content } : n);

/** Blocos de texto que podem ir dentro de listas, citações e destaques. */
const TEXTO = new Set(["paragraph", "heading", "bulletList", "orderedList"]);

function blocos(nodes: unknown, nivel: number, so?: Set<string>): No[] {
  const out: No[] = [];
  if (!Array.isArray(nodes) || nivel > 6) return out;
  for (const n of nodes) {
    if (!obj(n) || typeof n.type !== "string") continue;
    if (so && !so.has(n.type)) continue;
    const a = obj(n.attrs) ? n.attrs : undefined;
    switch (n.type) {
      case "paragraph": {
        const al = alinhamento(a);
        out.push(comConteudo(al ? { type: "paragraph", attrs: al } : { type: "paragraph" }, inline(n.content)));
        break;
      }
      case "heading": {
        const c = inline(n.content);
        if (c.length) out.push({ type: "heading", attrs: { level: Number(a?.level) >= 3 ? 3 : 2, ...alinhamento(a) }, content: c });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const itens: No[] = [];
        for (const li of Array.isArray(n.content) ? n.content : []) {
          if (!obj(li) || li.type !== "listItem") continue;
          const c = blocos(li.content, nivel + 1, new Set(["paragraph", "bulletList", "orderedList"]));
          if (c.length && c[0].type !== "paragraph") c.unshift({ type: "paragraph" });
          itens.push({ type: "listItem", content: c.length ? c : [{ type: "paragraph" }] });
        }
        if (!itens.length) break;
        const start = Number(a?.start);
        out.push(n.type === "orderedList" && Number.isInteger(start) && start > 1 && start < 10000
          ? { type: "orderedList", attrs: { start }, content: itens }
          : { type: n.type, content: itens });
        break;
      }
      case "blockquote":
      case "callout": {
        const c = blocos(n.content, nivel + 1, TEXTO);
        if (!c.some((x) => x.content?.length)) break;
        out.push(n.type === "callout" ? { type: "callout", attrs: { tom: tom(a?.tom) }, content: c } : { type: "blockquote", content: c });
        break;
      }
      case "horizontalRule":
        out.push({ type: "horizontalRule" });
        break;
      case "figura": {
        const src = imagemSegura(a?.src);
        if (!src) break;
        const w = Number(a?.w);
        out.push({ type: "figura", attrs: { src, legenda: texto(a?.legenda, MAX_LEGENDA), w: validW(w) ? Math.round(w) : null, pos: pos(a?.pos) } });
        break;
      }
      case "galeria": {
        const fotos: Foto[] = [];
        for (const f of Array.isArray(a?.fotos) ? a.fotos : []) {
          const src = obj(f) ? imagemSegura(f.src) : null;
          if (src && fotos.length < MAX_FOTOS_GALERIA) fotos.push({ src, legenda: texto(obj(f) ? f.legenda : "", MAX_LEGENDA) });
        }
        if (fotos.length) out.push({ type: "galeria", attrs: { fotos } });
        break;
      }
      case "video": {
        const id = youtubeId(a?.id);
        if (id) out.push({ type: "video", attrs: { id, legenda: texto(a?.legenda, MAX_LEGENDA) } });
        break;
      }
      case "etapas":
        out.push({ type: "etapas" });
        break;
    }
  }
  return out;
}

const vazio = (n: No) => n.type === "paragraph" && !n.content?.length;

/** Documento limpo, pronto para mostrar ou salvar. Aceita também o formato antigo (lista de blocos). */
export function limparDoc(x: unknown): Doc {
  if (Array.isArray(x)) return docDeBlocos(x as Bloco[]);
  if (!obj(x) || x.type !== "doc") return DOC_VAZIO;
  const content = blocos(x.content, 0);
  // Parágrafos vazios no começo e no fim não aparecem; no meio ficam, como espaço entre partes.
  while (content.length && vazio(content[0])) content.shift();
  while (content.length && vazio(content[content.length - 1])) content.pop();
  return { type: "doc", content };
}

// Publicações antigas -----------------------------------------------------------------------------

function inlineDeMarcacao(s: string): No[] {
  return parseInline(s).map(({ t, b, i }) => {
    const m: Marca[] = [];
    if (b) m.push({ type: "bold" });
    if (i) m.push({ type: "italic" });
    return m.length ? { type: "text", text: t, marks: m } : { type: "text", text: t };
  });
}

/** Converte a lista de blocos das publicações antigas. Larguras de blocos de texto não existem mais. */
export function docDeBlocos(corpo: Bloco[]): Doc {
  const content: No[] = [];
  for (const b of corpo) {
    if (!obj(b)) continue;
    const al = b.al === "center" || b.al === "right" ? { textAlign: b.al } : undefined;
    if ("steps" in b) content.push({ type: "etapas" });
    else if ("img" in b && typeof b.img === "string") {
      content.push({ type: "figura", attrs: { src: b.img, legenda: typeof b.leg === "string" ? b.leg : "", w: validW(b.w) ? b.w : null, pos: "centro" } });
    } else if ("h" in b && typeof b.h === "string") content.push({ type: "heading", attrs: { level: 2, ...al }, content: [{ type: "text", text: b.h }] });
    else if ("ul" in b && Array.isArray(b.ul)) {
      content.push({
        type: "bulletList",
        content: b.ul.map((x) => ({ type: "listItem", content: [{ type: "paragraph", content: inlineDeMarcacao(String(x)) }] })),
      });
    } else if ("p" in b && typeof b.p === "string") content.push({ type: "paragraph", ...(al ? { attrs: al } : null), content: inlineDeMarcacao(b.p) });
  }
  // Passa pela limpeza também: endereços de imagem e textos vazios.
  return limparDoc({ type: "doc", content });
}

// Leitura -----------------------------------------------------------------------------------------

function percorrer(nodes: No[] | undefined, fn: (n: No) => void) {
  for (const n of nodes ?? []) {
    fn(n);
    percorrer(n.content, fn);
  }
}

const textoDe = (n: No) => {
  let s = "";
  percorrer(n.content, (x) => { if (x.type === "text") s += x.text; else if (x.type === "hardBreak") s += " "; });
  return s;
};

/** Todo o texto do documento (com as legendas), para a busca. */
export function textoDoDoc(doc: Doc): string {
  const partes: string[] = [];
  percorrer(doc.content, (n) => {
    if (n.type === "paragraph" || n.type === "heading") partes.push(textoDe(n));
    else if (n.type === "figura" || n.type === "video") partes.push(String(n.attrs?.legenda ?? ""));
    else if (n.type === "galeria") for (const f of (n.attrs?.fotos as Foto[]) ?? []) partes.push(f.legenda ?? "");
  });
  return partes.join(" ");
}

/** O começo do texto (o primeiro parágrafo com algo escrito), para a lista de publicações. */
export function resumoDoDoc(doc: Doc, max = 180): string {
  let r = "";
  percorrer(doc.content, (n) => {
    if (!r && n.type === "paragraph") r = textoDe(n).replace(/\s+/g, " ").trim();
  });
  return r.length > max ? `${r.slice(0, max - 1).trimEnd()}…` : r;
}

/** O documento não tem nada: nem texto, nem imagem, nem vídeo. */
export const docVazio = (doc: Doc) =>
  !doc.content.some((n) => !["paragraph", "heading"].includes(n.type) || textoDe(n).trim());

/** Endereços de todas as imagens do texto. */
export function imagensDoDoc(doc: Doc): string[] {
  const out: string[] = [];
  percorrer(doc.content, (n) => {
    if (n.type === "figura") out.push(String(n.attrs?.src));
    else if (n.type === "galeria") for (const f of (n.attrs?.fotos as Foto[]) ?? []) out.push(f.src);
  });
  return out;
}

/** Troca o endereço de cada imagem do texto (por exemplo, rascunho data: pelo endereço no Storage). */
export async function trocarImagens(doc: Doc, fn: (src: string) => Promise<string>): Promise<Doc> {
  const map = async (nodes: No[]): Promise<No[]> =>
    Promise.all(nodes.map(async (n) => {
      if (n.type === "figura") return { ...n, attrs: { ...n.attrs, src: await fn(String(n.attrs?.src)) } };
      if (n.type === "galeria") {
        const fotos = await Promise.all(((n.attrs?.fotos as Foto[]) ?? []).map(async (f) => ({ ...f, src: await fn(f.src) })));
        return { ...n, attrs: { ...n.attrs, fotos } };
      }
      return n.content ? { ...n, content: await map(n.content) } : n;
    }));
  return { type: "doc", content: await map(doc.content) };
}
