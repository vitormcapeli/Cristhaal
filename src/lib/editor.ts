// Ponte entre o editor (HTML editável no navegador) e os blocos salvos do post.
// Só guardamos o que o portal sabe mostrar: parágrafo, subtítulo, lista, negrito, itálico e as
// etapas do experimento. Qualquer outra coisa (cores, fontes, links colados do Word) vira texto simples,
// e é por isso que o editor também passa o que é colado por aqui: o que se vê é o que será publicado.

import { STEPS, type Bloco, type Caixa } from "./data";
import { boxProps, parseInline, validW } from "./rich";

const escMark = (s: string) => s.replace(/[\\*]/g, "\\$&");
export const escHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const SKIP = new Set(["STYLE", "SCRIPT", "TEMPLATE", "HEAD", "META", "LINK", "TITLE", "NOSCRIPT", "BUTTON", "IMG", "SVG", "VIDEO", "IFRAME"]);
const BLOCK = /^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|NAV|TABLE|TBODY|THEAD|TFOOT|TR|TD|TH|PRE|FIGURE|FIGCAPTION|HR|DL|DT|DD|CENTER)$/;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Põe a marcação em volta do texto, deixando os espaços das pontas de fora. */
function wrap(s: string, m: string) {
  const [, a, mid, z] = /^(\s*)([\s\S]*?)(\s*)$/.exec(s)!;
  return mid ? `${a}${m}${mid}${m}${z}` : s;
}

function isBold(el: HTMLElement) {
  const w = el.style.fontWeight;
  if (w) return w === "bold" || w === "bolder" || Number(w) >= 600;
  return el.tagName === "B" || el.tagName === "STRONG";
}

function isItalic(el: HTMLElement) {
  const s = el.style.fontStyle;
  if (s) return s === "italic" || s === "oblique";
  return el.tagName === "I" || el.tagName === "EM";
}

const isEl = (n: Node): n is HTMLElement => n.nodeType === 1;
const hasBlockChild = (el: Element) => [...el.children].some((c) => BLOCK.test(c.tagName) || c.hasAttribute("data-steps"));

function inline(node: Node, b = false, i = false): string {
  let out = "";
  node.childNodes.forEach((c) => { out += inlineNode(c, b, i); });
  return out;
}

function inlineNode(c: Node, b: boolean, i: boolean): string {
  if (c.nodeType === 3) return escMark(c.textContent ?? "");
  if (!isEl(c) || SKIP.has(c.tagName)) return "";
  if (c.tagName === "BR") return " ";
  if (c.getAttribute("style")?.includes("mso-list:Ignore")) return ""; // marcador de lista do Word
  const nb = !b && isBold(c);
  const ni = !i && isItalic(c);
  let s = inline(c, b || nb, i || ni);
  if (ni) s = wrap(s, "*");
  if (nb) s = wrap(s, "**");
  return s;
}

/** Largura e alinhamento guardados nos atributos data-w e data-al do bloco. */
export function caixaDe(el: HTMLElement): Caixa {
  const c: Caixa = {};
  const al = el.dataset.al;
  if (al === "left" || al === "center" || al === "right") c.al = al;
  const w = Number(el.dataset.w);
  if (validW(w)) c.w = Math.round(w);
  return c;
}

/** Os mesmos atributos, em HTML. */
const boxAttrs = (b: Caixa) => {
  const p = boxProps(b);
  return (p["data-al"] ? ` data-al="${p["data-al"]}"` : "") + (p["data-w"] ? ` data-w="${p["data-w"]}" style="width:${p["data-w"]}%"` : "");
};

