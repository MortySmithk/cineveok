// app/components/icons/LikeIcon.tsx
import React from 'react';
import Image from 'next/image';

interface LikeIconProps {
  isActive: boolean;
  width?: number;
  height?: number;
}

const LikeIcon: React.FC<LikeIconProps> = ({ isActive, width = 24, height = 24 }) => {
  const src = isActive
    ? "https://i.ibb.co/pvdNBpjb/Gemini-Generated-Image-slk0hgslk0hgslk0-1.png"
    : "https://i.ibb.co/210x2546/Gemini-Generated-Image-uqjfysuqjfysuqjf-1.png";

  return (
    <Image
      src={src}
      alt="Like"
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default LikeIcon;