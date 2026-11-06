"use server";

import { updateTag } from "next/cache";
import { POSTS_TAG } from "@/lib/posts";
import { supabasePublico } from "@/lib/supabase";

/**
 * Avisa o site que as publicações mudaram (alguém publicou ou apagou), para as páginas mostrarem
 * a versão nova na hora. Só aceita quem mandar a sessão de uma conta da equipe.
 */
export async function postsMudaram(accessToken: string) {
  const { data, error } = await supabasePublico().auth.getUser(accessToken);
  if (error || !data.user) return false;
  updateTag(POSTS_TAG);
  return true;
}
