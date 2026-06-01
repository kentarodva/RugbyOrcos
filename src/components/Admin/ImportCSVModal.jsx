import React, { useCallback, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { parseCSV } from '../../utils/csvImport.js';

function ImportCSVModal({ onClose, onImport, makgoraTeams }) {
  const [preview, setPreview] = useState(null);
  const [skippedWarnings, setSkippedWarnings] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    setError(null);
    setSkippedWarnings(null);
    if (!file || !file.name.endsWith('.csv')) {
      setError('Solo archivos .csv');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const { players, skipped } = parseCSV(text, makgoraTeams);
        if (players.length === 0) {
          setError('No se encontraron jugadores válidos en el CSV');
          return;
        }
        if (skipped.length > 0) setSkippedWarnings(skipped);
        setPreview(players);
      } catch (err) {
        setError('Error al parsear el archivo: ' + err.message);
      }
    };
    reader.readAsText(file);
  }, [makgoraTeams]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      await onImport(preview);
      onClose();
    } catch (err) {
      setError('Error al importar: ' + err.message);
      setImporting(false);
    }
  };

  const countByCategory = preview ? preview.reduce((acc, p) => {
    acc[p.team_category] = (acc[p.team_category] || 0) + 1;
    return acc;
  }, {}) : {};

  const stats = useMemo(() => {
    if (!preview || preview.length === 0) return null;
    const ages = preview.map(p => p.age).filter(Boolean);
    const weights = preview.map(p => p.weight_kg).filter(Boolean);
    const heights = preview.map(p => p.height_m).filter(Boolean);
    const fractures = preview.filter(p => p.had_fractures).length;
    const allergies = preview.filter(p => p.allergies).length;
    const noEps = preview.filter(p => !p.health_insurance).length;
    const teamCount = {};
    for (const p of preview) {
      if (p.makgora_team_id) {
        const name = makgoraTeams?.find(t => t.id === p.makgora_team_id)?.rpg_name;
        if (name) teamCount[name] = (teamCount[name] || 0) + 1;
      }
    }
    const avg = (arr) => arr.length > 0 ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '-';
    return { total: preview.length, avgAge: avg(ages), avgWeight: avg(weights), avgHeight: avg(heights), fractures, fracturesPct: preview.length > 0 ? ((fractures / preview.length) * 100).toFixed(0) : '0', allergies, noEps, teamCount };
  }, [preview, makgoraTeams]);

  return (
    <motion.div className="modal-overlay" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.div className="modal-content glass-panel" style={{ maxWidth: '900px', width: '95%' }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}>
        <h3 className="neon-text-primary" style={{ marginBottom: '16px', fontFamily: 'Outfit' }}>
          Importar Jugadores desde CSV
        </h3>

        {!preview ? (
          <div
            onClick={handleClick}
            style={{
              border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--bg-light)' : 'transparent',
              transition: 'all 0.2s',
              marginBottom: '16px',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              {dragOver ? 'Suelta el archivo aquí' : 'Arrastra un archivo .csv aquí o haz clic para seleccionar'}
            </p>
            <input ref={inputRef} type="file" accept=".csv" onChange={handleInputChange} hidden />
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            {stats && (
              <div style={{
                background: 'var(--bg-dark)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '10px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px 16px',
                fontSize: '0.78rem',
              }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>📊 {stats.total} jugadores</span>
                <span style={{ color: 'var(--text-secondary)' }}>Ø Edad: <b style={{ color: 'var(--text-primary)' }}>{stats.avgAge}</b></span>
                <span style={{ color: 'var(--text-secondary)' }}>Ø Peso: <b style={{ color: 'var(--text-primary)' }}>{stats.avgWeight}kg</b></span>
                <span style={{ color: 'var(--text-secondary)' }}>Ø Altura: <b style={{ color: 'var(--text-primary)' }}>{stats.avgHeight}m</b></span>
                <span style={{ color: 'var(--color-red)' }}>⚠️ Fracturas: <b>{stats.fractures}</b> ({stats.fracturesPct}%)</span>
                {stats.allergies > 0 && <span style={{ color: 'var(--color-gold)' }}>🤧 Alergias: <b>{stats.allergies}</b></span>}
                {stats.noEps > 0 && <span style={{ color: 'var(--color-orange)' }}>🏥 Sin EPS: <b>{stats.noEps}</b></span>}
                {Object.keys(stats.teamCount).length > 0 && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    🏟️ Equipos: {Object.entries(stats.teamCount).map(([name, count]) => `${name} ${count}`).join(' · ')}
                  </span>
                )}
              </div>
            )}
            {skippedWarnings?.length > 0 && (
              <div style={{
                background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', fontSize: '0.78rem',
              }}>
                <span style={{ color: '#ffd740', fontWeight: 700 }}>⚠️ Filas omitidas ({skippedWarnings.length})</span>
                {skippedWarnings.map((s, i) => (
                  <div key={i} style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {s.name}: {s.reason === 'datos_incompletos' ? 'Datos incompletos (nombre o documento faltante)' :
                      s.reason === 'sin_categoria' ? 'Categoría no reconocida' :
                      s.reason === 'duplicado_documento' ? 'Duplicado por documento' :
                      s.reason === 'duplicado_nombre' ? 'Duplicado por nombre y fecha de nacimiento' : s.reason}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              {Object.entries(countByCategory).map(([cat, count]) => (
                <span key={cat} style={{
                  display: 'inline-block',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  margin: '2px 4px 2px 0',
                }}>
                  {cat.replace('orcos_', '')}: {count}
                </span>
              ))}
            </div>

            <div style={{
              maxHeight: '300px',
              overflow: 'auto',
              background: 'var(--bg-dark)',
              borderRadius: 'var(--radius-md)',
            }}>
              <table style={{ fontSize: '0.7rem', borderCollapse: 'collapse', minWidth: '1100px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-dark)', zIndex: 1 }}>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>#</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Nombre</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Tipo Doc</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Documento</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Categoría</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Equipo Mak'Gora</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Edad</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Peso</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Altura</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Teléfono</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>EPS</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Contacto</th>
                    <th style={{ padding: '5px 6px', textAlign: 'left', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Tel Contacto</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < preview.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <td style={{ padding: '3px 6px', color: 'var(--text-muted)', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{p.first_name} {p.last_name}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)' }}>{p.document_type || '-'}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.document_number}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.team_category?.replace('orcos_', '')}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {makgoraTeams?.find(t => t.id === p.makgora_team_id)?.rpg_name || '-'}
                      </td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', textAlign: 'center' }}>{p.age || '-'}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', textAlign: 'center' }}>{p.weight_kg ? p.weight_kg + 'kg' : '-'}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', textAlign: 'center' }}>{p.height_m ? p.height_m + 'm' : '-'}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.phone || '-'}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.health_insurance || ''}>{p.health_insurance || '-'}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.emergency_contact_name || '-'}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.emergency_contact_phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: '#ff5252', fontSize: '0.85rem', margin: '0 0 12px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn-outline" disabled={importing}>
            Cancelar
          </button>
          {preview && (
            <button type="button" onClick={handleImport} className="btn-neon" disabled={importing}>
              {importing ? 'Importando...' : `Importar ${preview.length} jugadores`}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ImportCSVModal;
