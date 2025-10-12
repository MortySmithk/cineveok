// app/components/DisqusComments.tsx
"use client";

import { useEffect } from 'react';

interface DisqusCommentsProps {
  url: string;
  identifier: string;
  title: string;
}

// 1. Crie uma interface para a configuração do Disqus
interface IDisqusConfig {
  page: {
    url: string;
    identifier: string;
    title: string;
  };
}

// 2. Atualize a declaração global para usar a nova interface
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
    // 3. Crie uma função de callback e defina o tipo do 'this'
    const disqusConfigCallback = function (this: IDisqusConfig) {
      this.page.url = url;
      this.page.identifier = identifier;
      this.page.title = title;
    };

    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: disqusConfigCallback, // Use a função de callback
      });
    } else {
      window.disqus_config = disqusConfigCallback; // Use a função de callback
      const d = document, s = d.createElement('script');
      s.src = 'https://cineveo.disqus.com/embed.js';
      s.setAttribute('data-timestamp', String(+new Date()));
      (d.head || d.body).appendChild(s);
    }
  }, [url, identifier, title]);

  return (
    <div className="comments-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
      <div id="disqus_thread"></div>
      <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
    </div>
  );
};

export default DisqusComments;