"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AREAS, FRENTES, LOCAL_PREFIX, fmtDate, isAlinhamento, isAreaKey, isFrenteKey,
  type Alinhamento, type AreaKey, type Bloco, type FrenteKey, type Post,
} from "@/lib/data";
import { blocksToHtml, EMPTY_P, imageToDataUrl, imgHtml, inlineHtml, serialize, stepsHtml } from "@/lib/editor";
import { addLocalPost } from "@/lib/localPosts";
import { plainText, validW, W_MIN } from "@/lib/rich";
import { CrystalArt } from "./CrystalArt";
import { GripIcon, ListIcon, PhotoIcon, RedoIcon, StepsIcon, UndoIcon } from "./Icons";
import { Author, PostRow } from "./PostRow";
import { useToast } from "./Toast";

const DRAFT_KEY = "cristhaal-rascunho";

type Draft = { titulo: string; tituloAl: Alinhamento; frente: FrenteKey; areas: AreaKey[]; corpo: Bloco[]; seed: number };
type Fmt = { bold: boolean; italic: boolean; list: boolean; h: boolean };
/** O bloco sob o mouse ou o cursor, com a posição dele dentro do texto. */
type Ativo = { el: HTMLElement; top: number; left: number; width: number; height: number; areaW: number; al: Alinhamento; w: number | null };
type Tipo = "subtitulo" | "imagem" | "lista" | "etapas";
type Menu = { onde: "lado" | "fim"; alvo: Element | null };

const NO_FMT: Fmt = { bold: false, italic: false, list: false, h: false };
const ALS: Alinhamento[] = ["left", "center", "right"];
const AL_NOME: Record<Alinhamento, string> = { left: "à esquerda", center: "no centro", right: "à direita" };

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

/** Mantém a seleção no texto quando se clica num botão da barra. */
const keepSelection = (e: React.MouseEvent) => e.preventDefault();

/** Largura da coluna de texto, igual a --col no CSS. */
const COL_REM = 42;

const alOf = (el: HTMLElement): Alinhamento => (isAlinhamento(el.dataset.al) ? el.dataset.al : "left");
const medir = (el: HTMLElement): Ativo => {
  const w = Number(el.dataset.w);
  return {
    el, top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight,
    areaW: el.parentElement?.clientWidth || 1, al: alOf(el), w: validW(w) ? w : null,
  };
};
const larguraAtual = (a: Ativo) => a.w ?? Math.round((a.width / a.areaW) * 100);
const nomeLargura = (w: number | null) => (w === null ? "Coluna do texto" : w === 100 ? "Largura total" : `${w}% da largura`);

function PhotoPicker({ onFiles, className, children, title }: { onFiles: (f: File[]) => void; className: string; children: React.ReactNode; title?: string }) {
  return (
    <label className={className} title={title} onMouseDown={keepSelection}>
      {children}
      <input
        className="file-hidden" type="file" accept="image/*" multiple
        onChange={(e) => { onFiles([...(e.target.files ?? [])]); e.target.value = ""; }}
      />
    </label>
  );
}

/**
 * Alça de alinhamento: arrastada para os lados, encaixa o bloco à esquerda, no centro ou à direita
 * de `area`. Pelo teclado, as setas fazem o mesmo.
 */
