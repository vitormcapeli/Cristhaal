import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalPost } from "@/components/LocalPost";
import { PostView } from "@/components/PostView";
import { LOCAL_PREFIX, POSTS, getPost, sortPosts } from "@/lib/data";

export function generateStaticParams() {
  return POSTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/publicacoes/[id]">): Promise<Metadata> {
  const p = getPost((await params).id);
  return p ? { title: p.titulo, description: p.resumo } : { title: "Publicação" };
}

export default async function PostPage({ params }: PageProps<"/publicacoes/[id]">) {
  const { id } = await params;
  const list = sortPosts(POSTS);
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) {
    // Publicação de teste salva só no navegador de quem escreveu. Qualquer outro id não existe.
    if (id.startsWith(LOCAL_PREFIX)) return <LocalPost id={id} />;
    notFound();
  }
  return <PostView post={list[i]} prev={list[i + 1]} next={list[i - 1]} />;
}
