// cineveo-next/app/components/AudioVisualizer.tsx
"use client";
import React from 'react';

// Este componente renderiza as barras animadas do visualizador.
const AudioVisualizer = () => {
  const barStyle = (delay: string): React.CSSProperties => ({
    animationDelay: delay,
  });

  return (
    <div className="audio-visualizer">
      <div className="visualizer-bar" style={barStyle('0s')}></div>
      <div className="visualizer-bar" style={barStyle('-1.0s')}></div>
      <div className="visualizer-bar" style={barStyle('-0.5s')}></div>
      <div className="visualizer-bar" style={barStyle('-0.8s')}></div>
    </div>
  );
};

export default AudioVisualizer;