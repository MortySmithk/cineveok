// app/components/DisqusComments.tsx
"use client";

import { useEffect } from 'react';

interface DisqusCommentsProps {
  url: string;
  identifier: string;
  title: string;
}

// Interface para a configuração do Disqus
interface IDisqusConfig {
  page: {
    url: string;
    identifier: string;
    title: string;
  };
}

// Atualiza a declaração global para o objeto `window`
declare global {
  interface Window {
    DISQUS: {
      reset: (options: { reload: boolean; config: (this: IDisqusConfig) => void }) => void;
    };
    disqus_config: (this: IDisqusConfig) => void;
  }
}

const DisqusComments = ({ url, identifier, title }: DisqusCommentsProps) => {
  useEffect(() => {
    // Função de configuração do Disqus
    const disqusConfigCallback = function (this: IDisqusConfig) {
      this.page.url = url;
      this.page.identifier = identifier;
      this.page.title = title;
    };

    // Lógica para carregar ou resetar o Disqus
    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: disqusConfigCallback,
      });
    } else {
      window.disqus_config = disqusConfigCallback;
      const d = document, s = d.createElement('script');
      
      // ATUALIZADO: URL do script com o novo shortname
      s.src = 'https://cineveo-1.disqus.com/embed.js';
      
      s.setAttribute('data-timestamp', String(+new Date()));
      (d.head || d.body).appendChild(s);
    }
  }, [url, identifier, title]);

  return (
    // O HTML de incorporação do Disqus que você forneceu
    <div className="comments-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
      <div id="disqus_thread"></div>
      <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
    </div>
  );
};

export default DisqusComments;