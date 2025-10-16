// app/components/DisqusComments.tsx
'use client';
import { DiscussionEmbed } from 'disqus-react';
import { useEffect, useState } from 'react';

const DisqusComments = ({ type, slug, title }) => {
  const [pageUrl, setPageUrl] = useState('');

  // Este código roda apenas no navegador do usuário para pegar a URL correta
  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const disqusShortname = 'cineveo';
  const disqusConfig = {
    url: pageUrl, // Agora usa a URL dinâmica (ex: https://cineveo.lat/...)
    identifier: `${type}-${slug}`,
    title: title,
  };

  // Evita renderizar o componente antes de ter a URL correta, prevenindo erros
  if (!pageUrl) {
    return (
      <div className="mt-8 text-center text-zinc-400">
        Carregando comentários...
      </div>
    );
  }

  return (
    <div className="mt-8">
      <DiscussionEmbed shortname={disqusShortname} config={disqusConfig} />
    </div>
  );
};

export default DisqusComments;