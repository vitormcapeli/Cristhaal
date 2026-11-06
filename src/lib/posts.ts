// Leitura das publicações no servidor. O resultado fica em cache (etiqueta "posts") e é renovado
// quando alguém da equipe publica ou apaga (ver src/app/actions.ts), ou no máximo a cada hora.

import { cacheLife, cacheTag } from "next/cache";
import { COLUNAS, rowToPost, supabasePublico, type PostRow } from "./supabase";

export const POSTS_TAG = "posts";

/** Todas as publicações, das mais recentes para as mais antigas. */
export async function getPosts() {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("hours");
  const { data, error } = await supabasePublico()
    .from("posts")
    .select(COLUNAS)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });
  // Sem dados, melhor falhar e continuar mostrando a versão anterior do que mostrar o site vazio.
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data as PostRow[]).map(rowToPost);
}
