"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { imageToDataUrl } from "./editor";
import { BUCKET } from "./supabaseConfig";

/**
 * Envia uma imagem para o Storage e devolve o endereço público dela.
 * `src` é uma foto escolhida no computador (blob:), que é reduzida antes de subir,
 * ou uma imagem do texto (data:), que o editor já reduziu.
 */
export async function enviarImagem(sb: SupabaseClient, caminho: string, src: string): Promise<string> {
  let blob = await (await fetch(src)).blob();
  if (src.startsWith("blob:")) {
    const reduzida = await imageToDataUrl(new File([blob], "foto", { type: blob.type }));
    blob = await (await fetch(reduzida)).blob();
  }
  const { error } = await sb.storage.from(BUCKET).upload(caminho, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

/** Caminhos no Storage de todas as imagens de uma publicação (ficam na pasta com o id dela). */
export async function apagarImagens(sb: SupabaseClient, id: string) {
  const { data } = await sb.storage.from(BUCKET).list(id, { limit: 1000 });
  if (data?.length) await sb.storage.from(BUCKET).remove(data.map((f) => `${id}/${f.name}`));
}
