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

  let imdbId: string | null = null;
  
  // --- Obter IMDb ID (necessário para APIs externas) ---
  try {
    const externalIdsResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
    if (externalIdsResponse.ok) {
      const externalIdsData = await externalIdsResponse.json();
      imdbId = externalIdsData.imdb_id;
    }
  } catch (e) {
    console.error(`[API/Stream/Movie] Falha ao buscar IMDb ID para ${tmdbId}:`, e);
  }

  // --- Prioridade 1: APIs Externas (Dublado) ---
  if (imdbId) {
    console.log(`[API/Stream/Movie] Buscando em APIs externas para IMDb ID: ${imdbId}`);
    for (const baseUrl of STREAM_API_URLS) {
      try {
        const response = await fetch(`${baseUrl}/${imdbId}.json`, { signal: AbortSignal.timeout(8000) });
        if (response.ok) {
          const data = await response.json();
          const dubbedStreams = data.streams?.filter((s: Stream) => s.description && s.description.toLowerCase().includes('dublado'));
          if (dubbedStreams && dubbedStreams.length > 0) {
            console.log(`[API/Stream/Movie] Fonte DUAL/DUB encontrada em ${baseUrl}. Retornando...`);
            return NextResponse.json({ streams: dubbedStreams });
          }
        }
      } catch (error) {
        console.error(`[API/Stream/Movie] Erro ao buscar de ${baseUrl}:`, error);
      }
    }
  }

  // --- Prioridade 2: Firestore ---
  try {
    const docRef = doc(db, "media", tmdbId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.type === 'movie' && Array.isArray(data.urls) && data.urls.length > 0) {
        console.log(`[API/Stream/Movie] Fonte manual encontrada no Firestore para ${tmdbId}. Retornando...`);
        const firestoreStreams = data.urls.map((u: { quality: string; url: string }) => ({
          name: `CineVEO - Player HD`,
          description: `Qualidade ${u.quality || 'HD'}`,
          url: u.url,
        }));
        return NextResponse.json({ streams: firestoreStreams });
      }
    }
  } catch (error) {
    console.error(`[API/Stream/Movie] Erro ao buscar do Firestore para ${tmdbId}:`, error);
  }

  // --- Prioridade 3: Roxano Play API (usa TMDB ID) ---
  console.log(`[API/Stream/Movie] Verificando fonte da Roxano Play para TMDB ID: ${tmdbId}`);
  const roxanoStream = {
      name: 'CineVEO - Player HD',
      description: 'Fonte alternativa',
      // CORREÇÃO: Usando tmdbId ao invés de imdbId
      url: `https://roxanoplay.bb-bet.top/pages/hostmov.php?id=${tmdbId}`,
  };
  // Como não podemos verificar se o link é válido aqui, vamos retorná-lo para o cliente tentar.
  // Poderíamos adicionar um HEAD request aqui no futuro, se necessário.
  return NextResponse.json({ streams: [roxanoStream] });
  
  // Nenhuma das fontes prioritárias foi encontrada, aqui poderíamos adicionar um fallback para streams legendados, mas a lógica atual já retorna a Roxano.
  // Caso a Roxano falhe no cliente, a página de mídia mostrará "Nenhuma fonte encontrada".

  // return NextResponse.json({ streams: [], error: "Nenhum stream disponível no momento" }, { status: 404 });
}