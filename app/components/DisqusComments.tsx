// app/components/DisqusComments.tsx
"use client";

import React from 'react';
// ### CORREÇÃO AQUI ###
// O nome correto do componente é 'DiscussionEmbed', não 'Discussion'
import { DiscussionEmbed } from 'disqus-react';

interface DisqusCommentsProps {
  url: string;
  identifier: string;
  title: string;
}

// Este componente usa o shortname 'cineveo-2' que você forneceu.
const DisqusComments: React.FC<DisqusCommentsProps> = ({ url, identifier, title }) => {
  
  // Configura as variáveis da página para o Disqus saber qual
  // thread de comentários carregar
  const disqusConfig = {
    url: url,
    identifier: identifier,
    title: title,
  };

  return (
    <div className="comments-container">
      {/* O componente 'DiscussionEmbed' do pacote 'disqus-react'
        cuida de carregar o script de embed.js 
      */}
      {/* ### CORREÇÃO AQUI ### */}
      <DiscussionEmbed
        shortname="cineveo-2"
        config={disqusConfig}
      />
    </div>
  );
};

// ### A LINHA MAIS IMPORTANTE ###
// Garante que esta linha existe e está correta
export default DisqusComments;