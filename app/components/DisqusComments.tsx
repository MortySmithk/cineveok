// app/components/DisqusComments.tsx
'use client';
import { DiscussionEmbed } from 'disqus-react';
import { useEffect, useState } from 'react';

// Define a interface para as propriedades do componente
interface DisqusCommentsProps {
  type: string;
  slug: string;
  title: string;
}

const DisqusComments = ({ type, slug, title }: DisqusCommentsProps) => {
  const [pageUrl, setPageUrl] = useState('');
  const identifier = `${type}-${slug}`;

  // Roda no cliente para pegar a URL da janela do navegador
  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  // Não renderiza nada até ter a URL, para evitar o erro do Disqus
  if (!pageUrl) {
    return (
      <div className="mt-8 text-center text-zinc-400">
        Carregando comentários...
      </div>
    );
  }

  const disqusConfig = {
    url: pageUrl,
    identifier: identifier,
    title: title,
  };

  return (
    <div className="mt-8">
      {/* A prop 'key' força o componente a reiniciar com a configuração correta,
          resolvendo o problema de "nova versão da página" do Disqus. */}
      <DiscussionEmbed
        key={identifier}
        shortname='cineveo-1' // CORREÇÃO AQUI
        config={disqusConfig}
      />
    </div>
  );
};

export default DisqusComments;