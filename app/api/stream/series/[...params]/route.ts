// app/api/stream/series/[...params]/route.ts
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase"; // CAMINHO CORRIGIDO

export async function GET(
  request: Request,
  { params }: { params: { params: string[] } }
) {
  const [tmdbId, season, episode] = params.params;

  if (!tmdbId || !season || !episode) {
    return NextResponse.json({ error: "TMDB ID, temporada e episódio são necessários." }, { status: 400 });
  }

  try {
    const docRef = doc(db, "media", tmdbId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const seasonData = data.seasons?.[season];
        const episodeData = seasonData?.episodes?.find(
            (ep: any) => ep.episode_number == parseInt(episode)
        );

        if (episodeData && episodeData.urls && episodeData.urls.length > 0) {
            const streams = episodeData.urls.map((stream: any, index: number) => ({
                name: stream.quality || `CineVEO - T${season} E${episode} Opção ${index + 1}`,
                description: stream.description || 'Fonte principal',
                url: stream.url, // A URL já deve ser o link do short.icu
            }));
            return NextResponse.json({ streams });
        }
    }
    return NextResponse.json({ error: "Nenhum stream encontrado para este episódio." }, { status: 404 });

  } catch (error) {
    console.error("Erro ao buscar dados do Firestore:", error);
    return NextResponse.json({ error: "Erro ao buscar streams." }, { status: 500 });
  }
}