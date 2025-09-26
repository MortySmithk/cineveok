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

  const iframeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none'
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
        
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          {src ? (
            <iframe
              src={src}
              style={iframeStyle}
              allow="autoplay; encrypted-media"
              allowFullScreen
              // --- CORREÇÃO AQUI ---
              // Alterado de "no-referrer" para "origin-when-cross-origin" para permitir que o player funcione
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