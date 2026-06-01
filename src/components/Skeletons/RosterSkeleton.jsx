import React from 'react';
import { SkeletonLine, SkeletonCircle, SkeletonBar } from './SkeletonBox';

const CARD_COUNT = 6;

function PlayerCardSkeleton() {
  return (
    <div className="skeleton-card animated-fade" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <SkeletonLine width="140px" height={18} style={{ marginBottom: '6px' }} />
          <SkeletonLine width="90px" height={13} />
        </div>
        <SkeletonCircle size={35} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <SkeletonLine width="80px" height={22} style={{ borderRadius: '20px' }} />
        <SkeletonLine width="70px" height={22} style={{ borderRadius: '20px' }} />
        <SkeletonLine width="60px" height={22} style={{ borderRadius: '20px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBar width="100%" />
        <SkeletonBar width="85%" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <SkeletonLine width="80px" height={12} />
        <SkeletonLine width="90px" height={12} />
      </div>
    </div>
  );
}

export default function RosterSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <SkeletonLine width="200px" height={36} style={{ borderRadius: '8px' }} />
        <SkeletonLine width="140px" height={36} style={{ borderRadius: '8px' }} />
        <SkeletonLine width="100px" height={36} style={{ borderRadius: '8px' }} />
        <div style={{ flex: 1 }} />
        <SkeletonLine width="120px" height={36} style={{ borderRadius: '8px' }} />
      </div>
      <div className="grid-cards">
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
