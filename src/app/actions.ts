"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { POSTS_TAG } from "@/lib/posts";
import { supabasePublico } from "@/lib/supabase";

/**
 * Avisa o site que as publicações mudaram (alguém publicou ou apagou) e leva a pessoa para `destino`
 * já com a versão nova. O redirecionamento feito aqui também descarta as páginas que o navegador
 * guardou antes da mudança. Só aceita quem mandar a sessão de uma conta da equipe.
 */
export async function postsMudaram(accessToken: string, destino: string) {
  const { data, error } = await supabasePublico().auth.getUser(accessToken);
  if (error || !data.user) return false;
  updateTag(POSTS_TAG);
  redirect(destino.startsWith("/publicacoes") ? destino : "/publicacoes");
}
