"use client";

import { useSyncExternalStore } from "react";
import { AUTH_EVENT, AUTH_STORAGE_KEY } from "./supabaseConfig";

// Saber se há alguém da equipe conectado neste navegador, sem carregar o Supabase.
// Serve só para mostrar ou esconder botões: quem decide o que pode ser gravado é o banco.

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === AUTH_STORAGE_KEY || e.key === null) cb(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_EVENT, cb);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(AUTH_EVENT, cb); };
}

function conectado() {
  try { return localStorage.getItem(AUTH_STORAGE_KEY) !== null; } catch { return false; }
}

export const useConectado = () => useSyncExternalStore(subscribe, conectado, () => false);
export const avisarSessao = () => window.dispatchEvent(new Event(AUTH_EVENT));