/** Lê o conteúdo do editor (ou de um HTML colado) e devolve os blocos do post. */
export function serialize(root: Node): Bloco[] {
  const out: Bloco[] = [];
  let loose = "";
  const flush = () => {
    const t = clean(loose);
    if (t) out.push({ p: t });
    loose = "";
  };
  root.childNodes.forEach((n) => {
    if (n.nodeType === 3) { loose += escMark(n.textContent ?? ""); return; }
    if (!isEl(n) || SKIP.has(n.tagName)) return;
    const tag = n.tagName;
    if (n.hasAttribute("data-steps")) { flush(); out.push({ steps: true, ...caixaDe(n) }); return; }
    if (n.hasAttribute("data-img")) {
      flush();
      const src = n.querySelector("img")?.getAttribute("src") ?? "";
      const leg = clean(n.querySelector("input")?.value ?? "");
      // Só imagens enviadas pelo próprio editor (data:), nunca endereços colados de outro site.
      if (src.startsWith("data:image/")) out.push(leg ? { img: src, leg, ...caixaDe(n) } : { img: src, ...caixaDe(n) });
      return;
    }
    if (tag === "BR") { flush(); return; }
    if (!BLOCK.test(tag)) {
      if (hasBlockChild(n)) { flush(); out.push(...serialize(n)); }
      else loose += inlineNode(n, false, false);
      return;
    }
    flush();
    if (/^H[1-6]$/.test(tag)) {
      const t = clean(n.textContent ?? "");
      if (t) out.push({ h: t, ...caixaDe(n) });
    } else if (tag === "UL" || tag === "OL") {
      const items = [...n.children].map((li) => clean(inline(li))).filter(Boolean);
      if (items.length) out.push({ ul: items, ...caixaDe(n) });
    } else if (hasBlockChild(n)) {
      out.push(...serialize(n));
    } else {
      const t = clean(inline(n));
      if (t) out.push({ p: t, ...caixaDe(n) });
    }
  });
  flush();
  return out;
}

/** Texto com marcação para HTML do editor. */
export const inlineHtml = (s: string) =>
  parseInline(s)
    .map(({ t, b, i }) => {
      let h = escHtml(t);
      if (i) h = `<i>${h}</i>`;
      if (b) h = `<b>${h}</b>`;
      return h;
    })
    .join("");

export const EMPTY_P = "<p><br></p>";

export const stepsHtml = (box: Caixa = {}) =>
  `<div class="steps-embed" data-block data-steps contenteditable="false"${boxAttrs(box)}><ol class="steps">` +
  STEPS.map(([t, d]) => `<li><div><b>${escHtml(t)}</b><span>${escHtml(d)}</span></div></li>`).join("") +
  `</ol><button type="button" class="embed-x" data-remove>Remover etapas</button></div>`;

export const imgHtml = (src: string, leg = "", box: Caixa = {}) =>
  `<figure class="img-block" data-block data-img contenteditable="false"${boxAttrs(box)}><img src="${escHtml(src)}" alt="">` +
  `<input class="img-leg" type="text" maxlength="200" placeholder="Escreva uma legenda (opcional)" aria-label="Legenda da imagem" value="${escHtml(leg)}">` +
  `<button type="button" class="embed-x" data-remove>Remover imagem</button></figure>`;

/** Blocos salvos para HTML do editor (para reabrir um rascunho). Ignora o que não reconhece. */
export function blocksToHtml(corpo: unknown): string {
  if (!Array.isArray(corpo)) return EMPTY_P;
  let html = "";
  let embed = false;
  for (const b of corpo) {
    if (!b || typeof b !== "object") continue;
    embed = false;
    const box = boxAttrs(b as Caixa);
    if ("steps" in b) { html += stepsHtml(b as Caixa); embed = true; }
    else if ("img" in b && typeof b.img === "string" && b.img.startsWith("data:image/")) {
      html += imgHtml(b.img, "leg" in b && typeof b.leg === "string" ? b.leg : "", b as Caixa);
      embed = true;
    }
    else if ("h" in b && typeof b.h === "string") html += `<h2${box}>${escHtml(b.h)}</h2>`;
    else if ("ul" in b && Array.isArray(b.ul)) html += `<ul${box}>${(b.ul as unknown[]).map((x) => `<li>${inlineHtml(String(x))}</li>`).join("")}</ul>`;
    else if ("p" in b && typeof b.p === "string") html += `<p${box}>${inlineHtml(b.p)}</p>`;
  }
  // Depois de etapas ou imagem sempre fica um parágrafo, para o cursor ter onde continuar.
  if (!html || embed) html += EMPTY_P;
  return html;
}

/** Reduz a foto para caber no rascunho: no máximo 1600 px de largura, em JPEG. */
export async function imageToDataUrl(file: File, max = 1600): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c.toDataURL("image/jpeg", 0.82);
}
