import type { Metadata } from "next";
import { EditorGate } from "@/components/EditorGate";

export const metadata: Metadata = { title: "Nova publicação", robots: { index: false, follow: false } };

export default function Publicar() {
  return (
    <div className="wrap post compose">
      <EditorGate />
    </div>
  );
}
