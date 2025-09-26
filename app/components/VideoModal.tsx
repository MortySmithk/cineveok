// cineveo-next/app/components/VideoModal.tsx
"use client";

import React, { useRef } from 'react';

interface VideoModalProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ src, isOpen, onClose, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) {
    return null;
  }

  // --- CORREÇÃO AQUI ---
  // Esta função agora limpa a fonte do iframe antes de chamar a função de fechar,
  // garantindo que o áudio pare imediatamente.
  const handleClose = () => {
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank'; // Limpa a URL para parar a reprodução
    }
    onClose(); // Chama a função original para fechar o modal
  };

  const iframeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none'
  };

  return (
    // O evento onClick agora chama nossa nova função handleClose
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          {/* O botão de fechar também chama a nova função handleClose */}
          <button className="modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          {src ? (
            <iframe
              ref={iframeRef} // Adiciona a referência ao iframe
              src={src}
              style={iframeStyle}
              allow="autoplay; encrypted-media"
              allowFullScreen
              referrerPolicy="origin-when-cross-origin" 
              title="CineVEO Player"
            ></iframe>
          ) : (
            <div style={iframeStyle}>
              <div style={{ width: '100%', height: '100%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                Carregando stream...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoModal;