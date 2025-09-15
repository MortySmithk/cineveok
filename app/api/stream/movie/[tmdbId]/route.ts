// app/api/stream/movie/[tmdbId]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";

const TMDB_API_KEY = "860b66ade580bacae581f4228fad49fc";
const STREAM_API_URLS = [
  "https://baby-beamup.club/stream/movie",
  "https://da5f663b4690-skyflixfork.baby-beamup.club/stream/movie",
];

// Interface para um stream unificado
interface Stream {
  name: string;
  description: string;
  url: string;
  // Adicione quaisquer outros campos que possam vir das APIs
  [key: string]: any; 
}

export async function GET(
  request: Request,
  { params }: { params: { tmdbId: string } }
) {
  const { tmdbId } = params;
  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  const allStreams: Stream[] = [];
  let imdbId: string | null = null;

  // --- ETAPA 1: Obter IMDb ID ---
  try {
    const externalIdsResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
    if (externalIdsResponse.ok) {
      const externalIdsData = await externalIdsResponse.json();
      imdbId = externalIdsData.imdb_id;
    }
  } catch (e) {
    console.error(`[API/Stream/Movie] Falha ao buscar IMDb ID para ${tmdbId}:`, e);
  }

  // --- ETAPA 2: Buscar em todas as fontes ---

  // 2a: APIs Externas Principais
  if (imdbId) {
    console.log(`[API/Stream/Movie] Buscando em APIs externas para IMDb ID: ${imdbId}`);
    for (const baseUrl of STREAM_API_URLS) {
      try {
        const response = await fetch(`${baseUrl}/${imdbId}.json`, { signal: AbortSignal.timeout(8000) });
        if (response.ok) {
          const data = await response.json();
          if (data && data.streams && data.streams.length > 0) {
            console.log(`[API/Stream/Movie] Fonte encontrada em ${baseUrl}`);
            allStreams.push(...data.streams);
          }
        }
      } catch (error) {
        console.error(`[API/Stream/Movie] Erro ao buscar de ${baseUrl}:`, error);
      }
    }
  }

  // 2b: Firestore
  try {
    const docRef = doc(db, "media", tmdbId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.type === 'movie' && Array.isArray(data.urls) && data.urls.length > 0) {
        console.log(`[API/Stream/Movie] Fonte manual encontrada no Firestore para ${tmdbId}`);
        const firestoreStreams = data.urls.map((u: { quality: string; url: string }) => ({
          name: `CineVEO - Player HD`,
          description: `Qualidade ${u.quality || 'HD'}`,
          url: u.url,
        }));
        allStreams.push(...firestoreStreams);
      }
    }
  } catch (error) {
    console.error(`[API/Stream/Movie] Erro ao buscar do Firestore para ${tmdbId}:`, error);
  }

  // 2c: Roxano Play API
  if (imdbId) {
    console.log(`[API/Stream/Movie] Adicionando fonte da Roxano Play para ${imdbId}`);
    allStreams.push({
      name: 'CineVEO - Player HD',
      description: 'Fonte alternativa',
      url: `https://roxanoplay.bb-bet.top/pages/hostmov.php?id=${imdbId}`,
    });
  }

  // --- ETAPA 3: Priorizar e Filtrar ---
  if (allStreams.length > 0) {
    // Prioridade 1: Streams Dublados da API Principal
    const dubbedStreams = allStreams.filter(s => s.description && s.description.toLowerCase().includes('dublado'));
    if (dubbedStreams.length > 0) {
      console.log(`[API/Stream/Movie] Priorizando ${dubbedStreams.length} stream(s) dublado(s).`);
      return NextResponse.json({ streams: dubbedStreams });
    }

    // Prioridade 2: Streams manuais (Firestore, Roxano)
    const manualStreams = allStreams.filter(s => s.name === 'CineVEO - Player HD');
    if (manualStreams.length > 0) {
        console.log(`[API/Stream/Movie] Priorizando ${manualStreams.length} stream(s) manuai(s).`);
        return NextResponse.json({ streams: manualStreams });
    }

    // Fallback: Retorna todos os outros streams
    const otherStreams = allStreams.filter(s => !s.description?.toLowerCase().includes('dublado') && s.name !== 'CineVEO - Player HD');
    if (otherStreams.length > 0) {
        console.log(`[API/Stream/Movie] Usando ${otherStreams.length} stream(s) de fallback.`);
        return NextResponse.json({ streams: otherStreams });
    }
  }

  // Se nada for encontrado
  return NextResponse.json({ streams: [], error: "Nenhum stream disponível no momento" }, { status: 404 });
}