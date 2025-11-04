// app/components/HyvorTalkComments.tsx
"use client";

import React from 'react';
import Script from 'next/script';

interface HyvorTalkCommentsProps {
  pageId: string | null;
}

/* Declaração de tipo para informar ao TypeScript
  sobre o web component <hyvor-talk-comments>
*/
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hyvor-talk-comments': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'website-id': string;
        'page-id'?: string;
      };
    }
  }
}

const HyvorTalkComments: React.FC<HyvorTalkCommentsProps> = ({ pageId }) => {
  
  // Se não houver ID (ex: ainda carregando), não renderiza o componente
  if (!pageId) {
    return (
      <div className="comments-container" style={{ padding: '1rem', textAlign: 'center' }}>
        Carregando comentários...
      </div>
    );
  }

  return (
    <div className="comments-container">
      {/* 1. Carrega o script do Hyvor Talk.
        A estratégia 'lazyOnload' garante que ele carregue
        após o resto da página, sem bloquear.
      */}
      <Script 
        src="https://talk.hyvor.com/embed/embed.js" 
        type="module"
        strategy="lazyOnload"
      />

      {/* 2. Renderiza o web component do Hyvor Talk.
        O 'key={pageId}' é CRUCIAL. Ele força o React a
        remontar este componente quando o ID da página (ex: ao trocar de episódio)
        mudar, o que faz o Hyvor Talk carregar a thread correta.
      */}
      <hyvor-talk-comments
        key={pageId}
        website-id="14430"
        page-id={pageId}
      />
    </div>
  );
};

export default HyvorTalkComments;