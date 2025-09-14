// app/api/stream/movie/[imdbId]/route.ts - CORRIGIDO COM SUA LÓGICA ORIGINAL
import { NextResponse } from "next/server";

const STREAM_API_URLS = [
  "https://baby-beamup.club/stream/movie",
  "https://da5f663b4690-skyflixfork.baby-beamup.club/stream/movie",
];

// AQUI ESTÁ A CORREÇÃO DA TIPAGEM, MANTENDO SEU CÓDIGO
export async function GET(
  request: Request,
  { params }: { params: { imdbId: string } }
) {
  const { imdbId } = params;

  if (!imdbId) {
    return NextResponse.json({ error: "IMDb ID é necessário." }, { status: 400 });
  }

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
        // Se encontrou dados, retorna e para o loop
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error(`[API/Stream/Movie] Erro ao buscar de ${baseUrl}:`, error);
    }
  }

  // Se o loop terminar sem sucesso
  return NextResponse.json(
    { streams: [], error: "Nenhum stream disponível no momento" },
    { status: 404 }
  );
}