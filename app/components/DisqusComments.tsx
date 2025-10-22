// cineveo-next/app/components/DisqusComments.tsx
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

    // Carrega o script de embed do Disqus
    const script = document.createElement('script');
    script.id = 'disqus-embed-script'; // Adiciona um ID para poder remover depois
    script.src = 'https://cineveo-lat.disqus.com/embed.js';
    script.setAttribute('data-timestamp', String(+new Date()));
    script.async = true;
    (document.head || document.body).appendChild(script);

    // --- FUNÇÃO DE LIMPEZA ATUALIZADA ---
    return () => {
      // 1. Tenta resetar o Disqus
      if ((window as any).DISQUS) {
        try {
          (window as any).DISQUS.reset({
            reload: true
          });
        } catch (e) {
          console.error("Erro ao resetar o Disqus:", e);
        }
      }
      
      // 2. Remove o script de embed que injetamos
      const scriptToRemove = document.getElementById('disqus-embed-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }

      // 3. Remove o iframe do Disqus
      const disqusIframe = document.querySelector('iframe[id^="dsq-app"]');
      if (disqusIframe) {
        disqusIframe.remove();
      }
      
      // 4. Limpa o contêiner principal
      const disqusThread = document.getElementById('disqus_thread');
      if (disqusThread) {
        disqusThread.innerHTML = '';
      }

      // 5. ✅ CORREÇÃO: Em vez de 'delete', definimos como 'undefined' para evitar o erro.
      try {
        (window as any).disqus_config = undefined;
        (window as any).DISQUS = undefined;
        (window as any).DISQUS_RECOMMENDATIONS = undefined;
        (window as any).DISQUSWIDGETS = undefined; // Esta linha estava causando o erro
      } catch (e) {
        console.warn("Não foi possível limpar as variáveis globais do Disqus:", e);
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