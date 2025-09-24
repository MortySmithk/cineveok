"use client";
import React from 'react';

interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

const keyboardLayout = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
  'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
  'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', '0', ' '
];

export const OnScreenKeyboard = ({ onKeyPress, onBackspace, onClear }: OnScreenKeyboardProps) => {
  return (
    <div className="tv-keyboard-container">
      <div className="tv-keyboard-grid">
        {keyboardLayout.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="tv-key focusable"
            data-key={key === ' ' ? 'space' : key}
          >
            {key === ' ' ? 'espaço' : key}
          </button>
        ))}
      </div>
      <div className="tv-keyboard-actions">
        <button onClick={onBackspace} className="tv-key-action focusable">Apagar</button>
        <button onClick={onClear} className="tv-key-action focusable">Limpar tudo</button>
      </div>
    </div>
  );
};