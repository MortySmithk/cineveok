// app/components/icons/FlameIcon.tsx
import React from 'react';

const FlameIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10.5 5.5a5 5 0 1 1-5.5 5.5L4 20h16l-1.09-9.09A5.5 5.5 0 0 0 10.5 5.5z" />
    <path d="M15.5 8.5c.98-2.02 2.5-3.5 2.5-3.5s-2 1-3.5 3.5" />
  </svg>
);

export default FlameIcon;