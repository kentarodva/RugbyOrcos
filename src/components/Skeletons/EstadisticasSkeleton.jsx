import React from 'react';
import { SkeletonLine, SkeletonBlock } from './SkeletonBox';

function KpiCardSkeleton() {
  return (
    <div className="skeleton-card animated-fade" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <SkeletonLine width="42px" height={42} style={{ borderRadius: '10px' }} />
      <div style={{ flex: 1 }}>
        <SkeletonLine width="60%" height={22} style={{ marginBottom: '4px' }} />
        <SkeletonLine width="80%" height={13} />
      </div>
    </div>
  );
}

function ChartSkeleton({ height = 200 }) {
  return (
    <div className="skeleton-card" style={{ padding: '16px' }}>
      <SkeletonLine width="180px" height={16} style={{ marginBottom: '12px' }} />
      <SkeletonBlock height={height} />
    </div>
  );
}

function TabContentSkeleton() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}>
        <ChartSkeleton height={180} />
      </div>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}>
        <ChartSkeleton height={180} />
      </div>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}>
        <ChartSkeleton height={180} />
      </div>
      <div style={{ flex: '1 1 280px', minWidth: 200 }}>
        <ChartSkeleton height={180} />
      </div>
      <div style={{ flex: '1 1 100%' }}>
        <ChartSkeleton height={120} />
      </div>
    </div>
  );
}

export default function EstadisticasSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="skeleton-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonLine width="220px" height={18} />
        <SkeletonLine width="120px" height={14} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {[1, 2, 3, 4].map(i => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="skeleton-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLine key={i} width={i < 3 ? '100px' : '80px'} height={28} style={{ borderRadius: '6px' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '14px', padding: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
          {['demografia', 'fisico', 'salud', 'cobertura', 'equipos'].map(tab => (
            <div key={tab} style={{ flex: 1 }}>
              <SkeletonLine width="100%" height={32} style={{ borderRadius: '8px' }} />
            </div>
          ))}
        </div>
        <TabContentSkeleton />
      </div>
    </div>
  );
}
