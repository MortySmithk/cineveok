// app/api/stream/movie/[tmdbId]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";

const TMDB_API_KEY = "860b66ade580bacae581f4228fad49fc";
const STREAM_API_URLS = [
  "https://baby-beamup.club/stream/movie",
  "https://da5f663b4690-skyflixfork.baby-beamup.club/stream/movie",
];

export async function GET(
  request: Request,
  { params }: { params: { tmdbId: string } }
) {
  const { tmdbId } = params;

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  // --- ETAPA 1: Tentar buscar nas APIs externas primeiro ---
  let imdbId: string | null = null;
  try {
    const externalIdsResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
    if (externalIdsResponse.ok) {
      const externalIdsData = await externalIdsResponse.json();
      imdbId = externalIdsData.imdb_id;
    }
  } catch (e) {
    console.error(`[API/Stream/Movie] Falha ao buscar IMDb ID para ${tmdbId}:`, e);
  }

  if (imdbId) {
    console.log(`[API/Stream/Movie] Buscando em APIs externas para IMDb ID: ${imdbId}`);
    for (const baseUrl of STREAM_API_URLS) {
      try {
        const fullUrl = `${baseUrl}/${imdbId}.json`;
        const response = await fetch(fullUrl, { signal: AbortSignal.timeout(15000) });

        if (response.ok) {
          const data = await response.json();
          // Se encontrou streams, retorna imediatamente
          if (data && data.streams && data.streams.length > 0) {
            console.log(`[API/Stream/Movie] Fonte encontrada em ${baseUrl}`);
            return NextResponse.json(data);
          }
        }
      } catch (error) {
        console.error(`[API/Stream/Movie] Erro ao buscar de ${baseUrl}:`, error);
      }
    }
  }

  // --- ETAPA 2: Fallback para o Firestore se as APIs externas falharem ---
  console.log(`[API/Stream/Movie] Nenhuma fonte externa encontrada. Verificando Firestore para ${tmdbId}`);
  try {
    const docRef = doc(db, "media", tmdbId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.type === 'movie' && Array.isArray(data.urls) && data.urls.length > 0) {
        console.log(`[API/Stream/Movie] Fonte manual encontrada no Firestore para ${tmdbId}`);
        const streams = data.urls.map((u: { quality: string; url: string }) => ({
          name: `CineVEO - ${u.quality || 'HD'} Dublado`,
          description: `CineVEO - ${u.quality || 'HD'} Dublado`,
          url: u.url,
        }));
        return NextResponse.json({ streams });
      }
    }
  } catch (error) {
    console.error(`[API/Stream/Movie] Erro ao buscar do Firestore para ${tmdbId}:`, error);
  }

  // Se nada for encontrado em nenhuma fonte
  return NextResponse.json({ streams: [], error: "Nenhum stream disponível no momento" }, { status: 404 });
}