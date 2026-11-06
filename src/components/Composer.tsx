"use client";

import { NodeSelection } from "@tiptap/pm/state";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AREAS, FRENTES, fmtDate, isAlinhamento, isAreaKey, isFrenteKey,
  type Alinhamento, type AreaKey, type FrenteKey, type Post,
} from "@/lib/data";
import {
  caminhoNoStorage, docVazio, imagensDoDoc, limparDoc, linkSeguro, normalizarLink, resumoDoDoc, trocarImagens,
  type Doc, type Tom,
} from "@/lib/doc";
import { arquivosParaImagens } from "@/lib/imagem";
import { postsMudaram } from "@/app/actions";
import { BUCKET, COLUNAS, postToRow, rowToPost, supabaseNavegador, type PostRow as Linha } from "@/lib/supabase";
import { enviarImagem } from "@/lib/upload";
import { validW, W_MIN } from "@/lib/rich";
import { semAcento } from "@/lib/search";
import { CrystalArt } from "./CrystalArt";
import { Destaque, Etapas, Figura, Galeria, SairDoBloco, Video } from "./editor/nodes";
import {
  AlignIcon, ArrowIcon, CalloutIcon, DividerIcon, DotsIcon, GalleryIcon, GripIcon, HighlightIcon, LinkIcon, ListIcon,
  OrderedListIcon, PhotoIcon, QuoteIcon, RedoIcon, StepsIcon, TrashIcon, UndoIcon, YoutubeIcon,
} from "./Icons";
import { Author, PostRow } from "./PostRow";
import { useToast } from "./Toast";

const DRAFT_KEY = "cristhaal-rascunho";

type Draft = { titulo: string; tituloAl: Alinhamento; tituloW: number | null; frente: FrenteKey; areas: AreaKey[]; corpo: unknown; seed: number };

const ALS: Alinhamento[] = ["left", "center", "right"];
const AL_NOME: Record<Alinhamento, string> = { left: "à esquerda", center: "no centro", right: "à direita" };
const TOM_NOME: Record<Tom, string> = { nota: "Nota", dica: "Dica", atencao: "Atenção" };

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

/** Marca de tempo curta, para nomes únicos (id da publicação e arquivos). */
const carimbo = () => Date.now().toString(36);

/** Mantém a seleção no texto quando se clica num botão da barra. */
const keepSelection = (e: React.MouseEvent) => e.preventDefault();

/** Largura padrão do cabeçalho do post, igual ao max-width de .post-head no CSS. */
const HEAD_PX = 800;

// Blocos que se inserem pelo +, pelo / e pelo botão Inserir -------------------------------------

type Tipo = "h2" | "h3" | "ul" | "ol" | "quote" | "callout" | "imagem" | "galeria" | "video" | "divisoria" | "etapas";
type Item = { t: Tipo; nome: string; desc: string; icon: React.ReactNode; busca: string };

const ITENS: Item[] = [
  { t: "h2", nome: "Subtítulo", desc: "Título de uma parte do texto", icon: <b className="bm-h">T</b>, busca: "subtitulo titulo h2" },
  { t: "h3", nome: "Subtítulo menor", desc: "Título dentro de uma parte", icon: <b className="bm-h bm-h3">T</b>, busca: "subtitulo menor topico h3" },
  { t: "ul", nome: "Lista", desc: "Itens com marcadores", icon: <ListIcon />, busca: "lista marcadores topicos" },
  { t: "ol", nome: "Lista numerada", desc: "Passo 1, passo 2…", icon: <OrderedListIcon />, busca: "lista numerada numeros passos" },
  { t: "quote", nome: "Citação", desc: "A fala de alguém, em destaque", icon: <QuoteIcon />, busca: "citacao fala aspas depoimento" },
  { t: "callout", nome: "Caixa de destaque", desc: "Nota, dica ou aviso numa caixa colorida", icon: <CalloutIcon />, busca: "destaque caixa nota dica aviso atencao" },
  { t: "imagem", nome: "Imagem", desc: "Uma foto, no centro ou com texto ao lado", icon: <PhotoIcon />, busca: "imagem foto figura" },
  { t: "galeria", nome: "Galeria", desc: "Várias fotos lado a lado", icon: <GalleryIcon />, busca: "galeria fotos varias grade" },
  { t: "video", nome: "Vídeo do YouTube", desc: "Cole o link do vídeo", icon: <YoutubeIcon size={20} />, busca: "video youtube" },
  { t: "divisoria", nome: "Divisória", desc: "Separa partes do texto", icon: <DividerIcon />, busca: "divisoria separador linha" },
  { t: "etapas", nome: "Etapas do experimento", desc: "Solução, Inserção, Crescimento e Análise", icon: <StepsIcon />, busca: "etapas experimento passos" },
];

/** Bloco novo, vazio, de cada tipo de texto, e onde fica o cursor dentro dele. */
const NOVO: Partial<Record<Tipo, [JSONContent, number]>> = {
  h2: [{ type: "heading", attrs: { level: 2 } }, 1],
  h3: [{ type: "heading", attrs: { level: 3 } }, 1],
  ul: [{ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] }, 3],
  ol: [{ type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] }, 3],
  quote: [{ type: "blockquote", content: [{ type: "paragraph" }] }, 2],
  callout: [{ type: "callout", attrs: { tom: "nota" }, content: [{ type: "paragraph" }] }, 2],
};

type Faixa = { from: number; to: number };

/** Onde entra um bloco novo: no lugar do parágrafo vazio onde está o cursor, ou logo depois do bloco atual. */
function alvoDe(ed: Editor): Faixa {
  const sel = ed.state.selection;
  if (sel instanceof NodeSelection) return { from: sel.to, to: sel.to };
  const { $from } = sel;
  if ($from.depth === 0) return { from: $from.pos, to: $from.pos };
  const no = $from.node(1);
  if (no.type.name === "paragraph" && no.content.size === 0) return { from: $from.before(1), to: $from.after(1) };
  return { from: $from.after(1), to: $from.after(1) };
}

