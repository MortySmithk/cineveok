// app/components/VoiceSearchOverlay.tsx
"use client";

import React from 'react';
import MicrophoneIcon from './icons/MicrophoneIcon';

interface VoiceSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceSearchOverlay: React.FC<VoiceSearchOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="voice-search-overlay" onClick={onClose}>
      <div className="voice-search-content">
        <p className="voice-search-text">Ouvindo...</p>
        <div className="voice-search-mic-container">
          <div className="mic-pulse"></div>
          <MicrophoneIcon width={32} height={32} />
        </div>
        <button onClick={onClose} className="voice-search-close-btn">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default VoiceSearchOverlay;