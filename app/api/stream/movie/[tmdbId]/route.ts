// app/api/stream/movie/[tmdbId]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { tmdbId: string } }
) {
  const { tmdbId } = params;
  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID é necessário." }, { status: 400 });
  }

  const streamUrl = `https://ultraembed.fun/filme/${tmdbId}`;

  // Retorna uma estrutura de stream simples que o front-end pode usar
  const stream = {
    name: 'CineVEO - Servidor 1',
    description: 'Fonte principal',
    url: streamUrl,
  };

  return NextResponse.json({ streams: [stream] });
}