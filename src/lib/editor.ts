// Ponte entre o editor (HTML editável no navegador) e os blocos salvos do post.
// Só guardamos o que o portal sabe mostrar: parágrafo, subtítulo, lista, negrito, itálico e as
// etapas do experimento. Qualquer outra coisa (cores, fontes, links colados do Word) vira texto simples,
// e é por isso que o editor também passa o que é colado por aqui: o que se vê é o que será publicado.

import { STEPS, type Bloco } from "./data";
import { parseInline } from "./rich";

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
    if (n.hasAttribute("data-steps")) { flush(); out.push({ steps: true }); return; }
    if (tag === "BR") { flush(); return; }
    if (!BLOCK.test(tag)) {
      if (hasBlockChild(n)) { flush(); out.push(...serialize(n)); }
      else loose += inlineNode(n, false, false);
      return;
    }
    flush();
    if (/^H[1-6]$/.test(tag)) {
      const t = clean(n.textContent ?? "");
      if (t) out.push({ h: t });
    } else if (tag === "UL" || tag === "OL") {
      const items = [...n.children].map((li) => clean(inline(li))).filter(Boolean);
      if (items.length) out.push({ ul: items });
    } else if (hasBlockChild(n)) {
      out.push(...serialize(n));
    } else {
      const t = clean(inline(n));
      if (t) out.push({ p: t });
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

export const STEPS_HTML =
  `<div class="steps-embed" data-steps contenteditable="false"><ol class="steps">` +
  STEPS.map(([t, d]) => `<li><div><b>${escHtml(t)}</b><span>${escHtml(d)}</span></div></li>`).join("") +
  `</ol><button type="button" class="embed-x" data-remove>Remover etapas</button></div>`;

/** Blocos salvos para HTML do editor (para reabrir um rascunho). Ignora o que não reconhece. */
export function blocksToHtml(corpo: unknown): string {
  if (!Array.isArray(corpo)) return "<p><br></p>";
  let html = "";
  let last = "";
  for (const b of corpo) {
    if (!b || typeof b !== "object") continue;
    if ("steps" in b) { html += STEPS_HTML; last = "steps"; continue; }
    if ("h" in b && typeof b.h === "string") html += `<h2>${escHtml(b.h)}</h2>`;
    else if ("ul" in b && Array.isArray(b.ul)) html += `<ul>${(b.ul as unknown[]).map((x) => `<li>${inlineHtml(String(x))}</li>`).join("")}</ul>`;
    else if ("p" in b && typeof b.p === "string") html += `<p>${inlineHtml(b.p)}</p>`;
    else continue;
    last = "";
  }
  // Sempre deixa um parágrafo depois das etapas para o cursor ter onde ficar.
  if (!html || last === "steps") html += "<p><br></p>";
  return html;
}
