"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConectado } from "@/lib/sessao";
import { useToast } from "./Toast";

/** Na página de um post, para quem entrou com a conta da equipe: apagar a publicação. */
export function PostAdmin({ id, titulo }: { id: string; titulo: string }) {
  const conectado = useConectado();
  const router = useRouter();
  const toast = useToast();
  const [apagando, setApagando] = useState(false);
  if (!conectado) return null;

  const apagar = async () => {
    if (!confirm(`Apagar a publicação "${titulo}"? Ela sai do portal e as fotos dela são apagadas. Não dá para desfazer.`)) return;
    setApagando(true);
    // A biblioteca do Supabase só é carregada aqui, para não pesar a página de quem só lê.
    const [{ supabaseNavegador }, { apagarImagens }, { postsMudaram }] = await Promise.all([
      import("@/lib/supabase"), import("@/lib/upload"), import("@/app/actions"),
    ]);
    const sb = supabaseNavegador();
    const { data: { session } } = await sb.auth.getSession();
    const { data, error } = session ? await sb.from("posts").delete().eq("id", id).select("id") : { data: null, error: null };
    if (!session || error || !data?.length) {
      setApagando(false);
      alert(!session ? "Sua sessão terminou. Entre de novo em /publicar." : `Não foi possível apagar${error ? `: ${error.message}` : " (sua conta não tem permissão)"}.`);
      return;
    }
    await apagarImagens(sb, id).catch(() => {});
    toast("Publicação apagada");
    if ((await postsMudaram(session.access_token, "/publicacoes")) === false) router.push("/publicacoes");
  };

  return (
    <div className="post-admin">
      <span>Você está conectado com a conta da equipe.</span>
      <button className="btn small danger" type="button" onClick={apagar} disabled={apagando}>
        {apagando ? "Apagando…" : "Apagar publicação"}
      </button>
    </div>
  );
}
