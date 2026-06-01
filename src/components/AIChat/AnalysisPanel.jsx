import React from 'react';

export function AnalysisPanel({ showAnalysis, analyzingMatch, analysisResult, onClose }) {
  if (!showAnalysis) return null;

  return (
    <div className="glass-panel animated-slide" style={{
      padding: '20px',
      borderLeft: '4px solid var(--color-gold)',
      position: 'relative'
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
          cursor: 'pointer', fontSize: '1rem'
        }}
      >
        X
      </button>
      {analyzingMatch ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <span style={{ fontSize: '2rem' }}>?</span>
          <p style={{ marginTop: '10px', color: 'var(--color-text-muted)' }}>Analizando ultimo partido con IA...</p>
        </div>
      ) : analysisResult ? (
        analysisResult.error ? (
          <p style={{ color: 'var(--color-red)', fontSize: '0.85rem' }}>{analysisResult.error}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold)' }}>
              ?? Analisis: {analysisResult.fixture.opponent} ({analysisResult.fixture.score})
            </h3>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
              <strong>Resumen:</strong> {analysisResult.resumen}
            </div>
            {analysisResult.puntosFuertes.length > 0 && (
              <div>
                <strong style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>? Puntos Fuertes:</strong>
                <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {analysisResult.puntosFuertes.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {analysisResult.areasMejora.length > 0 && (
              <div>
                <strong style={{ color: 'var(--color-red)', fontSize: '0.8rem' }}>?? Areas de Mejora:</strong>
                <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {analysisResult.areasMejora.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            {analysisResult.recomendacionTactica && (
              <div style={{
                background: 'rgba(0, 230, 118, 0.05)',
                border: '1px solid rgba(0, 230, 118, 0.15)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem'
              }}>
                <strong style={{ color: 'var(--color-primary)' }}>?? Recomendacion Tactica:</strong>
                <p style={{ marginTop: '4px', color: 'var(--color-text)' }}>{analysisResult.recomendacionTactica}</p>
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
