// app/api/stream/series/[...params]/route.ts - CORRIGIDO COM SUA LÓGICA ORIGINAL
import { NextResponse } from "next/server";

const STREAM_API_URLS = [
  "https://baby-beamup.club/stream/series",
  "https://da5f663b4690-skyflixfork.baby-beamup.club/stream/series",
];

// AQUI ESTÁ A CORREÇÃO DA TIPAGEM, MANTENDO SEU CÓDIGO
export async function GET(
  request: Request,
  { params }: { params: { params: string[] } }
) {
  const [imdbId, season, episode] = params.params;

  if (!imdbId || !season || !episode) {
    return NextResponse.json({ error: "IMDb ID, temporada e episódio são necessários." }, { status: 400 });
  }

  const streamId = `${imdbId}:${season}:${episode}`;

  for (const baseUrl of STREAM_API_URLS) {
    try {
      const fullUrl = `${baseUrl}/${streamId}.json`;
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
      console.error(`[API/Stream/Series] Erro ao buscar de ${baseUrl}:`, error);
    }
  }

  return NextResponse.json(
    { streams: [], error: "Nenhum stream disponível no momento" },
    { status: 404 }
  );
}