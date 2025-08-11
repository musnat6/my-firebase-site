
'use client';

// This file is no longer used for user profile pictures but is kept for generating match icons.
import * as React from 'react';

const colors = [
  '#4285F4', '#FFCA28', '#34A853', '#EA4335',
  '#7C4DFF', '#03A9F4', '#FF7043', '#EC407A',
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const GeneratedIcon: React.FC<{ seed: string }> = ({ seed }) => {
  const hash = simpleHash(seed);
  const bgColor = colors[hash % colors.length];
  const shapeColor = colors[(hash + 3) % colors.length];

  const shapes = [
    <React.Fragment key="rects">
      <rect x="15" y="30" width="70" height="15" fill={shapeColor} rx="5" transform={`rotate(${hash % 30} 50 50)`} />
      <rect x="30" y="55" width="70" height="15" fill={shapeColor} rx="5" transform={`rotate(${(hash + 45) % 60} 50 50)`} />
    </React.Fragment>,
    <React.Fragment key="circle-line">
      <circle cx="60" cy="40" r="25" fill="none" stroke={shapeColor} strokeWidth="8" />
      <path d="M20 70 L50 20" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" />
    </React.Fragment>,
    <React.Fragment key="triangle">
      <path d="M50 15 L85 80 L15 80 Z" fill={shapeColor} />
    </React.Fragment>,
    <React.Fragment key="circles-intersect">
      <circle cx="40" cy="50" r="30" fill={shapeColor} opacity="0.8" />
      <circle cx="60" cy="50" r="30" fill={shapeColor} opacity="0.8" />
    </React.Fragment>,
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
    >
      <rect width="100" height="100" rx="20" fill={bgColor} />
      {shapes[hash % shapes.length]}
    </svg>
  );
};
