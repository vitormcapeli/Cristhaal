import type { Metadata } from "next";
import { LocalPost } from "@/components/LocalPost";
import { PostView } from "@/components/PostView";
import { POSTS, getPost, sortPosts } from "@/lib/data";

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
  // Fora da lista do site: pode ser uma publicação de teste salva só neste navegador.
  if (i < 0) return <LocalPost id={id} />;
  return <PostView post={list[i]} prev={list[i + 1]} next={list[i - 1]} />;
}
