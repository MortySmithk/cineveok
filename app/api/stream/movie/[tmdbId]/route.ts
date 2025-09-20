// app/api/stream/movie/[tmdbId]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../firebase"; // Ajuste o caminho se necessário

export async function GET(
  request: Request,
  { params }: { params: { tmdbId: string } }
) {
  const { tmdbId } = params;
  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  try {
    const docRef = doc(db, "media", tmdbId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Assume que os links estão em um array 'urls' no documento
      const streams = (data.urls || []).map((stream: any, index: number) => ({
        name: stream.quality || `CineVEO - Opção ${index + 1}`,
        description: stream.description || 'Fonte principal',
        url: stream.url, // A URL já deve ser o link do short.icu
      }));

      if (streams.length > 0) {
        return NextResponse.json({ streams });
      }
    }
    return NextResponse.json({ error: "Nenhum stream encontrado para este filme." }, { status: 404 });

  } catch (error) {
    console.error("Erro ao buscar dados do Firestore:", error);
    return NextResponse.json({ error: "Erro ao buscar streams." }, { status: 500 });
  }
}