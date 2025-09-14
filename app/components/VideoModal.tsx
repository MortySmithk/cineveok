// app/components/VideoModal.tsx
"use client";

import React from 'react';
import CineVEOPlayer from './CineVEOPlayer'; // Garante que está a importar o novo player

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
        <div className="w-full aspect-video bg-black">
            {src && <CineVEOPlayer src={src} />}
        </div>
      </div>
    </div>
  );
};

export default VideoModal;