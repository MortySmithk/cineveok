// app/api/stream/series/[...params]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";

const TMDB_API_KEY = "860b66ade580bacae581f4228fad49fc";
const STREAM_API_URLS = [
  "https://baby-beamup.club/stream/series",
  "https://da5f663b4690-skyflixfork.baby-beamup.club/stream/series",
];

export async function GET(
  request: Request,
  { params }: { params: { params: string[] } }
) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }

  // --- ETAPA 1: Verificar no Firestore por links manuais ---
  try {
    const docRef = doc(db, "media", tmdbId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const seasonData = data.seasons?.[season];
      const episodeData = seasonData?.episodes?.find(
        (ep: { episode_number: number }) => ep.episode_number == parseInt(episode, 10)
      );
      
      if (episodeData && Array.isArray(episodeData.urls) && episodeData.urls.length > 0) {
        console.log(`[API/Stream/Series] Fonte manual encontrada no Firestore para ${tmdbId} S${season}E${episode}`);
        const streams = episodeData.urls.map((u: { quality: string; url: string }) => ({
          name: `Fonte Manual - ${u.quality || 'HD'}`,
          description: `Fonte Manual - ${u.quality || 'HD'} Dublado`,
          url: u.url,
        }));
        return NextResponse.json({ streams });
      }
    }
  } catch (error) {
    console.error(`[API/Stream/Series] Erro ao buscar do Firestore para ${tmdbId}:`, error);
  }

  // --- ETAPA 2: Fallback para as APIs externas ---
  console.log(`[API/Stream/Series] Fonte não encontrada no Firestore. Buscando em APIs externas para ${tmdbId} S${season}E${episode}`);

  let imdbId: string | null = null;
  try {
    const externalIdsResponse = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
    if (externalIdsResponse.ok) {
      const externalIdsData = await externalIdsResponse.json();
      imdbId = externalIdsData.imdb_id;
    }
  } catch (e) {
    console.error(`[API/Stream/Series] Falha ao buscar IMDb ID para ${tmdbId}:`, e);
  }

  if (!imdbId) {
    return NextResponse.json({ streams: [], error: "Não foi possível encontrar o IMDb ID para este título." }, { status: 404 });
  }

  const streamId = `${imdbId}:${season}:${episode}`;
  for (const baseUrl of STREAM_API_URLS) {
    try {
      const fullUrl = `${baseUrl}/${streamId}.json`;
      const response = await fetch(fullUrl, { signal: AbortSignal.timeout(15000) });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error(`[API/Stream/Series] Erro ao buscar de ${baseUrl}:`, error);
    }
  }

  return NextResponse.json({ streams: [], error: "Nenhum stream disponível no momento" }, { status: 404 });
}