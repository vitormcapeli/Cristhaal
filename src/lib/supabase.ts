// Ligação com o Supabase (banco das publicações, fotos e login da equipe).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isAlinhamento, type Bloco, type Post } from "./data";
import { validW } from "./rich";
import { AUTH_STORAGE_KEY, SUPABASE_KEY, SUPABASE_URL } from "./supabaseConfig";

export { AUTH_STORAGE_KEY, BUCKET, SUPABASE_KEY, SUPABASE_URL } from "./supabaseConfig";

/** Cliente sem sessão, para ler no servidor. */
export const supabasePublico = () =>
  createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

let browser: SupabaseClient | null = null;
/** Cliente do navegador, com a sessão de quem entrou com a conta da equipe. */
export function supabaseNavegador() {
  browser ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: AUTH_STORAGE_KEY } });
  return browser;
}

/** Uma linha da tabela `posts`. */
export type PostRow = {
  id: string;
  frente: Post["frente"];
  areas: Post["areas"];
  autor: Post["autor"];
  data: string;
  fotos: number;
  seed: number;
  titulo: string;
  titulo_al: string | null;
  titulo_w: number | null;
  resumo: string;
  corpo: Bloco[];
  imagens: string[];
};

export const COLUNAS = "id, frente, areas, autor, data, fotos, seed, titulo, titulo_al, titulo_w, resumo, corpo, imagens";

export function rowToPost(r: PostRow): Post {
  const imagens = Array.isArray(r.imagens) ? r.imagens : [];
  return {
    id: r.id,
    frente: r.frente,
    areas: r.areas ?? [],
    autor: r.autor,
    data: r.data,
    fotos: imagens.length || r.fotos || 0,
    seed: r.seed,
    titulo: r.titulo,
    tituloAl: isAlinhamento(r.titulo_al) && r.titulo_al !== "left" ? r.titulo_al : undefined,
    tituloW: validW(r.titulo_w) ? r.titulo_w : undefined,
    resumo: r.resumo,
    corpo: Array.isArray(r.corpo) ? r.corpo : [],
    imagens: imagens.length ? imagens : undefined,
  };
}

export function postToRow(p: Post): PostRow {
  return {
    id: p.id,
    frente: p.frente,
    areas: p.areas,
    autor: p.autor,
    data: p.data,
    fotos: p.imagens?.length ?? 0,
    seed: p.seed,
    titulo: p.titulo,
    titulo_al: p.tituloAl ?? null,
    titulo_w: p.tituloW ?? null,
    resumo: p.resumo,
    corpo: p.corpo,
    imagens: p.imagens ?? [],
  };
}
