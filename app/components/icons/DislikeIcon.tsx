// app/components/icons/DislikeIcon.tsx
import React from 'react';
import Image from 'next/image';

interface DislikeIconProps {
  isActive: boolean;
  width?: number;
  height?: number;
}

const DislikeIcon: React.FC<DislikeIconProps> = ({ isActive, width = 24, height = 24 }) => {
  const src = isActive
    ? "https://i.ibb.co/qF4H1Mkv/Gemini-Generated-Image-slk0hgslk0hgslk0-1.png"
    : "https://i.ibb.co/kgDvQpLX/Gemini-Generated-Image-uqjfysuqjfysuqjf-1.png";

  return (
    <Image
      src={src}
      alt="Dislike"
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
      unoptimized // Adicionado para garantir que as imagens externas carreguem sem configuração extra
    />
  );
};

export default DislikeIcon;