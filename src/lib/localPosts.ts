"use client";

// Publicações criadas pelo formulário ficam só no navegador de quem testou (fase de protótipo).
// Isso será trocado pelo Supabase; os componentes só dependem de useAllPosts / addLocalPost.

import { useSyncExternalStore } from "react";
import { POSTS, sortPosts, type Post } from "./data";

const KEY = "cristhaal-extra-posts";
const photoUrls = new Map<string, string[]>(); // fotos escolhidas valem só nesta sessão
const listeners = new Set<() => void>();
let cache: Post[] | null = null;
const EMPTY: Post[] = [];

function read(): Post[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    cache = Array.isArray(raw) ? raw : [];
  } catch {
    cache = [];
  }
  cache = cache.map((p) => ({ ...p, imagens: photoUrls.get(p.id) }));
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

export function useLocalPosts() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useAllPosts() {
  const local = useLocalPosts();
  return local.length ? sortPosts([...local, ...POSTS]) : sortPosts(POSTS);
}

const withoutPhotos = (p: Post): Post => ({ ...p, imagens: undefined });

/** Salva a publicação. Devolve false se não coube no navegador (imagens demais). */
export function addLocalPost(post: Post, photos: string[]): boolean {
  const next = [post, ...read()].map(withoutPhotos);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { return false; }
  if (photos.length) photoUrls.set(post.id, photos);
  cache = null;
  listeners.forEach((l) => l());
  return true;
}
