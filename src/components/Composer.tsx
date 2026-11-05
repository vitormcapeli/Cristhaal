"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AREAS, FRENTES, fmtDate, isAreaKey, isFrenteKey, type AreaKey, type Bloco, type FrenteKey, type Post } from "@/lib/data";
import { blocksToHtml, inlineHtml, serialize, STEPS_HTML } from "@/lib/editor";
import { addLocalPost } from "@/lib/localPosts";
import { plainText } from "@/lib/rich";
import { CrystalArt } from "./CrystalArt";
import { ListIcon, PhotoIcon, RedoIcon, StepsIcon, UndoIcon } from "./Icons";
import { Author, PostRow } from "./PostRow";
import { useToast } from "./Toast";

const DRAFT_KEY = "cristhaal-rascunho";
const EMPTY_HTML = "<p><br></p>";

type Draft = { titulo: string; frente: FrenteKey; areas: AreaKey[]; corpo: Bloco[]; seed: number };
type Fmt = { bold: boolean; italic: boolean; list: boolean; h: boolean };
const NO_FMT: Fmt = { bold: false, italic: false, list: false, h: false };

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

/** Mantém a seleção no texto quando se clica num botão da barra. */
const keepSelection = (e: React.MouseEvent) => e.preventDefault();

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
 * Editor de publicação. A página de edição é a própria publicação: o mesmo título, a mesma capa,
 * o mesmo texto e a mesma galeria da página do post. Escreve-se direto nela, como num editor de texto.
 * Por enquanto salva só no navegador (rascunho e publicação).
 */
