// cineveo-next/app/tv/layout.tsx
import type { Metadata } from "next";
import "./tv.css";

export const metadata: Metadata = {
  title: "CineVEO TV",
  description: "Uma experiência otimizada para assistir na sua TV.",
};

export default function TVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div id="tv-app-container">
          {children}
        </div>
      </body>
    </html>
  );
}