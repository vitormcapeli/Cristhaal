"use client";

import { useAllPosts } from "@/lib/localPosts";
import { PostRow } from "./PostRow";

export function LatestFeed({ count = 4 }: { count?: number }) {
  const posts = useAllPosts().slice(0, count);
  return <div className="feed">{posts.map((p) => <PostRow key={p.id} post={p} />)}</div>;
}
