import Link from "next/link";
import type { Post } from "@/lib/data";
import { PostArticle } from "./PostView";

/** Feed da página inicial: as publicações mais recentes já abertas, uma embaixo da outra. */
export function LatestFeed({ posts: all, count = 3 }: { posts: Post[]; count?: number }) {
  const posts = all.slice(0, count);
  const older = all.length - posts.length;
  return (
    <>
      <div className="feed-full">
        {posts.map((p) => <PostArticle key={p.id} post={p} inFeed />)}
      </div>
      {older > 0 && (
        <div className="feed-end">
          <p>Quer ver os encontros anteriores? Há mais {older} {older === 1 ? "publicação" : "publicações"} na lista completa.</p>
          <Link className="btn primary" href="/publicacoes">Ver publicações mais antigas</Link>
        </div>
      )}
    </>
  );
}