function AlignGrip({ value, onChange, area, onEnd, onDrag, label, className = "" }: {
  value: Alinhamento; onChange: (a: Alinhamento) => void; area: () => HTMLElement | null;
  onEnd?: () => void; onDrag?: (on: boolean) => void; label: string; className?: string;
}) {
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = area();
    if (!el || e.button !== 0) return;
    e.preventDefault();
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    onDrag?.(true);
    const move = (ev: PointerEvent) => {
      const x = (ev.clientX - r.left) / r.width;
      onChange(x < 1 / 3 ? "left" : x < 2 / 3 ? "center" : "right");
    };
    const up = () => {
      btn.removeEventListener("pointermove", move);
      btn.removeEventListener("pointerup", up);
      btn.removeEventListener("pointercancel", up);
      onDrag?.(false);
      onEnd?.();
    };
    btn.addEventListener("pointermove", move);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = ALS.indexOf(value);
    const j = e.key === "ArrowLeft" ? i - 1 : e.key === "ArrowRight" ? i + 1 : -9;
    if (j < 0 || j > 2) return;
    e.preventDefault();
    onChange(ALS[j]);
    onEnd?.();
  };
  return (
    <button
      type="button" className={`grip ${className}`} title="Arraste para os lados para alinhar"
      aria-label={`${label}: ${AL_NOME[value]}. Arraste para os lados ou use as setas.`}
      onPointerDown={onPointerDown} onKeyDown={onKeyDown} onMouseDown={keepSelection}
    >
      <GripIcon />
    </button>
  );
}

/** Faixa que aparece enquanto se arrasta, mostrando os três lugares onde o bloco pode encaixar. */
function Guides({ al, style }: { al: Alinhamento; style: React.CSSProperties }) {
  return (
    <div className="al-guides" style={style} aria-hidden="true">
      {ALS.map((a) => <span key={a} className={a === al ? "on" : undefined}>{AL_NOME[a].replace(/^(à|no) /, "")}</span>)}
    </div>
  );
}

