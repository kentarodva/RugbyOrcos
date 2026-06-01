import React from 'react';
import { SkeletonLine, SkeletonBlock, SkeletonBar } from './SkeletonBox';

function EventCardSkeleton() {
  return (
    <div className="skeleton-card animated-fade" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonLine width="160px" height={16} />
        <SkeletonLine width="90px" height={14} />
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <SkeletonLine width="120px" height={13} />
        <SkeletonLine width="180px" height={13} />
      </div>
      <SkeletonBar width="40%" height={6} />
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

function FixtureSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <SkeletonLine width="160px" height={36} style={{ borderRadius: '8px' }} />
        <SkeletonLine width="160px" height={36} style={{ borderRadius: '8px' }} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="skeleton-card animated-fade" key={i} style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SkeletonLine width="120px" height={14} />
          <SkeletonLine width="80px" height={28} style={{ borderRadius: '6px' }} />
          <SkeletonLine width="120px" height={14} />
        </div>
      ))}
    </div>
  );
}

function FutureSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="skeleton-card animated-fade" key={i} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonLine width="180px" height={16} />
          <SkeletonLine width="140px" height={13} />
          <SkeletonLine width="200px" height={13} />
        </div>
      ))}
    </div>
  );
}

export default function CalendarioSkeleton({ activeTab = 'agenda' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', padding: '10px 15px', overflowX: 'auto' }}>
        {['agenda', 'fixture', 'proximos', 'rivales'].map(tab => (
          <SkeletonLine
            key={tab}
            width={tab === activeTab ? '110px' : '90px'}
            height={36}
            style={{ borderRadius: '8px' }}
          />
        ))}
      </div>
      <div className="animated-fade">
        {activeTab === 'agenda' && <AgendaSkeleton />}
        {activeTab === 'fixture' && <FixtureSkeleton />}
        {activeTab === 'proximos' && <FutureSkeleton />}
        {activeTab === 'rivales' && <SkeletonBlock height={200} />}
      </div>
    </div>
  );
}