export function Composer() {
  const router = useRouter();
  const toast = useToast();
  const [titulo, setTitulo] = useState("");
  const [frente, setFrente] = useState<FrenteKey>("educa");
  const [areas, setAreas] = useState<AreaKey[]>(["C"]);
  const [corpo, setCorpo] = useState<Bloco[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [seed, setSeed] = useState(13);
  const [fmt, setFmt] = useState<Fmt>(NO_FMT);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [pronto, setPronto] = useState(false);
  // A data de hoje só é lida no navegador (no servidor a página é pré-renderizada uma vez só).
  const [hoje, setHoje] = useState("2026-01-01");
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
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
      if (typeof d.frente === "string" && isFrenteKey(d.frente)) setFrente(d.frente);
      if (Array.isArray(d.areas)) setAreas(d.areas.filter((k) => typeof k === "string" && isAreaKey(k)));
      if (typeof d.seed === "number") setSeed(d.seed);
      else setSeed(Math.floor(Math.random() * 1e6));
    } else {
      setSeed(Math.floor(Math.random() * 1e6));
    }
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
        else localStorage.setItem(DRAFT_KEY, JSON.stringify({ titulo, frente, areas, corpo, seed } satisfies Draft));
        setSalvo(!vazio);
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [pronto, titulo, frente, areas, corpo, seed]);

  // A barra de ferramentas gruda logo abaixo do cabeçalho do site, qualquer que seja a altura dele.
  useEffect(() => {
    const top = document.querySelector<HTMLElement>(".top");
    const root = rootRef.current;
    if (!top || !root) return;
    const ro = new ResizeObserver(() => root.style.setProperty("--bar-top", `${top.offsetHeight}px`));
    ro.observe(top);
    return () => ro.disconnect();
  }, []);

  // Acende os botões conforme o que está sob o cursor (negrito, subtítulo...).
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
  }, [titulo]);

  const sync = () => {
    if (editorRef.current) setCorpo(serialize(editorRef.current));
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

  const run = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
    sync();
  };

  const insertSteps = () => {
    focusEditor();
    const ed = editorRef.current!;
    const sel = getSelection();
    let block: Node | null = sel?.anchorNode ?? null;
    while (block && block.parentNode !== ed) block = block.parentNode;
    const tpl = document.createElement("template");
    tpl.innerHTML = STEPS_HTML + EMPTY_HTML;
    const after = tpl.content.lastChild!;
    const vazio = block instanceof HTMLElement && block.tagName === "P" && !block.textContent?.trim();
    ed.insertBefore(tpl.content, block ? block.nextSibling : null);
    if (vazio) (block as HTMLElement).remove();
    const r = document.createRange();
    r.setStart(after, 0);
    r.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(r);
    sync();
  };

  const addFiles = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length) setFotos((prev) => [...prev, ...imgs.map((f) => URL.createObjectURL(f))]);
  };

  const removeFoto = (url: string) => {
    URL.revokeObjectURL(url);
    setFotos((prev) => prev.filter((u) => u !== url));
  };

  // Colar: mantém só o que o portal mostra (parágrafos, subtítulos, listas, negrito e itálico).
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const files = [...e.clipboardData.files];
    if (files.length) { addFiles(files); return; }
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles([...e.dataTransfer.files]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Sublinhado não existe no portal; sem o atalho, o que se vê continua igual ao publicado.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") e.preventDefault();
  };

  const onEditorClick = (e: React.MouseEvent) => {
    const x = (e.target as HTMLElement).closest("[data-remove]");
    if (!x) return;
    x.closest("[data-steps]")?.remove();
    sync();
  };

  const toggleArea = (k: AreaKey) =>
    setAreas((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : AREAS.map((a) => a.k).filter((x) => x === k || prev.includes(x))));

  const primeiro = corpo.find((b): b is { p: string } => "p" in b);
  const draft: Post = {
    id: "rascunho", frente, areas, autor: "equipe", data: hoje, fotos: fotos.length, seed,
    titulo: titulo.trim(), resumo: primeiro ? plainText(primeiro.p).slice(0, 180) : "O começo do texto aparece aqui.",
    corpo, imagens: fotos,
  };

  const publicar = () => {
    if (!draft.titulo) { setErro("Falta o título da publicação."); titleRef.current?.focus(); return; }
    if (!corpo.length) { setErro("Falta o texto da publicação."); focusEditor(); return; }
    if (!areas.length) { setErro("Escolha pelo menos uma área (as letras ao lado da data)."); return; }
    publicado.current = true;
    const id = `${slug(draft.titulo) || "publicacao"}-${Date.now().toString(36)}`;
    addLocalPost({ ...draft, id, imagens: undefined }, fotos);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    toast("Publicação publicada");
    router.push(`/publicacoes/${id}`);
  };

  const descartar = () => {
    if (!confirm("Apagar este rascunho? O que foi escrito será perdido.")) return;
    setTitulo("");
    setAreas(["C"]);
    fotos.forEach((u) => URL.revokeObjectURL(u));
    setFotos([]);
    editorRef.current!.innerHTML = EMPTY_HTML;
    setCorpo([]);
    setErro("");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setSalvo(false);
  };

  const F = FRENTES[frente];
  const temAlgo = !!titulo.trim() || corpo.length > 0 || fotos.length > 0;
  const cover = fotos[0] ? (
    // eslint-disable-next-line @next/next/no-img-element -- fotos locais (blob:)
    <img src={fotos[0]} alt="" />
  ) : (
    <CrystalArt seed={seed} color={F.c} w={840} h={320} />
  );

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
          {frente === "experimenta" && (
            <button className="tb" type="button" title="Inserir as 4 etapas do experimento" onMouseDown={keepSelection} onClick={insertSteps}><StepsIcon /><span className="tb-label">Etapas</span></button>
          )}
        </div>
        <span className="tb-sep" />
        <div className="tb-group">
          <PhotoPicker className="tb" onFiles={addFiles} title="Adicionar fotos"><PhotoIcon /><span className="tb-label">Fotos</span></PhotoPicker>
        </div>
        <span className="tb-sep" />
        <div className="tb-group">
          <button className="tb" type="button" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" onMouseDown={keepSelection} onClick={() => run("undo")}><UndoIcon /></button>
          <button className="tb" type="button" aria-label="Refazer" title="Refazer (Ctrl+Y)" onMouseDown={keepSelection} onClick={() => run("redo")}><RedoIcon /></button>
        </div>
        <div className="tb-end">
          <span className="save-state" aria-live="polite">{salvo ? "Rascunho salvo" : ""}</span>
          {temAlgo && <button className="tb" type="button" onClick={descartar}>Descartar</button>}
          <button className="btn primary small" type="button" onClick={publicar}>Publicar</button>
        </div>
      </div>
      <p className="form-error compose-error" role="alert">{erro}</p>

      <article className="post-full editing">
        <div className="post-head">
          <label className="fr fr-edit" style={{ "--fc": F.c } as React.CSSProperties}>
            <span className="sr-only">Frente</span>
            <select value={frente} onChange={(e) => setFrente(e.target.value as FrenteKey)}>
              {Object.entries(FRENTES).map(([k, f]) => <option key={k} value={k}>{f.full}</option>)}
            </select>
          </label>
          <textarea
            ref={titleRef} className="title-input" rows={1} maxLength={120} aria-label="Título"
            placeholder="Título da publicação" value={titulo}
            onChange={(e) => { setTitulo(e.target.value.replace(/\s*\n\s*/g, " ")); setErro(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); focusEditor(); } }}
          />
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
          <PhotoPicker className="btn small cover-btn" onFiles={addFiles}>
            <PhotoIcon />{fotos.length ? "Mais fotos" : "Adicionar fotos"}
          </PhotoPicker>
        </div>

        <div
          ref={editorRef}
          className={`prose editor${corpo.length ? "" : " is-empty"}`}
          contentEditable suppressContentEditableWarning spellCheck lang="pt-BR"
          role="textbox" aria-multiline="true" aria-label="Texto da publicação"
          data-placeholder="Conte como foi o encontro: quem participou, o que foi feito, o que os estudantes descobriram."
          onInput={sync} onPaste={onPaste} onDrop={onDrop} onKeyDown={onKeyDown} onClick={onEditorClick}
        />

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
              <PhotoPicker className="add-tile" onFiles={addFiles}><PhotoIcon size={26} />Adicionar</PhotoPicker>
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