function BlockMenu({ etapas, onPick, onClose }: { etapas: boolean; onPick: (t: Tipo) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector("button")?.focus();
    const out = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // No próximo tique, para o clique que abriu o menu não fechá-lo.
    const t = setTimeout(() => document.addEventListener("pointerdown", out));
    document.addEventListener("keydown", esc);
    return () => { clearTimeout(t); document.removeEventListener("pointerdown", out); document.removeEventListener("keydown", esc); };
  }, [onClose]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(ref.current?.querySelectorAll("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };
  const item = (t: Tipo, icon: React.ReactNode, nome: string, desc: string) => (
    <button type="button" role="menuitem" onMouseDown={keepSelection} onClick={() => onPick(t)}>
      <span className="bm-ic" aria-hidden="true">{icon}</span>
      <span><b>{nome}</b><small>{desc}</small></span>
    </button>
  );
  return (
    <div className="block-menu" role="menu" aria-label="Adicionar bloco" ref={ref} onKeyDown={onKeyDown}>
      {item("subtitulo", <b className="bm-h">T</b>, "Subtítulo", "Um título para uma parte do texto")}
      {item("imagem", <PhotoIcon />, "Imagem", "Uma foto no meio do texto, com legenda")}
      {item("lista", <ListIcon />, "Lista", "Itens com marcadores")}
      {etapas && item("etapas", <StepsIcon />, "Etapas do experimento", "Solução, Inserção, Crescimento e Análise")}
    </div>
  );
}

/** Controles do bloco ativo: alça de largura na borda, botão + e alça de posição. */
function BlockControls({ a, rotulo, redimensionando, menuAberto, onResize, onResizeKey, onResetWidth, onMenu, onAlign, onAlignEnd, onAlignDrag, area, children }: {
  a: Ativo; rotulo: string | null; redimensionando: boolean; menuAberto: boolean;
  onResize: (e: React.PointerEvent<HTMLButtonElement>) => void; onResizeKey: (e: React.KeyboardEvent) => void; onResetWidth: () => void;
  onMenu: () => void; onAlign: (al: Alinhamento) => void; onAlignEnd: () => void; onAlignDrag: (on: boolean) => void;
  area: () => HTMLElement | null; children?: React.ReactNode;
}) {
  const direita = a.left + a.width;
  const aoLado = a.areaW - direita >= 110;
  const esq = a.al === "right";
  return (
    <>
      <button
        type="button" className={`resize-h${redimensionando ? " on" : ""}`}
        style={{ top: a.top, height: a.height, left: esq ? a.left - 18 : direita + 6 }}
        title="Arraste para mudar a largura (dois cliques voltam para a coluna do texto)"
        aria-label={`Largura do bloco: ${nomeLargura(a.w)}. Arraste ou use as setas.`}
        onPointerDown={onResize} onKeyDown={onResizeKey} onMouseDown={keepSelection} onDoubleClick={onResetWidth}
      />
      {rotulo && (
        <span className="resize-label" data-side={esq ? "l" : "r"} style={{ top: a.top + a.height / 2, left: esq ? a.left - 26 : direita + 26 }}>
          {rotulo}
        </span>
      )}
      <div
        className={`block-tools${menuAberto ? " open" : ""}${aoLado ? "" : " above"}`}
        style={aoLado ? { top: a.top, left: direita + 28 } : { top: a.top, right: Math.max(0, a.areaW - direita) }}
        hidden={redimensionando}
      >
        <button
          type="button" className="bt-add" aria-label="Adicionar bloco depois deste" title="Adicionar bloco"
          aria-haspopup="menu" aria-expanded={menuAberto} onMouseDown={keepSelection} onClick={onMenu}
        >
          +
        </button>
        <AlignGrip label="Posição do bloco" value={a.al} onChange={onAlign} area={area} onEnd={onAlignEnd} onDrag={onAlignDrag} />
        {children}
      </div>
    </>
  );
}

/**
 * Editor de publicação. A página de edição é a própria publicação: o mesmo título, a mesma capa,
 * o mesmo texto e a mesma galeria da página do post. Escreve-se direto nela, como num editor de texto.
 * Por enquanto salva só no navegador (rascunho e publicação).
 */
export function Composer() {
  const router = useRouter();
  const toast = useToast();
  const [titulo, setTitulo] = useState("");
  const [tituloAl, setTituloAl] = useState<Alinhamento>("left");
  const [frente, setFrente] = useState<FrenteKey>("educa");
  const [areas, setAreas] = useState<AreaKey[]>(["C"]);
  const [corpo, setCorpo] = useState<Bloco[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [seed, setSeed] = useState(13);
  const [fmt, setFmt] = useState<Fmt>(NO_FMT);
  const [ativo, setAtivo] = useState<Ativo | null>(null);
  const [arrasto, setArrasto] = useState<{ tipo: "titulo" | "bloco" | "largura"; top: number; h: number } | null>(null);
  const [rotulo, setRotulo] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState<"" | "salvo" | "cheio">("");
  const [pronto, setPronto] = useState(false);
  // A data de hoje só é lida no navegador (no servidor a página é pré-renderizada uma vez só).
  const [hoje, setHoje] = useState("2026-01-01");
  const rootRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const imgAlvo = useRef<Element | null>(null);
  const publicado = useRef(false);

  // Abre o rascunho salvo, se houver.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- data, sorteio e rascunho só existem no navegador */
    setHoje(new Date().toLocaleDateString("sv-SE"));
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch {}
    let d: Partial<Draft> | null = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch {}
    if (d && typeof d === "object") {
      if (typeof d.titulo === "string") setTitulo(d.titulo);
      if (isAlinhamento(d.tituloAl)) setTituloAl(d.tituloAl);
      if (typeof d.frente === "string" && isFrenteKey(d.frente)) setFrente(d.frente);
      if (Array.isArray(d.areas)) setAreas(d.areas.filter((k) => typeof k === "string" && isAreaKey(k)));
    }
    setSeed(typeof d?.seed === "number" ? d.seed : Math.floor(Math.random() * 1e6));
    const ed = editorRef.current!;
    ed.innerHTML = blocksToHtml(d?.corpo);
    setCorpo(serialize(ed));
    setPronto(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Salva o rascunho meio segundo depois da última mudança.
  useEffect(() => {
    if (!pronto) return;
    const vazio = !titulo.trim() && !corpo.length;
    const t = setTimeout(() => {
      if (publicado.current) return;
      try {
        if (vazio) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify({ titulo, tituloAl, frente, areas, corpo, seed } satisfies Draft));
        setSalvo(vazio ? "" : "salvo");
      } catch {
        setSalvo("cheio");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [pronto, titulo, tituloAl, frente, areas, corpo, seed]);

  // A barra de ferramentas gruda logo abaixo do cabeçalho do site, qualquer que seja a altura dele.
  useEffect(() => {
    const top = document.querySelector<HTMLElement>(".top");
    const root = rootRef.current;
    if (!top || !root) return;
    const ro = new ResizeObserver(() => root.style.setProperty("--bar-top", `${top.offsetHeight}px`));
    ro.observe(top);
    return () => ro.disconnect();
  }, []);

  const blocoDe = (n: Node | null): HTMLElement | null => {
    const ed = editorRef.current;
    while (n && ed && n.parentNode !== ed) n = n.parentNode;
    return n && isElement(n) ? n : null;
  };

  // Acende os botões conforme o que está sob o cursor, e mostra as ferramentas do bloco atual.
  useEffect(() => {
    const onSel = () => {
      const ed = editorRef.current;
      const sel = getSelection();
      if (!ed || !sel?.anchorNode || !ed.contains(sel.anchorNode)) return;
      const block = String(document.queryCommandValue("formatBlock")).toLowerCase().replace(/[<>]/g, "");
      setFmt({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        list: document.queryCommandState("insertUnorderedList"),
        h: /^h[1-6]$/.test(block),
      });
      let el: Node | null = sel.anchorNode;
      while (el && el.parentNode !== ed) el = el.parentNode;
      if (el && isElement(el)) setAtivo((prev) => (prev?.el === el ? prev : medir(el)));
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  // O título cresce com o texto, como um título de verdade.
  useEffect(() => {
    const t = titleRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  }, [titulo, tituloAl]);

  const sync = () => {
    const ed = editorRef.current;
    if (!ed) return;
    setCorpo(serialize(ed));
    setAtivo((prev) => (prev && prev.el.parentNode === ed ? medir(prev.el) : null));
    setErro("");
  };

  /** Garante que o cursor está dentro do texto antes de aplicar um comando. */
  const focusEditor = () => {
    const ed = editorRef.current!;
    const sel = getSelection();
    if (sel?.anchorNode && ed.contains(sel.anchorNode)) return;
    ed.focus();
    const r = document.createRange();
    r.selectNodeContents(ed);
    r.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(r);
  };

  const caretEm = (node: Node) => {
    editorRef.current!.focus();
    const r = document.createRange();
    r.setStart(node, 0);
    r.collapse(true);
    const s = getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  };

  const run = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
    sync();
  };

  /**
   * Põe blocos novos logo depois de `alvo` (ou no fim do texto). Se o alvo for um parágrafo vazio,
   * os blocos entram no lugar dele. Com `paragrafoDepois`, garante um parágrafo para continuar escrevendo.
   */
  const inserir = (alvo: Element | null, html: string, paragrafoDepois = false): { nodes: Node[]; depois: Node | null } => {
    const ed = editorRef.current!;
    const ref = alvo && alvo.parentNode === ed ? alvo : null;
    const next = ref ? ref.nextSibling : null;
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const nodes = [...tpl.content.childNodes];
    let depois: Node | null = next && isElement(next) && next.tagName === "P" ? next : null;
    if (paragrafoDepois && !depois) {
      tpl.content.append(document.createRange().createContextualFragment(EMPTY_P));
      depois = tpl.content.lastChild;
    }
    ed.insertBefore(tpl.content, next);
    if (ref && ref.tagName === "P" && !ref.textContent?.trim()) ref.remove();
    return { nodes, depois };
  };

  const alvoAtual = () => {
    const s = getSelection();
    const ed = editorRef.current!;
    return (s?.anchorNode && ed.contains(s.anchorNode) ? blocoDe(s.anchorNode) : null) ?? ed.lastElementChild;
  };

  const escolher = (tipo: Tipo, alvo: Element | null) => {
    setMenu(null);
    if (tipo === "imagem") {
      imgAlvo.current = alvo;
      imgInputRef.current?.click();
      return;
    }
    if (tipo === "subtitulo") {
      const { nodes } = inserir(alvo, "<h2><br></h2>");
      caretEm(nodes[0]);
    } else if (tipo === "lista") {
      const { nodes } = inserir(alvo, "<ul><li><br></li></ul>");
      caretEm(nodes[0].firstChild!);
    } else {
      const { depois } = inserir(alvo, stepsHtml(), true);
      if (depois) caretEm(depois);
    }
    sync();
  };

  const addImagens = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    const urls = await Promise.all(imgs.map((f) => imageToDataUrl(f).catch(() => "")));
    const html = urls.filter(Boolean).map((u) => imgHtml(u)).join("");
    if (!html) { setErro("Não foi possível abrir essa imagem."); return; }
    const { nodes } = inserir(imgAlvo.current ?? alvoAtual(), html, true);
    (nodes[0] as HTMLElement | undefined)?.querySelector("input")?.focus();
    sync();
  };

  const addFotos = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length) setFotos((prev) => [...prev, ...imgs.map((f) => URL.createObjectURL(f))]);
  };

  const removeFoto = (url: string) => {
    URL.revokeObjectURL(url);
    setFotos((prev) => prev.filter((u) => u !== url));
  };

  // Colar: mantém só o que o portal mostra (parágrafos, subtítulos, listas, negrito e itálico).
  const onPaste = (e: React.ClipboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return; // legenda de imagem: colagem normal
    e.preventDefault();
    const files = [...e.clipboardData.files];
    if (files.length) { imgAlvo.current = alvoAtual(); void addImagens(files); return; }
    const html = e.clipboardData.getData("text/html");
    let blocos: Bloco[] = [];
    if (html) blocos = serialize(new DOMParser().parseFromString(html, "text/html").body);
    if (!blocos.length) {
      const text = e.clipboardData.getData("text/plain");
      blocos = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map((p) => ({ p: p.replace(/[\\*]/g, "\\$&") }));
    }
    if (!blocos.length) return;
    const only = blocos[0];
    if (blocos.length === 1 && "p" in only) document.execCommand("insertHTML", false, inlineHtml(only.p));
    else document.execCommand("insertHTML", false, blocksToHtml(blocos).replace(/<p><br><\/p>$/, ""));
    sync();
  };

  // Arrastar uma foto do computador para o texto põe a imagem ali.
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    imgAlvo.current = blocoDe(e.target as Node) ?? alvoAtual();
    void addImagens([...e.dataTransfer.files]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Sublinhado não existe no portal; sem o atalho, o que se vê continua igual ao publicado.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") e.preventDefault();
    // Enter na legenda leva de volta ao texto, logo abaixo da imagem.
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      const fig = (e.target as HTMLElement).closest("[data-block]");
      const next = fig?.nextElementSibling;
      if (next) caretEm(next);
    }
  };

  const onEditorClick = (e: React.MouseEvent) => {
    const x = (e.target as HTMLElement).closest("[data-remove]");
    if (!x) return;
    x.closest("[data-block]")?.remove();
    sync();
  };

  const onEditorMove = (e: React.MouseEvent) => {
    if (arrasto) return;
    const el = blocoDe(e.target as Node);
    if (el && el !== ativo?.el) setAtivo(medir(el));
  };

  const limparStyle = (el: HTMLElement) => { if (!el.getAttribute("style")) el.removeAttribute("style"); };

  const alinhar = (el: HTMLElement, al: Alinhamento) => {
    if (al === "left") delete el.dataset.al;
    else el.dataset.al = al;
    limparStyle(el);
    setAtivo(medir(el));
  };

  /** Muda a largura do bloco (em % da largura do post). null volta para a coluna de texto. */
  const largura = (el: HTMLElement, w: number | null) => {
    if (w === null) { delete el.dataset.w; el.style.removeProperty("width"); }
    else { el.dataset.w = String(w); el.style.width = `${w}%`; }
    limparStyle(el);
    setAtivo(medir(el));
  };

  const startResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    const a = ativo;
    const ed = editorRef.current;
    if (!a || !ed || e.button !== 0) return;
    e.preventDefault();
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    const r = ed.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const col = Math.min(100, ((COL_REM * rem) / r.width) * 100);
    setArrasto({ tipo: "largura", top: a.top, h: a.height });
    setRotulo(nomeLargura(a.w));
    const move = (ev: PointerEvent) => {
      const x = ev.clientX - r.left;
      const px = a.al === "center" ? 2 * Math.abs(x - r.width / 2) : a.al === "right" ? r.width - x : x - a.left;
      const pct = Math.max(W_MIN, Math.min(100, (px / r.width) * 100));
      // Perto da largura da coluna de texto, encaixa nela.
      const w = Math.abs(pct - col) < 3 ? null : Math.round(pct / 5) * 5;
      largura(a.el, w);
      setRotulo(nomeLargura(w));
    };
    const up = () => {
      btn.removeEventListener("pointermove", move);
      btn.removeEventListener("pointerup", up);
      btn.removeEventListener("pointercancel", up);
      setArrasto(null);
      setRotulo(null);
      sync();
    };
    btn.addEventListener("pointermove", move);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
  };

  const onResizeKey = (e: React.KeyboardEvent) => {
    const a = ativo;
    const d = e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0;
    if (!a || !d) return;
    e.preventDefault();
    largura(a.el, Math.max(W_MIN, Math.min(100, Math.round((larguraAtual(a) + d) / 5) * 5)));
    sync();
  };

  const toggleArea = (k: AreaKey) =>
    setAreas((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : AREAS.map((a) => a.k).filter((x) => x === k || prev.includes(x))));

  const primeiro = corpo.find((b): b is { p: string } => "p" in b);
  const draft: Post = {
    id: "rascunho", frente, areas, autor: "equipe", data: hoje, fotos: fotos.length, seed,
    titulo: titulo.trim(), tituloAl: tituloAl === "left" ? undefined : tituloAl,
    resumo: primeiro ? plainText(primeiro.p).slice(0, 180) : "O começo do texto aparece aqui.",
    corpo, imagens: fotos,
  };

  const publicar = () => {
    if (!draft.titulo) { setErro("Falta o título da publicação."); titleRef.current?.focus(); return; }
    if (!corpo.length) { setErro("Falta o texto da publicação."); focusEditor(); return; }
    if (!areas.length) { setErro("Escolha pelo menos uma área (as letras ao lado da data)."); return; }
    const id = `${LOCAL_PREFIX}${slug(draft.titulo) || "publicacao"}-${Date.now().toString(36)}`;
    if (!addLocalPost({ ...draft, id, imagens: undefined }, fotos)) {
      setErro("Não coube no navegador: tente com menos imagens no texto. (Na versão final, as fotos vão para o servidor.)");
      return;
    }
    publicado.current = true;
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    toast("Publicação publicada");
    router.push(`/publicacoes/${id}`);
  };

  const descartar = () => {
    if (!confirm("Apagar este rascunho? O que foi escrito será perdido.")) return;
    setTitulo("");
    setTituloAl("left");
    setAreas(["C"]);
    fotos.forEach((u) => URL.revokeObjectURL(u));
    setFotos([]);
    editorRef.current!.innerHTML = EMPTY_P;
    setCorpo([]);
    setAtivo(null);
    setErro("");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setSalvo("");
  };

  const F = FRENTES[frente];
  const etapas = frente === "experimenta";
  const temAlgo = !!titulo.trim() || corpo.length > 0 || fotos.length > 0;
  const ativoNoTexto = ativo?.el.isConnected ? ativo : null;
  const cover = fotos[0] ? (
    // eslint-disable-next-line @next/next/no-img-element -- fotos locais (blob:)
    <img src={fotos[0]} alt="" />
  ) : (
    <CrystalArt seed={seed} color={F.c} w={840} h={320} />
  );
  const fecharMenu = () => setMenu(null);

  return (
    <div className="composer" ref={rootRef} style={{ "--fc": F.c } as React.CSSProperties}>
      <div className="editor-bar" role="toolbar" aria-label="Ferramentas do texto">
        <div className="tb-group">
          <button className="tb" type="button" aria-pressed={!fmt.h} onMouseDown={keepSelection} onClick={() => run("formatBlock", "<p>")}>Texto</button>
          <button className="tb" type="button" aria-pressed={fmt.h} onMouseDown={keepSelection} onClick={() => run("formatBlock", fmt.h ? "<p>" : "<h2>")}>Subtítulo</button>
        </div>
        <span className="tb-sep" />
        <div className="tb-group">
          <button className="tb" type="button" aria-pressed={fmt.bold} aria-label="Negrito" title="Negrito (Ctrl+B)" onMouseDown={keepSelection} onClick={() => run("bold")}><b>N</b></button>
          <button className="tb" type="button" aria-pressed={fmt.italic} aria-label="Itálico" title="Itálico (Ctrl+I)" onMouseDown={keepSelection} onClick={() => run("italic")}><i className="tb-i">I</i></button>
          <button className="tb" type="button" aria-pressed={fmt.list} aria-label="Lista" title="Lista com marcadores" onMouseDown={keepSelection} onClick={() => run("insertUnorderedList")}><ListIcon /></button>
        </div>
        <span className="tb-sep" />
        <div className="tb-group">
          <PhotoPicker className="tb" onFiles={addFotos} title="Fotos da capa e da galeria"><PhotoIcon /><span className="tb-label">Fotos</span></PhotoPicker>
        </div>
        <span className="tb-sep" />
        <div className="tb-group">
          <button className="tb" type="button" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" onMouseDown={keepSelection} onClick={() => run("undo")}><UndoIcon /></button>
          <button className="tb" type="button" aria-label="Refazer" title="Refazer (Ctrl+Y)" onMouseDown={keepSelection} onClick={() => run("redo")}><RedoIcon /></button>
        </div>
        <div className="tb-end">
          <span className="save-state" aria-live="polite">
            {salvo === "salvo" ? "Rascunho salvo" : salvo === "cheio" ? "Rascunho grande demais para salvar" : ""}
          </span>
          {temAlgo && <button className="tb" type="button" onClick={descartar}>Descartar</button>}
          <button className="btn primary small" type="button" onClick={publicar}>Publicar</button>
        </div>
      </div>
      <p className="form-error compose-error" role="alert">{erro}</p>

      <article className="post-full editing" ref={articleRef}>
        {arrasto?.tipo === "titulo" && <Guides al={tituloAl} style={{ top: arrasto.top, height: arrasto.h }} />}
        <div ref={headRef} className={tituloAl === "left" ? "post-head" : `post-head al-${tituloAl}`}>
          <label className="fr fr-edit" style={{ "--fc": F.c } as React.CSSProperties}>
            <span className="sr-only">Frente</span>
            <select value={frente} onChange={(e) => setFrente(e.target.value as FrenteKey)}>
              {Object.entries(FRENTES).map(([k, f]) => <option key={k} value={k}>{f.full}</option>)}
            </select>
          </label>
          <div className="title-row">
            <textarea
              ref={titleRef} className="title-input" rows={1} maxLength={120} aria-label="Título"
              placeholder="Título da publicação" value={titulo}
              onChange={(e) => { setTitulo(e.target.value.replace(/\s*\n\s*/g, " ")); setErro(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); focusEditor(); } }}
            />
            <AlignGrip
              className="title-grip" label="Posição do título" value={tituloAl} onChange={setTituloAl}
              area={() => articleRef.current}
              onDrag={(on) => { const h = headRef.current; setArrasto(on && h ? { tipo: "titulo", top: h.offsetTop, h: h.offsetHeight } : null); }}
            />
          </div>
          <div className="meta">
            <Author autor="equipe" withRole />
            <time dateTime={hoje}>{fmtDate(hoje)}</time>
            <span className="letters letters-edit" role="group" aria-label="Áreas da publicação">
              {AREAS.map((a) => (
                <button
                  key={a.k} type="button" className="lt" aria-pressed={areas.includes(a.k)} aria-label={a.n} title={a.n}
                  style={{ "--c": a.c } as React.CSSProperties} onClick={() => toggleArea(a.k)}
                >
                  {a.l}
                </button>
              ))}
            </span>
          </div>
        </div>

        <div className="cover cover-edit">
          {cover}
          <PhotoPicker className="btn small cover-btn" onFiles={addFotos}>
            <PhotoIcon />{fotos.length ? "Mais fotos" : "Adicionar fotos"}
          </PhotoPicker>
        </div>

        <div className="editor-wrap">
          <div
            ref={editorRef}
            className={`prose post-body editor${corpo.length ? "" : " is-empty"}`}
            contentEditable suppressContentEditableWarning spellCheck lang="pt-BR"
            role="textbox" aria-multiline="true" aria-label="Texto da publicação"
            data-placeholder="Conte como foi o encontro: quem participou, o que foi feito, o que os estudantes descobriram."
            onInput={sync} onPaste={onPaste} onDrop={onDrop} onKeyDown={onKeyDown} onClick={onEditorClick} onMouseMove={onEditorMove}
          />
          {arrasto?.tipo === "bloco" && ativoNoTexto && <Guides al={ativoNoTexto.al} style={{ top: arrasto.top, height: arrasto.h }} />}
          {ativoNoTexto && (
            <BlockControls
              a={ativoNoTexto} rotulo={rotulo} redimensionando={arrasto?.tipo === "largura"} menuAberto={menu?.onde === "lado"}
              onResize={startResize} onResizeKey={onResizeKey} onResetWidth={() => { largura(ativoNoTexto.el, null); sync(); }}
              onMenu={() => setMenu(menu?.onde === "lado" ? null : { onde: "lado", alvo: ativoNoTexto.el })}
              onAlign={(al) => alinhar(ativoNoTexto.el, al)} onAlignEnd={sync} area={() => editorRef.current}
              onAlignDrag={(on) => setArrasto(on ? { tipo: "bloco", top: ativoNoTexto.el.offsetTop, h: ativoNoTexto.el.offsetHeight } : null)}
            >
              {menu?.onde === "lado" && <BlockMenu etapas={etapas} onPick={(t) => escolher(t, menu.alvo)} onClose={fecharMenu} />}
            </BlockControls>
          )}
          <div className="add-block">
            <button
              type="button" className="add-btn" aria-haspopup="menu" aria-expanded={menu?.onde === "fim"} onMouseDown={keepSelection}
              onClick={() => setMenu(menu?.onde === "fim" ? null : { onde: "fim", alvo: alvoAtual() })}
            >
              <span aria-hidden="true">+</span> Adicionar bloco
            </button>
            {menu?.onde === "fim" && <BlockMenu etapas={etapas} onPick={(t) => escolher(t, menu.alvo)} onClose={fecharMenu} />}
          </div>
          <input
            ref={imgInputRef} className="file-hidden" type="file" accept="image/*" multiple tabIndex={-1} aria-hidden="true"
            onChange={(e) => { void addImagens([...(e.target.files ?? [])]); e.target.value = ""; }}
          />
        </div>

        {fotos.length > 0 && (
          <>
            <h2 className="gallery-title">Fotos do encontro</h2>
            <div className="gallery">
              {fotos.map((u, k) => (
                <figure key={u}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt={`Foto ${k + 1} da publicação`} />
                  {k === 0 && <figcaption>Capa</figcaption>}
                  <button className="ph-x" type="button" aria-label={`Remover foto ${k + 1}`} onClick={() => removeFoto(u)}>×</button>
                </figure>
              ))}
              <PhotoPicker className="add-tile" onFiles={addFotos}><PhotoIcon size={26} />Adicionar</PhotoPicker>
            </div>
          </>
        )}
      </article>

      <section className="preview-box" aria-label="Prévia na lista">
        <small>E é assim que ela aparece na lista de publicações</small>
        <div className="feed"><PostRow post={draft} preview /></div>
      </section>
    </div>
  );
}

function isElement(n: Node): n is HTMLElement {
  return n.nodeType === 1;
}
