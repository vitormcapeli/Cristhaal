"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { avisarSessao } from "@/lib/sessao";
import { supabaseNavegador } from "@/lib/supabase";
import { Composer } from "./Composer";

/** /publicar: pede o login da equipe e, depois de entrar, mostra o editor. */
export function EditorGate() {
  // undefined: ainda verificando; null: ninguém conectado.
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const sb = supabaseNavegador();
    let vivo = true;
    sb.auth.getSession().then(({ data }) => { if (vivo) setSessao(data.session); });
    const { data } = sb.auth.onAuthStateChange((_e, s) => { setSessao(s); avisarSessao(); });
    return () => { vivo = false; data.subscription.unsubscribe(); };
  }, []);

  if (sessao === undefined) return <p className="help">Carregando…</p>;
  if (!sessao) return <Entrar />;

  const sair = async () => {
    await supabaseNavegador().auth.signOut();
    avisarSessao();
  };

  return (
    <>
      <div className="compose-head">
        <h1>Nova publicação</h1>
        <p>
          Escreva direto na página: ela já está do jeito que vai aparecer no portal. Clique na frente, no título, nas letras
          das áreas ou no texto para mudar. O rascunho fica salvo neste navegador até você publicar.
        </p>
        <p className="sessao">
          Conectado como <b>{sessao.user.email}</b>
          <button className="link-btn" type="button" onClick={sair}>Sair</button>
        </p>
      </div>
      <Composer />
    </>
  );
}

function Entrar() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (!error) return;
    setErro(
      error.message === "Invalid login credentials" ? "E-mail ou senha incorretos."
      : /fetch|network/i.test(error.message) ? "Sem conexão com o servidor. Confira a internet e tente de novo."
      : `Não foi possível entrar: ${error.message}`,
    );
  };

  return (
    <form className="login" onSubmit={entrar}>
      <h1>Entrar para publicar</h1>
      <p className="help">Só a equipe do Cristhaal publica no portal. As contas são criadas pelo administrador do projeto.</p>
      <div className="field">
        <label htmlFor="login-email">E-mail</label>
        <input id="login-email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="login-senha">Senha</label>
        <input id="login-senha" className="input" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
      </div>
      <p className="form-error" role="alert">{erro}</p>
      <button className="btn primary" type="submit" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
      <p className="help">Esqueceu a senha? Peça ao administrador para criar uma nova.</p>
    </form>
  );
}
