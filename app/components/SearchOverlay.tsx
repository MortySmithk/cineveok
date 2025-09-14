// app/components/SearchOverlay.tsx
"use client";

import React from 'react';
import SearchComponent from './SearchComponent';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-overlay-header">
        <button onClick={onClose} className="search-overlay-back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
        </button>
        <div className="search-overlay-input-wrapper">
          <SearchComponent isMobile={true} onSearch={onClose} />
        </div>
      </div>
      <div className="search-overlay-content">
        {/* O conteúdo do histórico e sugestões será mostrado pelo próprio SearchComponent */}
      </div>
    </div>
  );
};

export default SearchOverlay;