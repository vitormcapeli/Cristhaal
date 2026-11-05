import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque, Homemade_Apple } from "next/font/google";
import { ViewTransition } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/Toast";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const body = Atkinson_Hyperlegible({ variable: "--font-body", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], axes: ["opsz"] });
const script = Homemade_Apple({ variable: "--font-script", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "Projeto Cristhaal", template: "%s | Cristhaal" },
  description:
    "Projeto de extensão do ICT/Unifesp em São José dos Campos que aproxima estudantes de escolas públicas da ciência, a partir dos cristais.",
};

export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${display.variable} ${script.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <noscript><style>{".logo.pre{visibility:visible}"}</style></noscript>
        <ToastProvider>
          <Header />
          <main>
            <ViewTransition>{children}</ViewTransition>
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
