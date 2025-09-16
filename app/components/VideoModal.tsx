// app/components/VideoModal.tsx
"use client";

import React from 'react';

interface VideoModalProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ src, isOpen, onClose, title }) => {
  if (!isOpen) {
    return null;
  }

  // Estilos para o iframe, convertidos para objeto React
  const iframeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none' // Adicionado para garantir que não haja bordas
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        {/* Estrutura de aspect-ratio que você forneceu */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          {src ? (
            <iframe
              src={src}
              style={iframeStyle}
              allow="autoplay; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer" // Essencial para o player carregar
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