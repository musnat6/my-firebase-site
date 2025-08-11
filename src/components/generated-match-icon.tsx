
'use client';

import * as React from 'react';

interface GeneratedMatchIconProps extends React.SVGProps<SVGSVGElement> {
  seed: string;
}

const colors = [
  '#4285F4', // Saturated Blue
  '#FFCA28', // Yellow-Orange
  '#34A853', // Green
  '#EA4335', // Red
  '#7C4DFF', // Purple
  '#03A9F4', // Light Blue
  '#FF7043', // Orange
  '#EC407A', // Pink
];

// Simple hash function to get a number from a string
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export const GeneratedMatchIcon: React.FC<GeneratedMatchIconProps> = ({ seed, className, ...props }) => {
  const hash = simpleHash(seed);

  const bgColor = colors[hash % colors.length];
  const shapeColor = colors[(hash + 3) % colors.length];

  const shapes = [
    // Two rectangles
    <React.Fragment key="rects">
      <rect x="15" y="30" width="70" height="15" fill={shapeColor} rx="5" transform={`rotate(${hash % 30} 50 50)`} />
      <rect x="30" y="55" width="70" height="15" fill={shapeColor} rx="5" transform={`rotate(${(hash + 45) % 60} 50 50)`} />
    </React.Fragment>,
    // Circle and line
    <React.Fragment key="circle-line">
      <circle cx="60" cy="40" r="25" fill="none" stroke={shapeColor} strokeWidth="8" />
      <path d="M20 70 L50 20" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" />
    </React.Fragment>,
    // Triangle
    <React.Fragment key="triangle">
        <path d="M50 15 L85 80 L15 80 Z" fill={shapeColor} />
    </React.Fragment>,
     // Intersecting circles
     <React.Fragment key="circles-intersect">
        <circle cx="40" cy="50" r="30" fill={shapeColor} opacity="0.8" />
        <circle cx="60" cy="50" r="30" fill={shapeColor} opacity="0.8" />
    </React.Fragment>,
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="100" height="100" rx="20" fill={bgColor} />
      {shapes[hash % shapes.length]}
    </svg>
  );
};
