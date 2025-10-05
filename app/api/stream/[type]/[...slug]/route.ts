// app/api/stream/[type]/[...slug]/route.ts
import { NextResponse } from 'next/server';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/app/firebase'; // Reutilizando sua configuração do Firebase

// Função auxiliar para buscar o URL
async function fetchStreamUrl(url: string) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Referer': 'https://cineveo.lat/', // Adicionar um referer pode ajudar
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            redirect: 'follow' // Seguir redirecionamentos
        });

        if (!response.ok) return null;

        // O PrimeVício retorna um JSON com a URL final
        const data = await response.json();
        
        // Verificamos se há streams e se a URL parece válida
        if (data && data.streams && data.streams.length > 0 && data.streams[0].url) {
            return data.streams[0].url;
        }
        
        return null;

    } catch (error) {
        console.error(`Erro ao buscar stream de ${url}:`, error);
        return null;
    }
}

export async function GET(
  req: Request,
  { params }: { params: { type: string; slug: string[] } }
) {
  const { type, slug } = params;
  const id = slug[0];

  try {
    const docRef = doc(db, 'media', id);
    const docSnap = await getDoc(docRef);
    const useFirestore = docSnap.exists() && docSnap.data().forceFirestore === true;
    
    let finalStreamUrl = null;

    // LÓGICA PARA USAR FIRESTORE QUANDO 'forceFirestore' ESTÁ ATIVO
    if (useFirestore) {
        const firestoreData = docSnap.data();
        if (type === 'movie' && firestoreData.urls?.[0]?.url) {
            finalStreamUrl = firestoreData.urls[0].url;
        } else if (type === 'tv' && slug.length === 3) {
            const [, season, episode] = slug;
            const episodeData = firestoreData.seasons?.[season]?.episodes?.find(
                (ep: any) => ep.episode_number == parseInt(episode)
            );
            finalStreamUrl = episodeData?.urls?.[0]?.url || null;
        }
    } 
    
    // LÓGICA PADRÃO: BUSCAR NA API DO PRIMEVÍCIO
    else {
        let primeVicioApiUrl = '';
        if (type === 'movie') {
            primeVicioApiUrl = `https://primevicio.vercel.app/api/movie/${id}`;
        } else if (type === 'tv' && slug.length === 3) {
            const [, season, episode] = slug;
            primeVicioApiUrl = `https://primevicio.vercel.app/api/series/${id}/${season}/${episode}`;
        }

        if (primeVicioApiUrl) {
            finalStreamUrl = await fetchStreamUrl(primeVicioApiUrl);
        }
    }

    // RESPOSTA
    if (finalStreamUrl) {
      return NextResponse.json({ streamUrl: finalStreamUrl });
    } else {
      return NextResponse.json({ error: 'Link de streaming não encontrado.' }, { status: 404 });
    }

  } catch (error) {
    console.error('Erro na rota /api/stream:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}