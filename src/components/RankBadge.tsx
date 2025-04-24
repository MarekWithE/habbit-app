import React from 'react';
import './RankBadge.css';

export default function RankBadge({
  rank,
  variant = 'small'   // 'small' (15×15), 'medium' (23×23), 'large' (28×28)
}: {
  rank: string;
  variant?: 'small' | 'medium' | 'large';
}) {
  const sizeMap = {
    small:  { w: 15, h: 15 },
    medium: { w: 23, h: 23 },
    large:  { w: 28, h: 28 }
  };
  const { w, h } = sizeMap[variant];

  const src      = `/ranks/${rank}.png`;
  const fallback = `/ranks/default.png`;

  return (
    <div className={`rank-badge rank-badge--${variant}`}>
      <img
        src={src}
        width={w}
        height={h}
        alt={`${rank} rank icon`}
        onError={e => { e.currentTarget.src = fallback }}
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
} 