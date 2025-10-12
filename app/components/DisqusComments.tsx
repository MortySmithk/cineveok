// app/components/DisqusComments.tsx
"use client";

import { useEffect } from 'react';

interface DisqusCommentsProps {
  url: string;
  identifier: string;
  title: string;
}

// Adiciona tipos para o objeto window do Disqus para evitar erros de TypeScript
declare global {
  interface Window {
    DISQUS: any;
    disqus_config: () => void;
  }
}

const DisqusComments = ({ url, identifier, title }: DisqusCommentsProps) => {
  useEffect(() => {
    // Função de configuração do Disqus
    window.disqus_config = function () {
      this.page.url = url;
      this.page.identifier = identifier;
      this.page.title = title;
    };

    // Se o Disqus já foi carregado (ex: ao trocar de episódio),
    // apenas resetamos com a nova configuração.
    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: window.disqus_config,
      });
    } else {
      // Se for o primeiro carregamento, cria e adiciona o script do Disqus.
      const d = document, s = d.createElement('script');
      s.src = 'https://cineveo.disqus.com/embed.js';
      s.setAttribute('data-timestamp', String(+new Date()));
      (d.head || d.body).appendChild(s);
    }
  }, [url, identifier, title]); // Roda o efeito sempre que a URL, ID ou título mudar

  return (
    <div className="comments-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
      <div id="disqus_thread"></div>
      <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
    </div>
  );
};

export default DisqusComments;