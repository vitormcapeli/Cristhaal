import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostView } from "@/components/PostView";
import { getPosts } from "@/lib/posts";

export async function generateStaticParams() {
  const posts = await getPosts();
  // Com Cache Components a lista não pode vir vazia; um id que não existe vira 404.
  return posts.length ? posts.map((p) => ({ id: p.id })) : [{ id: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/publicacoes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = (await getPosts()).find((x) => x.id === id);
  return p ? { title: p.titulo, description: p.resumo } : { title: "Publicação não encontrada" };
}

export default async function PostPage({ params }: PageProps<"/publicacoes/[id]">) {
  const { id } = await params;
  const list = await getPosts();
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) notFound();
  return <PostView post={list[i]} prev={list[i + 1]} next={list[i - 1]} />;
}
