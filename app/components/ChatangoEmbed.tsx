// app/components/ChatangoEmbed.tsx
"use client";

import React, { useEffect, useRef } from 'react';

export default function ChatangoEmbed() {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scriptAddedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && chatContainerRef.current && !scriptAddedRef.current) {
      const script = document.createElement('script');
      script.id = "cid0020000422085119731";
      script.src = "//st.chatango.com/js/gz/emb.js";
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.style.width = '100%';
      script.style.height = '100%';

      script.innerHTML = JSON.stringify({
        "handle": "cineveok",
        "arch": "js",
        "styles": {
          "a": "ffcc00", "b": 100, "c": "000000", "d": "000000", "k": "ffcc00",
          "l": "ffcc00", "m": "ffcc00", "p": "10", "q": "ffcc00", "r": 100,
          "cnrs": "0.35", "fwtickm": 1
        }
      });

      chatContainerRef.current.appendChild(script);
      scriptAddedRef.current = true;
    }
  }, []);

  return (
    <div className="chat-section" style={{ height: '500px', width: '100%', marginBottom: '2.5rem' }}>
      <h2
        className="section-title"
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--text-primary)' // Alterado para usar a variável CSS do tema
        }}
      >
        Chat do CineVEO
      </h2>
      <div
        ref={chatContainerRef}
        style={{
          width: '100%',
          height: 'calc(100% - 3.25rem)', // Altura ajustada
          border: '1px solid var(--border-color)', // Mantém a borda da caixa do chat conforme o tema
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        id="chatango-container"
      >
        {/* O script será adicionado aqui dinamicamente pelo useEffect */}
      </div>
    </div>
  );
}