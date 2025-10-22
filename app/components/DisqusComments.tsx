// cineveo-next/app/components/DisqusComments.tsx
"use client";

import React, { useEffect } from 'react';

interface DisqusCommentsProps {
  url: string; // URL canônica da página (será ignorada para page.url, mas útil para debug)
  identifier: string; // Identificador único da página (ex: movie-12345)
  title: string; // Título da página (para o Disqus)
}

export default function DisqusComments({ url, identifier, title }: DisqusCommentsProps) {
  useEffect(() => {
    // --- INÍCIO DA MODIFICAÇÃO ---
    // Pega a URL atual da janela do navegador
    const currentUrl = window.location.href;
    // Substitui o domínio .lat pelo .netlify.app
    const netlifyUrl = currentUrl.replace('cineveo.lat', 'cineveo.netlify.app');
    // --- FIM DA MODIFICAÇÃO ---

    // Define a configuração do Disqus
    (window as any).disqus_config = function () {
      // --- MODIFICAÇÃO AQUI: Usa a URL do Netlify ---
      this.page.url = netlifyUrl;
      // --- FIM DA MODIFICAÇÃO ---
      this.page.identifier = identifier;
      this.page.title = title;
      // Log para verificar qual URL está sendo enviada
      console.log('Disqus Config:', { url: this.page.url, identifier: this.page.identifier, title: this.page.title });
    };

    // Remove qualquer script Disqus existente para evitar duplicatas
    const existingScript = document.getElementById('disqus-embed-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Carrega o script de embed do Disqus
    const script = document.createElement('script');
    script.id = 'disqus-embed-script'; // Adiciona um ID para poder remover depois
    script.src = 'https://minorix.disqus.com/embed.js'; // ATUALIZADO AQUI
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

      // 5. Limpa variáveis globais (melhor prática)
      try {
        (window as any).disqus_config = undefined;
        (window as any).DISQUS = undefined;
        (window as any).DISQUS_RECOMMENDATIONS = undefined;
        (window as any).DISQUSWIDGETS = undefined;
      } catch (e) {
        console.warn("Não foi possível limpar as variáveis globais do Disqus:", e);
      }
    };
    // Re-executa se o identificador ou título mudar (a URL real não importa mais tanto aqui)
  }, [identifier, title]);

  return (
    <div className="comments-section" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
      <h3 className="comments-title">Comentários</h3>
      <div id="disqus_thread"></div>
      <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
    </div>
  );
}