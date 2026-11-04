"use client";

import { useEffect, useState } from "react";
import { useAllPosts } from "@/lib/localPosts";
import { PostNotFound, PostView } from "./PostView";

/** Publicação que não está no site, procurada entre as criadas neste navegador. */
export function LocalPost({ id }: { id: string }) {
  const [mounted, setMounted] = useState(false);
  const list = useAllPosts();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe depois de montar
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="wrap post" />;
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) return <PostNotFound />;
  return <PostView post={list[i]} prev={list[i + 1]} next={list[i - 1]} />;
}
