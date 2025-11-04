// cineveo-next/app/components/WelcomeModal.tsx
"use client";

import React from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleOkClick = () => {
    // Abre o link do Telegram em uma nova aba
    window.open("https://t.me/+E3IHA7NKOtA4MWMx", "_blank");
    // Fecha o modal
    onClose();
  };

  // Impede que o clique no conteúdo feche o modal
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="welcome-modal-overlay" onClick={onClose}>
      <div className="welcome-modal-content" onClick={handleModalContentClick}>
        <h2>Participe do nosso Telegram!</h2>
        <p>
          Esse é o nosso principal meio de contato com você. Participe
          do nosso <strong className="text-white">Grupo</strong> para não perder nenhum aviso! {/* <-- MUDANÇA AQUI */}
        </p>
        <button onClick={handleOkClick} className="welcome-modal-btn">
          OK
        </button>
      </div>
    </div>
  );
}