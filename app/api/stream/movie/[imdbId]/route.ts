// app/api/stream/movie/[imdbId]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";

const STREAM_API_URLS = [
  "https://baby-beamup.club/stream/movie",
  "https://da5f663b4690-skyflixfork.baby-beamup.club/stream/movie",
];

export async function GET(
  request: Request,
  { params }: { params: { imdbId: string } }
) {
  const { imdbId } = params;

  if (!imdbId) {
    return NextResponse.json({ error: "IMDb ID é necessário." }, { status: 400 });
  }

  // --- ETAPA 1: Verificar no Firestore por links manuais ---
  try {
    const docRef = doc(db, "media", imdbId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Verifica se existem URLs cadastradas para este filme
      if (data.type === 'movie' && Array.isArray(data.urls) && data.urls.length > 0) {
        console.log(`[API/Stream/Movie] Fonte manual encontrada no Firestore para ${imdbId}`);
        // Mapeia os dados do Firestore para o formato que o player espera
        const streams = data.urls.map((u: { quality: string; url: string }) => ({
          name: `Fonte Manual - ${u.quality || 'HD'}`,
          description: `Fonte Manual - ${u.quality || 'HD'} Dublado`,
          url: u.url,
        }));
        return NextResponse.json({ streams });
      }
    }
  } catch (error) {
    console.error(`[API/Stream/Movie] Erro ao buscar do Firestore para ${imdbId}:`, error);
  }

  // --- ETAPA 2: Fallback para as APIs externas se não encontrar no Firestore ---
  console.log(`[API/Stream/Movie] Fonte não encontrada no Firestore. Buscando em APIs externas para ${imdbId}`);
  for (const baseUrl of STREAM_API_URLS) {
    try {
      const fullUrl = `${baseUrl}/${imdbId}.json`;
      const response = await fetch(fullUrl, {
        signal: AbortSignal.timeout(15000), // Timeout de 15s
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json, text/plain, */*",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error(`[API/Stream/Movie] Erro ao buscar de ${baseUrl}:`, error);
    }
  }

  // Se nada for encontrado
  return NextResponse.json(
    { streams: [], error: "Nenhum stream disponível no momento" },
    { status: 404 }
  );
}