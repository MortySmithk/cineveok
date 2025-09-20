// app/api-docs/page.tsx

import React from 'react';
import Link from 'next/link';

const ApiDocsPage = () => {
  const exampleMovieUrl = "https://www.cineveo.lat/player3/media/movie/653346"; // Dune: Part Two
  const exampleSeriesUrl = "https://www.cineveo.lat/player3/media/tv/119051/1/1"; // The Last of Us S01E01

  return (
    <main style={{ paddingTop: '100px', paddingBottom: '40px' }}>
      <div className="main-container">
        <h1 className="page-title">API de Filmes e Séries</h1>
        <div className="api-docs-content">
          <p>
            Bem-vindo à documentação da API de Player Embed do CineVEO. Você pode usar nossos players em seu site ou aplicação
            seguindo os formatos de URL abaixo, que buscam os links diretamente de nossa base de dados.
          </p>

          <section>
            <h2>Formato da URL</h2>
            <p>A estrutura base da URL é projetada para ser simples e intuitiva, aceitando o tipo de mídia e seus respectivos IDs.</p>
          </section>

          <section>
            <h3>Player de Filmes</h3>
            <p>Para incorporar o player de um filme, use o seguinte formato:</p>
            <pre><code>/player3/media/movie/{"{TMDB_ID}"}</code></pre>
            <p>
              Substitua `{"{TMDB_ID}"}` pelo ID do filme no The Movie Database (TMDB).
            </p>
            <h4>Exemplo:</h4>
            <p>Para o filme "Duna: Parte Dois" (TMDB ID: 653346), a URL seria:</p>
            <pre><code><Link href={exampleMovieUrl} target="_blank">{exampleMovieUrl}</Link></code></pre>
            <h4>Exemplo de Iframe:</h4>
            <pre><code>{`<iframe src="${exampleMovieUrl}" frameborder="0" allowfullscreen></iframe>`}</code></pre>
          </section>

          <section>
            <h3>Player de Séries</h3>
            <p>Para incorporar o player de um episódio de série, use o seguinte formato:</p>
            <pre><code>/player3/media/tv/{"{TMDB_ID}"}/{"{SEASON_NUMBER}"}/{"{EPISODE_NUMBER}"}</code></pre>
            <ul>
              <li><code>{"{TMDB_ID}"}</code>: O ID da série no TMDB.</li>
              <li><code>{"{SEASON_NUMBER}"}</code>: O número da temporada.</li>
              <li><code>{"{EPISODE_NUMBER}"}</code>: O número do episódio.</li>
            </ul>
            <h4>Exemplo:</h4>
            <p>Para "The Last of Us", Temporada 1, Episódio 1 (TMDB ID: 119051), a URL seria:</p>
            <pre><code><Link href={exampleSeriesUrl} target="_blank">{exampleSeriesUrl}</Link></code></pre>
            <h4>Exemplo de Iframe:</h4>
            <pre><code>{`<iframe src="${exampleSeriesUrl}" frameborder="0" allowfullscreen></iframe>`}</code></pre>
          </section>
          
          <section>
            <h2>Nosso Catálogo</h2>
            <p>
                Nossa plataforma tem acesso a um vasto catálogo de entretenimento, indexado pelo The Movie Database (TMDB).
                Embora a disponibilidade de links de streaming possa variar, nosso acervo inclui:
            </p>
            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-number">800.000+</span>
                    <span className="stat-label">Filmes</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">130.000+</span>
                    <span className="stat-label">Séries de TV</span>
                </div>
            </div>
             <p className="disclaimer">
                * Números baseados no catálogo geral do TMDB. A disponibilidade de stream para um título específico não é garantida e depende da nossa base de dados.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
};

export default ApiDocsPage;