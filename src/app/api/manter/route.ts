import { connection } from "next/server";
import { supabasePublico } from "@/lib/supabase";

// Chamado uma vez por dia pela Vercel (vercel.json). O Supabase grátis pausa o projeto depois de
// uma semana sem uso; esta consulta conta como uso, mesmo que o site fique dias sem visitas.
export async function GET() {
  await connection();
  const { count, error } = await supabasePublico().from("posts").select("id", { count: "exact", head: true });
  if (error) return Response.json({ ok: false, erro: error.message }, { status: 502 });
  return Response.json({ ok: true, publicacoes: count });
}
