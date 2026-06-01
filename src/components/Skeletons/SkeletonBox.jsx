import React from 'react';

export function SkeletonLine({ width = '100%', height = 14, style, className = '' }) {
  return (
    <div
      className={`skeleton-line ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

export function SkeletonCircle({ size = 35, style, className = '' }) {
  return (
    <div
      className={`skeleton-circle ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}

export function SkeletonBar({ width = '100%', height = 8, style, className = '' }) {
  return (
    <div
      className={`skeleton-bar ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

export function SkeletonBlock({ width = '100%', height = 100, style, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
    />
  );
}
