// app/api/stream/series/[...params]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { params: string[] } }
) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }

  const streamUrl = `https://primevicio.vercel.app/embed/tv/${tmdbId}/${season}/${episode}`;

    // Retorna uma estrutura de stream simples que o front-end pode usar
  const stream = {
    name: `CineVEO - T${season} E${episode}`,
    description: 'Fonte principal',
    url: streamUrl,
  };

  return NextResponse.json({ streams: [stream] });
}