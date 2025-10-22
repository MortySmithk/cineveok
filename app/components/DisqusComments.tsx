// app/components/DisqusComments.tsx
"use client";

import React, { useEffect } from 'react';

interface DisqusCommentsProps {
  url: string; // URL canônica da página
  identifier: string; // Identificador único da página (ex: movie-12345)
  title: string; // Título da página (para o Disqus)
}

export default function DisqusComments({ url, identifier, title }: DisqusCommentsProps) {
  useEffect(() => {
    // Define a configuração do Disqus
    (window as any).disqus_config = function () {
      this.page.url = url;
      this.page.identifier = identifier;
      this.page.title = title;
    };

    // Remove qualquer script Disqus existente para evitar duplicatas
    const existingScript = document.getElementById('disqus-embed-script');
    if (existingScript) {
      existingScript.remove();
    }
    const existingCountScript = document.getElementById('dsq-count-scr');
     if (existingCountScript) {
       // O script de contagem já existe (do layout), não precisa recarregar aqui
     }


    // Carrega o script de embed do Disqus
    const script = document.createElement('script');
    script.id = 'disqus-embed-script'; // Adiciona um ID para poder remover depois
    script.src = 'https://cineveo-lat.disqus.com/embed.js';
    script.setAttribute('data-timestamp', String(+new Date()));
    script.async = true;
    (document.head || document.body).appendChild(script);

    // Função de limpeza para remover o script quando o componente desmontar
    return () => {
      const scriptToRemove = document.getElementById('disqus-embed-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
      // Limpa a configuração global para a próxima página
      delete (window as any).disqus_config;
      // Reseta o Disqus se ele já tiver sido carregado na página
      if ((window as any).DISQUS) {
        (window as any).DISQUS.reset({
          reload: true
        });
      }
    };
  }, [url, identifier, title]); // Re-executa se a URL, ID ou título mudar

  return (
    <div className="comments-section" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
      <h3 className="comments-title">Comentários</h3>
      <div id="disqus_thread"></div>
      <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
    </div>
  );
}