import React from 'react';

interface PrismLogoProps {
  className?: string;
  size?: number;
}

export const PrismLogo: React.FC<PrismLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      aria-label="Axiom Prism Logo"
    >
      <defs>
        {/* Prism Face Gradients */}
        <linearGradient id="prism-front" x1="24" y1="6" x2="10" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#2563EB" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1E293B" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="prism-side" x1="24" y1="6" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#60A5FA" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="prism-bottom" x1="10" y1="38" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
        </linearGradient>

        {/* Reflected Beam Rays */}
        <linearGradient id="beam-in" x1="2" y1="18" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>

        <linearGradient id="reflect-red" x1="27" y1="24" x2="46" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="reflect-amber" x1="27" y1="24" x2="46" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="reflect-cyan" x1="27" y1="24" x2="46" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="reflect-blue" x1="27" y1="24" x2="46" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Incident Light Beam entering left face */}
      <line
        x1="3"
        y1="18"
        x2="20"
        y2="24"
        stroke="url(#beam-in)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="24" r="1.5" fill="#FFFFFF" />

      {/* Internal Reflection Ray inside prism */}
      <line
        x1="20"
        y1="24"
        x2="27"
        y2="24"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeDasharray="1.5 1.5"
        strokeOpacity="0.9"
      />
      <circle cx="27" cy="24" r="1.5" fill="#FFFFFF" />

      {/* Reflected & Dispersed Spectrum Rays emerging from right face */}
      <line
        x1="27"
        y1="24"
        x2="45"
        y2="20"
        stroke="url(#reflect-red)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="27"
        y1="24"
        x2="46"
        y2="25"
        stroke="url(#reflect-amber)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="27"
        y1="24"
        x2="46"
        y2="30"
        stroke="url(#reflect-cyan)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="27"
        y1="24"
        x2="45"
        y2="35"
        stroke="url(#reflect-blue)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* 3D Triangular Prism Facets */}
      {/* Front Left Facet */}
      <polygon
        points="24,6 10,38 24,36"
        fill="url(#prism-front)"
        stroke="#38BDF8"
        strokeWidth="1"
        strokeLinejoin="round"
        fillOpacity="0.88"
      />

      {/* Front Right Facet */}
      <polygon
        points="24,6 24,36 38,38"
        fill="url(#prism-side)"
        stroke="#93C5FD"
        strokeWidth="1"
        strokeLinejoin="round"
        fillOpacity="0.85"
      />

      {/* Bottom Facet */}
      <polygon
        points="10,38 24,36 38,38"
        fill="url(#prism-bottom)"
        stroke="#1E3A8A"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Specular Ridge Highlight */}
      <line
        x1="24"
        y1="6"
        x2="24"
        y2="36"
        stroke="#E0F2FE"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.95"
      />

      {/* Vertex Glint / Sparkle */}
      <circle cx="24" cy="6" r="2" fill="#FFFFFF" />
    </svg>
  );
};
