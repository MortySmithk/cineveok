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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        {/* O wrapper <div> foi removido e o estilo aplicado diretamente no iframe */}
        {src ? (
          <iframe
            src={src}
            width="100%"
            style={{ aspectRatio: '16 / 9', border: 'none' }} // Estilo que você pediu
            allow="autoplay; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer" // Essencial para o player carregar
            title="CineVEO Player"
          ></iframe>
        ) : (
          // Placeholder de carregamento que também respeita a proporção
          <div style={{ aspectRatio: '16 / 9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
            Carregando stream...
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;
