import React from 'react';
import { SkeletonLine } from './SkeletonBox';

function LedgerRowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <SkeletonLine width="60px" height={14} />
      <div style={{ flex: 1 }}><SkeletonLine width="70%" height={14} /></div>
      <SkeletonLine width="80px" height={14} />
      <SkeletonLine width="24px" height={24} style={{ borderRadius: '6px' }} />
    </div>
  );
}

function CajaSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[1, 2, 3].map(i => (
          <div className="skeleton-card" key={i} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonLine width="50%" height={12} />
            <SkeletonLine width="70%" height={24} />
          </div>
        ))}
      </div>
      <SkeletonLine width="200px" height={36} style={{ borderRadius: '8px' }} />
      <div className="skeleton-card" style={{ padding: '14px' }}>
        <SkeletonLine width="120px" height={14} style={{ marginBottom: '8px' }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <LedgerRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="skeleton-card" key={i} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonLine width="60%" height={16} />
          <SkeletonLine width="40%" height={13} />
          <SkeletonLine width="80%" height={13} />
          <SkeletonLine width="100px" height={28} style={{ borderRadius: '6px', marginTop: '4px' }} />
        </div>
      ))}
    </div>
  );
}

export default function FinanzasSkeleton({ activeSubTab = 'finances' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px' }}>
        <SkeletonLine width="120px" height={36} style={{ borderRadius: '8px' }} />
        <SkeletonLine width="120px" height={36} style={{ borderRadius: '8px' }} />
      </div>
      <div className="animated-fade">
        {activeSubTab === 'finances' && <CajaSkeleton />}
        {activeSubTab === 'inventory' && <InventorySkeleton />}
      </div>
    </div>
  );
}