function BlockMenu({ itens, onPick, onClose, ativo, style, focar = true }: {
  itens: Item[]; onPick: (t: Tipo) => void; onClose: () => void; ativo?: number; style?: React.CSSProperties; focar?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focar) ref.current?.querySelector("button")?.focus();
    const out = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // No próximo tique, para o clique que abriu o menu não fechá-lo.
    const t = setTimeout(() => document.addEventListener("pointerdown", out));
    document.addEventListener("keydown", esc);
    return () => { clearTimeout(t); document.removeEventListener("pointerdown", out); document.removeEventListener("keydown", esc); };
  }, [onClose, focar]);
  useEffect(() => {
    if (ativo !== undefined) ref.current?.querySelectorAll("button")[ativo]?.scrollIntoView({ block: "nearest" });
  }, [ativo]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(ref.current?.querySelectorAll("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };
  return (
    <div className="block-menu" role="menu" aria-label="Inserir bloco" ref={ref} onKeyDown={onKeyDown} style={style}>
      {itens.length ? itens.map((it, k) => (
        <button
          key={it.t} type="button" role="menuitem" className={k === ativo ? "on" : undefined}
          onMouseDown={keepSelection} onClick={() => onPick(it.t)}
        >
          <span className="bm-ic" aria-hidden="true">{it.icon}</span>
          <span><b>{it.nome}</b><small>{it.desc}</small></span>
        </button>
      )) : <p className="bm-vazio">Nenhum bloco com esse nome.</p>}
    </div>
  );
}

// Cabeçalho: alça de posição e largura do título (como antes) -------------------------------------

/** Largura (em %) para a posição x do ponteiro. Perto da largura padrão devolve null ("voltar ao padrão"). */
function larguraNoPonto(x: number, areaW: number, al: Alinhamento, left: number, padraoPx: number): number | null {
  const px = al === "center" ? 2 * Math.abs(x - areaW / 2) : al === "right" ? areaW - x : x - left;
  const pct = Math.max(W_MIN, Math.min(100, (px / areaW) * 100));
  const padrao = Math.min(100, (padraoPx / areaW) * 100);
  return Math.abs(pct - padrao) < 3 ? null : Math.round(pct / 5) * 5;
}

const nomeLargura = (w: number | null, padrao: string) => (w === null ? padrao : w === 100 ? "Largura total" : `${w}% da largura`);

function AlignGrip({ value, onChange, area, onDrag, label, className = "" }: {
  value: Alinhamento; onChange: (a: Alinhamento) => void; area: () => HTMLElement | null;
  onDrag?: (on: boolean) => void; label: string; className?: string;
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

function Guides({ al, style }: { al: Alinhamento; style: React.CSSProperties }) {
  return (
    <div className="al-guides" style={style} aria-hidden="true">
      {ALS.map((a) => <span key={a} className={a === al ? "on" : undefined}>{AL_NOME[a].replace(/^(à|no) /, "")}</span>)}
    </div>
  );
}

function Tb({ on, label, title, onClick, children, disabled }: {
  on?: boolean; label: string; title?: string; onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      className="tb" type="button" aria-pressed={on} aria-label={label} title={title ?? label} disabled={disabled}
      onMouseDown={keepSelection} onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Documento para abrir no editor: nunca vazio (o editor precisa de pelo menos um parágrafo). */
const paraEditor = (d: Doc): JSONContent => (d.content.length ? d : { type: "doc", content: [{ type: "paragraph" }] });

// Fixos, fora do componente: a barrinha flutuante se reconfigura (com uma transação) quando eles mudam.
const BOLHA = { placement: "top", offset: 10 } as const;
const mostrarBolha = ({ state, from, to }: { state: { selection: unknown }; from: number; to: number }) =>
  from !== to && !(state.selection instanceof NodeSelection);

type Lateral = { top: number; left: number; index: number };
type Barra = { q: string; faixa: Faixa; top: number; left: number };

/**
 * Editor de publicação. A página de edição é a própria publicação: o mesmo título, a mesma capa,
 * o mesmo texto e a mesma galeria da página do post. Escreve-se direto nela, como num editor de texto.
 * Sem `editarId`, é uma publicação nova (o rascunho fica no navegador); com ele, abre a publicação
 * do banco e salva por cima. Ao publicar, as fotos vão para o Storage e o post para o banco.
 */
export function Composer({ editarId }: { editarId?: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const editando = !!editarId;
  const [original, setOriginal] = useState<Post | null>(null);
  const [titulo, setTitulo] = useState("");
  const [tituloAl, setTituloAl] = useState<Alinhamento>("left");
  const [tituloW, setTituloW] = useState<number | null>(null);
  const [rotuloTitulo, setRotuloTitulo] = useState<string | null>(null);
  const [arrastoTitulo, setArrastoTitulo] = useState<{ top: number; h: number } | null>(null);
  const [frente, setFrente] = useState<FrenteKey>("educa");
  const [areas, setAreas] = useState<AreaKey[]>(["C"]);
  const [corpo, setCorpo] = useState<Doc>({ type: "doc", content: [] });
  const [fotos, setFotos] = useState<string[]>([]);
  const [seed, setSeed] = useState(13);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [salvo, setSalvo] = useState<"" | "salvo" | "cheio">("");
  const [pronto, setPronto] = useState(false);
  const [mudou, setMudou] = useState(false);
  const [menu, setMenu] = useState<null | { onde: "barra" | "fim" | "lado"; faixa?: Faixa }>(null);
  const [lateral, setLateral] = useState<Lateral | null>(null);
  const [opcoes, setOpcoes] = useState(false);
  const [barra, setBarra] = useState<Barra | null>(null);
  const [barraIdx, setBarraIdx] = useState(0);
  const [link, setLink] = useState<string | null>(null);
  // A data de hoje só é lida no navegador (no servidor a página é pré-renderizada uma vez só).
  const [hoje, setHoje] = useState("2026-01-01");
  const rootRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const imgPedido = useRef<{ tipo: "imagem" | "galeria"; faixa: Faixa } | null>(null);
  const barraFechada = useRef<string | null>(null);
  const ultimaBusca = useRef<string | null>(null);
  const publicado = useRef(false);
  // O editor é criado uma vez; o que ele chama passa por aqui para ver sempre o estado atual.
  const acoes = useRef<{ tecla: (e: KeyboardEvent) => boolean; arquivos: (f: File[], faixa?: Faixa) => void }>({
    tecla: () => false,
    arquivos: () => {},
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false, codeBlock: false, strike: false, underline: false,
        link: {
          openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: "https",
          isAllowedUri: (url) => !!linkSeguro(url),
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: null },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"] }),
      Highlight,
      Placeholder.configure({
        placeholder: ({ editor: ed, node }) => {
          if (node.type.name === "heading") return "Subtítulo";
          if (ed.isEmpty) return "Conte como foi o encontro: quem participou, o que foi feito, o que os estudantes descobriram.";
          return "Escreva, ou digite / para inserir um bloco";
        },
      }),
      Figura, Galeria, Video, Etapas, Destaque, SairDoBloco,
    ],
    editorProps: {
      attributes: { class: "prose post-body editor", "aria-label": "Texto da publicação", spellcheck: "true", lang: "pt-BR" },
      handleKeyDown: (_v, e) => acoes.current.tecla(e),
      handlePaste: (_v, e) => {
        const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (!files.length) return false;
        acoes.current.arquivos(files);
        return true;
      },
      handleDrop: (view, e, _slice, moved) => {
        const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (moved || !files.length) return false;
        const p = view.posAtCoords({ left: e.clientX, top: e.clientY });
        if (!p) return false;
        const $p = view.state.doc.resolve(p.pos);
        const pos = $p.depth ? $p.after(1) : p.pos;
        acoes.current.arquivos(files, { from: pos, to: pos });
        return true;
      },
      // O portal tem dois níveis de subtítulo: título 1 vira subtítulo, títulos 4 a 6 viram subtítulo menor.
      transformPastedHTML: (html) => html.replace(/<(\/?)h1\b/gi, "<$1h2").replace(/<(\/?)h[4-6]\b/gi, "<$1h3"),
    },
    onUpdate: ({ editor: ed }) => {
      setCorpo(ed.getJSON() as Doc);
      setMudou(true);
      setErro("");
    },
  });

  const st = useEditorState({
    editor,
    selector: ({ editor: ed }) => ed ? {
      estilo: ed.isActive("heading", { level: 2 }) ? "h2" : ed.isActive("heading", { level: 3 }) ? "h3" : "p",
      bold: ed.isActive("bold"), italic: ed.isActive("italic"), highlight: ed.isActive("highlight"), link: ed.isActive("link"),
      ul: ed.isActive("bulletList"), ol: ed.isActive("orderedList"), quote: ed.isActive("blockquote"), callout: ed.isActive("callout"),
      tom: (ed.getAttributes("callout").tom as Tom) ?? "nota",
      al: ed.isActive({ textAlign: "center" }) ? "center" : ed.isActive({ textAlign: "right" }) ? "right" : "left",
      undo: ed.can().undo(), redo: ed.can().redo(),
    } : null,
  });

  // Abre o rascunho salvo (publicação nova) ou a publicação do banco (edição).
  useEffect(() => {
    if (!editor) return;
    /* eslint-disable react-hooks/set-state-in-effect -- data, sorteio e rascunho só existem no navegador */
    setHoje(new Date().toLocaleDateString("sv-SE"));
    const abrir = (d: Doc) => {
      editor.commands.setContent(paraEditor(d), { emitUpdate: false });
      setCorpo(editor.getJSON() as Doc);
      setPronto(true);
    };
    if (editarId) {
      let vivo = true;
      void supabaseNavegador().from("posts").select(COLUNAS).eq("id", editarId).maybeSingle().then(({ data, error }) => {
        if (!vivo) return;
        if (error || !data) { setErro(error ? `Não foi possível abrir a publicação: ${error.message}` : "Essa publicação não existe mais."); return; }
        const p = rowToPost(data as Linha);
        setOriginal(p);
        setTitulo(p.titulo);
        setTituloAl(p.tituloAl ?? "left");
        setTituloW(p.tituloW ?? null);
        setFrente(p.frente);
        setAreas(p.areas);
        setSeed(p.seed);
        setFotos(p.imagens ?? []);
        abrir(p.corpo);
      });
      return () => { vivo = false; };
    }
    let d: Partial<Draft> | null = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch {}
    if (d && typeof d === "object") {
      if (typeof d.titulo === "string") setTitulo(d.titulo);
      if (isAlinhamento(d.tituloAl)) setTituloAl(d.tituloAl);
      if (validW(d.tituloW)) setTituloW(d.tituloW);
      if (typeof d.frente === "string" && isFrenteKey(d.frente)) setFrente(d.frente);
      if (Array.isArray(d.areas)) setAreas(d.areas.filter((k) => typeof k === "string" && isAreaKey(k)));
    }
    setSeed(typeof d?.seed === "number" ? d.seed : Math.floor(Math.random() * 1e6));
    abrir(limparDoc(d?.corpo));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [editor, editarId]);

  // Publicação nova: salva o rascunho meio segundo depois da última mudança.
  useEffect(() => {
    if (!pronto || editando) return;
    const vazio = !titulo.trim() && docVazio(limparDoc(corpo));
    const t = setTimeout(() => {
      if (publicado.current) return;
      try {
        if (vazio) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify({ titulo, tituloAl, tituloW, frente, areas, corpo, seed } satisfies Draft));
        setSalvo(vazio ? "" : "salvo");
      } catch {
        setSalvo("cheio");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [pronto, editando, titulo, tituloAl, tituloW, frente, areas, corpo, seed]);

  // Edição: avisa antes de sair com mudanças não salvas.
  useEffect(() => {
    if (!editando || !mudou) return;
    const aviso = (e: BeforeUnloadEvent) => { if (!publicado.current) e.preventDefault(); };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [editando, mudou]);

  // A barra de ferramentas gruda logo abaixo do cabeçalho do site, qualquer que seja a altura dele.
  useEffect(() => {
    const top = document.querySelector<HTMLElement>(".top");
    const root = rootRef.current;
    if (!top || !root) return;
    const ro = new ResizeObserver(() => root.style.setProperty("--bar-top", `${top.offsetHeight}px`));
    ro.observe(top);
    return () => ro.disconnect();
  }, []);

  // O título cresce com o texto, como um título de verdade.
  useEffect(() => {
    const t = titleRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  }, [titulo, tituloAl, tituloW]);

  // Menu do "/": aparece quando um parágrafo só tem a barra e o que se digita depois dela.
  useEffect(() => {
    if (!editor) return;
    const ver = () => {
      const { selection } = editor.state;
      const { $from, empty } = selection;
      const txt = $from.depth === 1 ? $from.parent.textContent : "";
      const ok = empty && $from.parent.type.name === "paragraph" && /^\/[\p{L}\s]{0,24}$/u.test(txt) && $from.parentOffset === txt.length;
      if (!ok || barraFechada.current === txt) {
        if (!ok) barraFechada.current = null;
        setBarra(null);
        return;
      }
      const wrap = wrapRef.current!.getBoundingClientRect();
      const c = editor.view.coordsAtPos($from.start());
      const nova = { q: txt.slice(1), faixa: { from: $from.before(1), to: $from.after(1) }, top: c.bottom - wrap.top + 6, left: c.left - wrap.left };
      // Só muda o estado quando algo mudou: outras partes do editor também disparam transações a cada desenho.
      setBarra((b) => (b && b.q === nova.q && b.faixa.from === nova.faixa.from && b.faixa.to === nova.faixa.to && b.top === nova.top && b.left === nova.left ? b : nova));
      if (nova.q !== ultimaBusca.current) { ultimaBusca.current = nova.q; setBarraIdx(0); }
    };
    editor.on("transaction", ver);
    return () => { editor.off("transaction", ver); };
  }, [editor]);

  const etapas = frente === "experimenta";
  const itens = ITENS.filter((i) => etapas || i.t !== "etapas");
  const itensBarra = barra ? itens.filter((i) => semAcento(`${i.nome} ${i.busca}`).includes(semAcento(barra.q.trim()))) : [];

  /**
   * Põe blocos especiais (imagem, vídeo, divisória…) em `f` e garante um parágrafo logo depois, para
   * continuar escrevendo. Com `cursor`, o cursor vai para esse parágrafo (o vídeo prefere o campo do link).
   */
  const porBlocos = (f: Faixa, json: JSONContent | JSONContent[], cursor = true) => {
    if (!editor) return;
    editor.chain().focus().insertContentAt(f, json).run();
    let pos = f.from;
    for (let i = 0; i < (Array.isArray(json) ? json.length : 1); i++) pos += editor.state.doc.nodeAt(pos)?.nodeSize ?? 0;
    if (editor.state.doc.nodeAt(pos)?.type.name !== "paragraph") editor.commands.insertContentAt(pos, { type: "paragraph" });
    if (cursor) editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  };

  /** Põe um bloco em `faixa` (ou onde está o cursor). Imagens e galerias abrem o seletor de fotos antes. */
  const inserir = (t: Tipo, faixa?: Faixa) => {
    if (!editor) return;
    setMenu(null);
    const f = faixa ?? alvoDe(editor);
    if (t === "imagem" || t === "galeria") {
      imgPedido.current = { tipo: t, faixa: f };
      imgInputRef.current?.click();
      return;
    }
    const novo = NOVO[t];
    if (novo) {
      const [json, dentro] = novo;
      editor.chain().focus().insertContentAt(f, json).setTextSelection(f.from + dentro).run();
      return;
    }
    const json: JSONContent = t === "video" ? { type: "video", attrs: { id: null, legenda: "" } }
      : t === "divisoria" ? { type: "horizontalRule" } : { type: "etapas" };
    porBlocos(f, json, t !== "video");
  };

  const inserirFotos = async (files: File[], faixa?: Faixa, tipo?: "imagem" | "galeria") => {
    if (!editor) return;
    const urls = await arquivosParaImagens(files);
    if (!urls.length) { setErro("Não foi possível abrir essa imagem."); return; }
    const f = faixa ?? alvoDe(editor);
    // Uma foto vira imagem; várias viram galeria (a não ser que se tenha pedido imagem).
    const json: JSONContent | JSONContent[] = urls.length > 1 && tipo !== "imagem"
      ? { type: "galeria", attrs: { fotos: urls.slice(0, 12).map((src) => ({ src, legenda: "" })) } }
      : urls.map((src) => ({ type: "figura", attrs: { src, legenda: "", w: 80, pos: "centro" } }));
    porBlocos(f, json);
  };

  const escolherBarra = (t: Tipo) => {
    if (!barra || !editor) return;
    setBarra(null);
    // O bloco novo entra no lugar do parágrafo do "/".
    inserir(t, barra.faixa);
  };

  const teclaBarra = (e: KeyboardEvent) => {
    if (!barra) return false;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const n = itensBarra.length || 1;
        setBarraIdx((i) => (i + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
        return true;
      }
      if (e.key === "Enter" && itensBarra[barraIdx]) { escolherBarra(itensBarra[barraIdx].t); return true; }
      if (e.key === "Escape") { barraFechada.current = `/${barra.q}`; setBarra(null); return true; }
      return false;
  };
  useEffect(() => {
    acoes.current = { tecla: teclaBarra, arquivos: (files, faixa) => { void inserirFotos(files, faixa); } };
  });

  // Ferramentas na margem: o bloco sob o mouse ganha um + e um menu (mover, apagar).
  const blocoDom = (alvo: EventTarget | null): HTMLElement | null => {
    const raiz = editor?.view.dom;
    let n = alvo as Node | null;
    while (n && raiz && n.parentNode !== raiz) n = n.parentNode;
    return n instanceof HTMLElement ? n : null;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!editor || opcoes || menu) return;
    const el = blocoDom(e.target);
    if (!el) return;
    let index = -1;
    editor.state.doc.forEach((_n, off, i) => { if (editor.view.nodeDOM(off) === el) index = i; });
    if (index < 0) return;
    // Blocos especiais ficam num envoltório sem caixa própria (display: contents); mede o de dentro.
    const caixa = (el.getBoundingClientRect().height ? el : el.firstElementChild ?? el).getBoundingClientRect();
    const wrap = wrapRef.current!.getBoundingClientRect();
    const top = caixa.top - wrap.top;
    const left = caixa.left - wrap.left;
    setLateral((l) => (l && l.index === index && l.top === top && l.left === left ? l : { top, left, index }));
  };

  const posDoBloco = (index: number) => {
    let pos = -1;
    editor?.state.doc.forEach((_n, off, i) => { if (i === index) pos = off; });
    return pos;
  };

  const mover = (index: number, d: -1 | 1) => {
    if (!editor) return;
    const doc = editor.state.doc;
    const j = index + d;
    if (j < 0 || j >= doc.childCount) return;
    const from = posDoBloco(index);
    const no = doc.child(index);
    const vizinho = doc.child(j);
    const tr = editor.state.tr.delete(from, from + no.nodeSize);
    const destino = d < 0 ? from - vizinho.nodeSize : from + vizinho.nodeSize;
    tr.insert(destino, no);
    editor.view.dispatch(tr.scrollIntoView());
    setOpcoes(false);
    setLateral(null);
  };

  const apagarBloco = (index: number) => {
    if (!editor) return;
    const from = posDoBloco(index);
    editor.chain().focus().deleteRange({ from, to: from + editor.state.doc.child(index).nodeSize }).run();
    setOpcoes(false);
    setLateral(null);
  };

  const depoisDoBloco = (index: number): Faixa => {
    const from = posDoBloco(index);
    const no = editor!.state.doc.child(index);
    if (no.type.name === "paragraph" && no.content.size === 0) return { from, to: from + no.nodeSize };
    return { from: from + no.nodeSize, to: from + no.nodeSize };
  };

  // Barra de ferramentas ---------------------------------------------------------------------------

  const estilo = (v: string) => {
    if (!editor) return;
    const c = editor.chain().focus();
    if (v === "p") c.setParagraph().run();
    else c.setHeading({ level: v === "h3" ? 3 : 2 }).run();
  };

  const abrirLink = () => {
    if (!editor) return;
    if (editor.state.selection.empty) {
      if (!editor.isActive("link")) { setErro("Selecione o texto que vai virar link."); return; }
      editor.chain().focus().extendMarkRange("link").run();
    }
    setLink((editor.getAttributes("link").href as string) ?? "");
  };

  const aplicarLink = () => {
    if (!editor || link === null) return;
    const c = editor.chain().focus().extendMarkRange("link");
    if (!link.trim()) c.unsetLink().run();
    else {
      const href = normalizarLink(link);
      if (!href) { setErro("Esse endereço não parece um link da internet ou um e-mail."); return; }
      c.setLink({ href }).run();
    }
    setLink(null);
  };

  const destaque = () => {
    if (!editor) return;
    if (editor.isActive("callout")) editor.chain().focus().lift("callout").run();
    else editor.chain().focus().wrapIn("callout").run();
  };

  const addFotos = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length) { setFotos((prev) => [...prev, ...imgs.map((f) => URL.createObjectURL(f))]); setMudou(true); }
  };

  const removeFoto = (url: string) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    setFotos((prev) => prev.filter((u) => u !== url));
    setMudou(true);
  };

  // Cabeçalho ---------------------------------------------------------------------------------------

  const startResizeTitulo = (e: React.PointerEvent<HTMLButtonElement>) => {
    const art = articleRef.current;
    const head = headRef.current;
    if (!art || !head || e.button !== 0) return;
    e.preventDefault();
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    const r = art.getBoundingClientRect();
    // O cabeçalho começa alinhado à coluna de texto, não na borda do post.
    const inicio = head.getBoundingClientRect().left - r.left;
    setRotuloTitulo(nomeLargura(tituloW, "Largura padrão"));
    const move = (ev: PointerEvent) => {
      const w = larguraNoPonto(ev.clientX - r.left, r.width, tituloAl, inicio, HEAD_PX);
      setTituloW(w);
      setRotuloTitulo(nomeLargura(w, "Largura padrão"));
    };
    const up = () => {
      btn.removeEventListener("pointermove", move);
      btn.removeEventListener("pointerup", up);
      btn.removeEventListener("pointercancel", up);
      setRotuloTitulo(null);
    };
    btn.addEventListener("pointermove", move);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
  };

  const onResizeTituloKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0;
    const art = articleRef.current;
    const head = headRef.current;
    if (!d || !art || !head) return;
    e.preventDefault();
    const atual = tituloW ?? Math.round((head.offsetWidth / art.clientWidth) * 100);
    setTituloW(Math.max(W_MIN, Math.min(100, Math.round((atual + d) / 5) * 5)));
  };

  const toggleArea = (k: AreaKey) => {
    setAreas((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : AREAS.map((a) => a.k).filter((x) => x === k || prev.includes(x))));
    setMudou(true);
  };

  // Publicar ----------------------------------------------------------------------------------------

  const limpo = limparDoc(corpo);
  const draft: Post = {
    id: original?.id ?? "rascunho", frente, areas, autor: original?.autor ?? "equipe", data: original?.data ?? hoje, fotos: fotos.length, seed,
    titulo: titulo.trim(), tituloAl: tituloAl === "left" ? undefined : tituloAl, tituloW: tituloW ?? undefined,
    resumo: resumoDoDoc(limpo) || "O começo do texto aparece aqui.", corpo: limpo, imagens: fotos,
  };

  const publicar = async () => {
    if (enviando || !editor) return;
    const corpoLimpo = limparDoc(editor.getJSON());
    if (!draft.titulo) { setErro("Falta o título da publicação."); titleRef.current?.focus(); return; }
    if (docVazio(corpoLimpo)) { setErro("Falta o texto da publicação."); editor.commands.focus(); return; }
    if (!areas.length) { setErro("Escolha pelo menos uma área (as letras ao lado da data)."); return; }
    if (editor.state.doc.content.content.some((n) => n.type.name === "video" && !n.attrs.id)) {
      setErro("Falta colar o link do vídeo (ou remover o bloco de vídeo).");
      return;
    }
    setErro("");
    setEnviando(true);
    const sb = supabaseNavegador();
    const enviados: string[] = [];
    let pronto: { token: string; id: string };
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error("sessao");
      const id = original?.id ?? `${slug(draft.titulo) || "publicacao"}-${carimbo()}`;
      // Nome novo a cada envio: na edição, os arquivos antigos continuam lá até o post ser salvo.
      const marca = carimbo();
      const subir = async (src: string, nome: string) => {
        const caminho = `${id}/${nome}-${marca}.jpg`;
        const url = await enviarImagem(sb, caminho, src);
        enviados.push(caminho);
        return url;
      };
      const local = (u: string) => u.startsWith("blob:") || u.startsWith("data:");
      const imagens = await Promise.all(fotos.map((u, k) => (local(u) ? subir(u, `foto-${k + 1}`) : u)));
      let n = 0;
      const corpoFinal = await trocarImagens(corpoLimpo, async (src) => (local(src) ? subir(src, `texto-${++n}`) : src));
      const linha = postToRow({ ...draft, id, corpo: corpoFinal, imagens, resumo: resumoDoDoc(corpoFinal) });
      if (original) {
        const { data, error } = await sb.from("posts").update(linha).eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("permission");
        // Fotos que saíram da publicação: apaga do Storage.
        const agora = new Set([...imagens, ...imagensDoDoc(corpoFinal)]);
        const sobra = [...(original.imagens ?? []), ...imagensDoDoc(original.corpo)]
          .filter((u) => !agora.has(u)).map(caminhoNoStorage).filter((c): c is string => !!c && c.startsWith(`${id}/`));
        if (sobra.length) await sb.storage.from(BUCKET).remove(sobra).catch(() => {});
      } else {
        const { error } = await sb.from("posts").insert(linha);
        if (error) throw error;
      }
      pronto = { token: session.access_token, id };
    } catch (e) {
      if (enviados.length) await sb.storage.from(BUCKET).remove(enviados).catch(() => {});
      const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
      setErro(
        msg === "sessao" ? `Sua sessão terminou. Recarregue a página e entre de novo${editando ? "" : " (o rascunho continua salvo)"}.`
        : /row-level security|permission|unauthorized|jwt/i.test(msg) ? "Sua conta não tem permissão para publicar."
        : /fetch|network/i.test(msg) ? "Sem conexão com o servidor. Confira a internet e tente de novo."
        : `Não foi possível ${editando ? "salvar" : "publicar"}: ${msg}`,
      );
      setEnviando(false);
      return;
    }
    publicado.current = true;
    if (!editando) try { localStorage.removeItem(DRAFT_KEY); } catch {}
    toast(editando ? "Alterações salvas" : "Publicação publicada");
    // Fora do try: o servidor renova o cache e redireciona para o post (o redirecionamento chega
    // aqui como uma exceção que o Next trata). Se a sessão não for aceita, abre o post do mesmo jeito.
    const destino = `/publicacoes/${pronto.id}`;
    if ((await postsMudaram(pronto.token, destino)) === false) router.push(destino);
  };

  const descartar = () => {
    if (editando) {
      if (mudou && !confirm("Sair sem salvar? As mudanças feitas aqui serão perdidas.")) return;
      publicado.current = true;
      router.push(`/publicacoes/${editarId}`);
      return;
    }
    if (!confirm("Apagar este rascunho? O que foi escrito será perdido.")) return;
    setTitulo("");
    setTituloAl("left");
    setTituloW(null);
    setAreas(["C"]);
    fotos.forEach((u) => URL.revokeObjectURL(u));
    setFotos([]);
    editor?.commands.setContent(paraEditor({ type: "doc", content: [] }));
    setErro("");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setSalvo("");
  };

  const F = FRENTES[frente];
  const temAlgo = !!titulo.trim() || !docVazio(limpo) || fotos.length > 0;
  const cover = fotos[0] ? (
    // eslint-disable-next-line @next/next/no-img-element -- fotos locais (blob:) ou do Storage
    <img src={fotos[0]} alt="" />
  ) : (
    <CrystalArt seed={seed} color={F.c} w={840} h={320} />
  );
  const fecharMenu = () => setMenu(null);
  const carregando = editando && !original && !erro;

  return (
    <div className="composer" ref={rootRef} style={{ "--fc": F.c } as React.CSSProperties}>
      <div className="editor-bar" role="toolbar" aria-label="Ferramentas do texto">
        <div className="tb-tools">
          <div className="tb-group">
            <label className="tb tb-select" title="Estilo do parágrafo">
              <span className="sr-only">Estilo do parágrafo</span>
              <select value={st?.estilo ?? "p"} onChange={(e) => estilo(e.target.value)} onMouseDown={(e) => e.stopPropagation()}>
                <option value="p">Texto</option>
                <option value="h2">Subtítulo</option>
                <option value="h3">Subtítulo menor</option>
              </select>
            </label>
          </div>
          <span className="tb-sep" />
          <div className="tb-group">
            <Tb on={st?.bold} label="Negrito" title="Negrito (Ctrl+B)" onClick={() => editor?.chain().focus().toggleBold().run()}><b>N</b></Tb>
            <Tb on={st?.italic} label="Itálico" title="Itálico (Ctrl+I)" onClick={() => editor?.chain().focus().toggleItalic().run()}><i className="tb-i">I</i></Tb>
            <Tb on={st?.highlight} label="Marca-texto" onClick={() => editor?.chain().focus().toggleHighlight().run()}><HighlightIcon /></Tb>
            <Tb on={st?.link} label="Link" title="Link (selecione o texto)" onClick={abrirLink}><LinkIcon /></Tb>
          </div>
          <span className="tb-sep" />
          <div className="tb-group">
            <Tb on={st?.ul} label="Lista" onClick={() => editor?.chain().focus().toggleBulletList().run()}><ListIcon /></Tb>
            <Tb on={st?.ol} label="Lista numerada" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><OrderedListIcon /></Tb>
            <Tb on={st?.quote} label="Citação" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><QuoteIcon /></Tb>
            <Tb on={st?.callout} label="Caixa de destaque" onClick={destaque}><CalloutIcon /></Tb>
            {st?.callout && (
              <label className="tb tb-select tb-tom" title="Tipo do destaque">
                <span className="sr-only">Tipo do destaque</span>
                <select value={st.tom} onChange={(e) => editor?.chain().focus().updateAttributes("callout", { tom: e.target.value }).run()}>
                  {(Object.keys(TOM_NOME) as Tom[]).map((t) => <option key={t} value={t}>{TOM_NOME[t]}</option>)}
                </select>
              </label>
            )}
          </div>
          <span className="tb-sep" />
          <div className="tb-group">
            {ALS.map((a) => (
              <Tb key={a} on={st?.al === a} label={`Alinhar ${AL_NOME[a]}`} onClick={() => editor?.chain().focus().setTextAlign(a).run()}>
                <AlignIcon al={a} />
              </Tb>
            ))}
          </div>
          <span className="tb-sep" />
          <div className="tb-group tb-insert">
            <button
              className="tb" type="button" aria-haspopup="menu" aria-expanded={menu?.onde === "barra"} onMouseDown={keepSelection}
              onClick={() => setMenu(menu?.onde === "barra" ? null : { onde: "barra" })}
            >
              <span aria-hidden="true" className="tb-plus">+</span><span className="tb-label">Inserir</span>
            </button>
            {menu?.onde === "barra" && <BlockMenu itens={itens} onPick={(t) => inserir(t)} onClose={fecharMenu} />}
          </div>
          <span className="tb-sep" />
          <div className="tb-group">
            <Tb label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!st?.undo} onClick={() => editor?.chain().focus().undo().run()}><UndoIcon /></Tb>
            <Tb label="Refazer" title="Refazer (Ctrl+Y)" disabled={!st?.redo} onClick={() => editor?.chain().focus().redo().run()}><RedoIcon /></Tb>
          </div>
        </div>
        <div className="tb-end">
          <span className="save-state" aria-live="polite">
            {editando ? (mudou ? "Alterações não salvas" : "") : salvo === "salvo" ? "Rascunho salvo" : salvo === "cheio" ? "Rascunho grande demais para salvar" : ""}
          </span>
          {(editando || temAlgo) && <button className="tb" type="button" onClick={descartar}>{editando ? "Cancelar" : "Descartar"}</button>}
          <button className="btn primary small" type="button" onClick={publicar} disabled={enviando || carregando}>
            {enviando ? (editando ? "Salvando…" : "Publicando…") : editando ? "Salvar" : "Publicar"}
          </button>
        </div>
      </div>
      <p className="form-error compose-error" role="alert">{erro}</p>
      {carregando && <p className="help">Abrindo a publicação…</p>}

      <article className="post-full editing" ref={articleRef} hidden={carregando}>
        {arrastoTitulo && <Guides al={tituloAl} style={{ top: arrastoTitulo.top, height: arrastoTitulo.h }} />}
        <div
          ref={headRef} className={tituloAl === "left" ? "post-head" : `post-head al-${tituloAl}`}
          {...(tituloW !== null ? { "data-w": String(tituloW), style: { width: `${tituloW}%`, "--w": `${tituloW}%` } as React.CSSProperties } : null)}
        >
          <button
            type="button" className={`resize-h title-resize${rotuloTitulo ? " on" : ""}`}
            title="Arraste para mudar a largura do título (dois cliques voltam à largura padrão)"
            aria-label={`Largura do título: ${nomeLargura(tituloW, "largura padrão")}. Arraste ou use as setas.`}
            onPointerDown={startResizeTitulo} onKeyDown={onResizeTituloKey} onDoubleClick={() => setTituloW(null)}
          />
          {rotuloTitulo && <span className="resize-label title-resize-label">{rotuloTitulo}</span>}
          <label className="fr fr-edit" style={{ "--fc": F.c } as React.CSSProperties}>
            <span className="sr-only">Frente</span>
            <select value={frente} onChange={(e) => { setFrente(e.target.value as FrenteKey); setMudou(true); }}>
              {Object.entries(FRENTES).map(([k, f]) => <option key={k} value={k}>{f.full}</option>)}
            </select>
          </label>
          <div className="title-row">
            <textarea
              ref={titleRef} className="title-input" rows={1} maxLength={120} aria-label="Título"
              placeholder="Título da publicação" value={titulo}
              onChange={(e) => { setTitulo(e.target.value.replace(/\s*\n\s*/g, " ")); setErro(""); setMudou(true); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus("start"); } }}
            />
            <AlignGrip
              className={`title-grip${tituloW !== null && tituloW >= 90 ? " above" : ""}`} label="Posição do título" value={tituloAl}
              onChange={(a) => { setTituloAl(a); setMudou(true); }} area={() => articleRef.current}
              onDrag={(on) => { const h = headRef.current; setArrastoTitulo(on && h ? { top: h.offsetTop, h: h.offsetHeight } : null); }}
            />
          </div>
          <div className="meta">
            <Author autor={original?.autor ?? "equipe"} withRole />
            <time dateTime={draft.data}>{fmtDate(draft.data)}</time>
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
          <label className="btn small cover-btn">
            <PhotoIcon />{fotos.length ? "Mais fotos" : "Fotos da capa e da galeria"}
            <input className="file-hidden" type="file" accept="image/*" multiple onChange={(e) => { addFotos([...(e.target.files ?? [])]); e.target.value = ""; }} />
          </label>
        </div>

        <div className="editor-wrap" ref={wrapRef} onMouseMove={onMouseMove} onMouseLeave={() => { if (!opcoes) setLateral(null); }}>
          <EditorContent editor={editor} />
          {editor && (
            <BubbleMenu
              editor={editor} className="bubble" options={BOLHA} shouldShow={mostrarBolha}
            >
              {link === null ? (
                <>
                  <button type="button" onMouseDown={keepSelection} aria-pressed={st?.bold} aria-label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}><b>N</b></button>
                  <button type="button" onMouseDown={keepSelection} aria-pressed={st?.italic} aria-label="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()}><i className="tb-i">I</i></button>
                  <button type="button" onMouseDown={keepSelection} aria-pressed={st?.highlight} aria-label="Marca-texto" onClick={() => editor.chain().focus().toggleHighlight().run()}><HighlightIcon size={18} /></button>
                  <button type="button" onMouseDown={keepSelection} aria-pressed={st?.link} aria-label="Link" onClick={abrirLink}><LinkIcon size={18} /><span>Link</span></button>
                </>
              ) : (
                <form className="bubble-link" onSubmit={(e) => { e.preventDefault(); aplicarLink(); }}>
                  <input
                    autoFocus type="text" inputMode="url" placeholder="Cole o link ou um e-mail" aria-label="Endereço do link" value={link}
                    onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setLink(null); editor.commands.focus(); } }}
                  />
                  <button type="submit">Pronto</button>
                  {st?.link && <button type="button" onClick={() => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); setLink(null); }}>Tirar</button>}
                </form>
              )}
            </BubbleMenu>
          )}
          {lateral && lateral.left >= 92 && (
            <div className={`side-tools${opcoes || menu?.onde === "lado" ? " open" : ""}`} style={{ top: lateral.top, left: lateral.left - 84 }}>
              <button
                type="button" className="bt-add" aria-label="Inserir bloco depois deste" title="Inserir bloco" aria-haspopup="menu"
                aria-expanded={menu?.onde === "lado"} onMouseDown={keepSelection}
                onClick={() => { setOpcoes(false); setMenu(menu?.onde === "lado" ? null : { onde: "lado", faixa: depoisDoBloco(lateral.index) }); }}
              >
                +
              </button>
              <button
                type="button" className="bt-add" aria-label="Opções do bloco" title="Mover ou apagar" aria-haspopup="menu" aria-expanded={opcoes}
                onMouseDown={keepSelection} onClick={() => { setMenu(null); setOpcoes((o) => !o); }}
              >
                <DotsIcon />
              </button>
              {menu?.onde === "lado" && <BlockMenu itens={itens} onPick={(t) => inserir(t, menu.faixa)} onClose={fecharMenu} />}
              {opcoes && (
                <div className="block-menu bm-curto" role="menu" aria-label="Opções do bloco">
                  <button type="button" role="menuitem" disabled={lateral.index === 0} onClick={() => mover(lateral.index, -1)}><span className="bm-ic"><ArrowIcon dir="up" /></span><b>Mover para cima</b></button>
                  <button type="button" role="menuitem" disabled={!editor || lateral.index >= editor.state.doc.childCount - 1} onClick={() => mover(lateral.index, 1)}><span className="bm-ic"><ArrowIcon dir="down" /></span><b>Mover para baixo</b></button>
                  <button type="button" role="menuitem" onClick={() => apagarBloco(lateral.index)}><span className="bm-ic"><TrashIcon /></span><b>Apagar</b></button>
                </div>
              )}
            </div>
          )}
          {barra && (
            <BlockMenu
              itens={itensBarra} ativo={barraIdx} focar={false} onPick={escolherBarra}
              onClose={() => { barraFechada.current = `/${barra.q}`; setBarra(null); }}
              style={{ top: barra.top, left: Math.max(0, barra.left) }}
            />
          )}
          <div className="add-block">
            <button
              type="button" className="add-btn" aria-haspopup="menu" aria-expanded={menu?.onde === "fim"} onMouseDown={keepSelection}
              onClick={() => {
                if (!editor) return;
                const fim = editor.state.doc.content.size;
                const ultimo = editor.state.doc.lastChild;
                const faixa = ultimo?.type.name === "paragraph" && !ultimo.content.size ? { from: fim - ultimo.nodeSize, to: fim } : { from: fim, to: fim };
                setMenu(menu?.onde === "fim" ? null : { onde: "fim", faixa });
              }}
            >
              <span aria-hidden="true">+</span> Inserir bloco
            </button>
            <span className="add-dica">ou digite <kbd>/</kbd> numa linha vazia</span>
            {menu?.onde === "fim" && <BlockMenu itens={itens} onPick={(t) => inserir(t, menu.faixa)} onClose={fecharMenu} />}
          </div>
          <input
            ref={imgInputRef} className="file-hidden" type="file" accept="image/*" multiple tabIndex={-1} aria-hidden="true"
            onChange={(e) => {
              const p = imgPedido.current;
              void inserirFotos([...(e.target.files ?? [])], p?.faixa, p?.tipo);
              e.target.value = "";
            }}
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
              <label className="add-tile">
                <PhotoIcon size={26} />Adicionar
                <input className="file-hidden" type="file" accept="image/*" multiple onChange={(e) => { addFotos([...(e.target.files ?? [])]); e.target.value = ""; }} />
              </label>
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
