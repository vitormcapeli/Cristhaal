// Endereço e chave pública do Supabase. Ficam num arquivo sem dependências para que o menu possa
// saber se há alguém da equipe conectado sem carregar a biblioteca do Supabase em toda página.
//
// A URL e a chave "publishable" são públicas por natureza: vão para o navegador de qualquer visitante.
// Quem protege os dados são as regras do banco (supabase/schema.sql). Por isso ficam aqui como padrão,
// e o site funciona sem configurar nada. A chave secreta (service_role / secret) nunca entra no código.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ltwqzktjjimqfbwzvctn.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "sb_publishable_lepbBUYbVWwqTNY1FvuBHQ_QRUvCtcd";
export const BUCKET = "fotos";

/** Onde o supabase-js guarda a sessão no navegador (sb-<projeto>-auth-token). */
export const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
/** Evento disparado nesta aba quando alguém entra ou sai. */
export const AUTH_EVENT = "cristhaal-sessao";
