import React from 'react';

export const LightFrameIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="8" fill="#facc15" />
    <circle cx="12" cy="12" r="4" fill="#fffde4" />
  </svg>
);

export const DarkFrameIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="8" fill="#1e293b" />
    <path d="M16 12a4 4 0 1 1-8 0" fill="#64748b" />
  </svg>
);

export const FlatFrameIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="4" y="8" width="16" height="8" rx="2" fill="#a5b4fc" />
    <rect x="6" y="10" width="12" height="4" rx="1" fill="#e0e7ff" />
  </svg>
);

export const BiasFrameIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polygon points="12,2 15,22 9,22" fill="#f472b6" />
    <polyline points="12,6 12,14" stroke="#fff" strokeWidth="2" />
  </svg>
); 