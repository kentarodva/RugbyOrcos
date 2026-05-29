import React, { useContext, useState } from 'react';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';

function Rivales() {
  const { rivals, addRival, updateRival, deleteRival, activeTeam, players } = useContext(ClubContext);
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingRival, setEditingRival] = useState(null);
  const [name, setName] = useState('');
  const [colors, setColors] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  const teamPlayers = players.filter(p => p.teamCategory === activeTeam);

  const resetForm = () => {
    setName('');
    setColors('');
    setContact('');
    setNotes('');
    setEditingRival(null);
    setShowForm(false);
  };

  const handleEdit = (rival) => {
    setEditingRival(rival);
    setName(rival.name);
    setColors(rival.colors || '');
    setContact(rival.contact || '');
    setNotes(rival.notes || '');
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('El nombre del equipo rival es obligatorio.', 'warning');
      return;
    }
    if (editingRival) {
      updateRival({ ...editingRival, name, colors, contact, notes });
      showToast('Equipo rival actualizado.', 'success');
    } else {
      addRival({ name, colors, contact, notes });
      showToast('Equipo rival registrado.', 'success');
    }
    resetForm();
  };

  const generateWhatsAppRivalLink = (rival) => {
    let text = `🏉 *FICHA DE RIVAL - RUGBY ORCOS NEGROS* 🏉\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🛡️ *Equipo:* ${rival.name}\n`;
    if (rival.colors) text += `🎨 *Colores:* ${rival.colors}\n`;
    if (rival.contact) text += `📞 *Contacto:* ${rival.contact}\n`;
    if (rival.notes) text += `📝 *Notas:* ${rival.notes}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👹 #RugbyOrcosNegros`;

    navigator.clipboard.writeText(text);
    showToast('Ficha del rival copiada. Abriendo WhatsApp...', 'success');
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const generateArbitroSheet = () => {
    const today = new Date().toLocaleDateString('es-ES');
    const teamLabel = activeTeam.replace(/_/g, ' ').toUpperCase();
    const jueces = players.filter(p => p.systemRole === 'arbitro' && p.teamCategory === activeTeam);

    let text = `🏉 *PLANILLA DE ÁRBITRO - RUGBY ORCOS NEGROS* 🏉\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📅 *Fecha:* ${today}\n`;
    text += `👥 *Equipo:* ${teamLabel}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `\n📋 *ROSTER DE JUGADORES:*\n`;
    
    teamPlayers.slice(0, 23).forEach((p, i) => {
      text += `${i + 1}. #${p.camiseta} ${p.name} "${p.apodo}" - ${p.posicion}\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (jueces.length > 0) {
      text += `👨‍⚖️ *ÁRBITROS:* ${jueces.map(j => j.name).join(', ')}\n`;
    }
    text += `⏱️ *Cronómetro:* 40 min x 2 tiempos\n`;
    text += `📝 *Marcador:* __ - __\n`;
    text += `\n👹 #RugbyOrcosNegros`;

    navigator.clipboard.writeText(text);
    showToast('Planilla copiada. Abriendo WhatsApp...', 'success');
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const printArbitroSheet = () => {
    const teamLabel = activeTeam.replace(/_/g, ' ').toUpperCase();
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Planilla de Arbitro - Rugby Orcos Negros</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; max-width: 700px; margin: 0 auto; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; }
            .header div { flex: 1; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #333; color: #fff; padding: 8px 6px; text-align: left; font-size: 11px; }
            td { padding: 7px 6px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .score-section { margin: 20px 0; padding: 15px; border: 2px solid #333; text-align: center; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .signature { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 12px; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <h1>PLANILLA DE ÁRBITRO</h1>
          <h2>Rugby Orcos Negros - ${teamLabel}</h2>
          <div class="header">
            <div><strong>Fecha:</strong> ${today}</div>
            <div><strong>Rival:</strong> ________________</div>
            <div><strong>Cancha:</strong> ________________</div>
          </div>
          <table>
            <thead>
              <tr><th>#</th><th>Nombre</th><th>Apodo</th><th>Posición</th><th>Firma</th></tr>
            </thead>
            <tbody>
              ${teamPlayers.slice(0, 23).map(p => `
                <tr>
                  <td>${p.camiseta}</td>
                  <td>${p.name}</td>
                  <td>${p.apodo || '-'}</td>
                  <td>${p.posicion || '-'}</td>
                  <td>________________</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="score-section">
            <strong>MARCADOR</strong><br>
            <span style="font-size: 24px;">Orcos Negros ___ - ___ Rival</span>
            <p style="font-size: 11px; color: #666;">Tries: ___ | Conversiones: ___ | Penales: ___</p>
          </div>
          <div class="signatures">
            <div class="signature">Capitán Orcos Negros</div>
            <div class="signature">Árbitro del Partido</div>
          </div>
          <p style="text-align: center; margin-top: 20px; font-size: 10px; color: #999;">Rugby Orcos Negros - Club Manager v3.0</p>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>🛡️ Gestión de Equipos Rivales</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={printArbitroSheet} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}>
            🖨️ Imprimir Planilla
          </button>
          <button onClick={generateArbitroSheet} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem', borderColor: 'var(--color-primary)' }}>
            📋 Planilla Árbitro (WA)
          </button>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-neon" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            {showForm ? 'Cancelar' : '+ Agregar Rival'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
          <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>
            {editingRival ? '✏️ Editar Rival' : '🛡️ Nuevo Equipo Rival'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>Nombre del Equipo *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Toros R.C." className="form-input" required />
              </div>
              <div className="form-group">
                <label>Colores / Uniforme</label>
                <input type="text" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Ej. Rojo y Negro" className="form-input" />
              </div>
            </div>
            <div className="form-group">
              <label>Contacto (teléfono / email)</label>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Ej. +57 300 123 4567" className="form-input" />
            </div>
            <div className="form-group">
              <label>Notas (estilo de juego, historial, etc.)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas tácticas sobre el rival..." className="form-input" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={resetForm} className="btn-outline">Cancelar</button>
              <button type="submit" className="btn-neon">{editingRival ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {rivals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            No hay equipos rivales registrados. Agrega el primero usando el botón "+ Agregar Rival".
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {rivals.map(rival => (
            <div key={rival.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit' }}>🛡️ {rival.name}</h4>
                  {rival.colors && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      🎨 {rival.colors}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleEdit(rival)}
                    style={{
                      background: 'transparent', border: '1px solid var(--border-glass)',
                      color: '#fff', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontSize: '0.75rem'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar a "${rival.name}"?`)) {
                        deleteRival(rival.id);
                        showToast(`Rival "${rival.name}" eliminado.`, 'info');
                      }
                    }}
                    style={{
                      background: 'rgba(255, 61, 0, 0.1)', border: '1px solid var(--color-red)',
                      color: 'var(--color-red)', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontSize: '0.75rem'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {rival.contact && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  📞 {rival.contact}
                </div>
              )}
              {rival.notes && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  📝 {rival.notes}
                </div>
              )}
              <button
                onClick={() => generateWhatsAppRivalLink(rival)}
                className="btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.7rem', alignSelf: 'flex-start', borderColor: 'var(--color-primary)' }}
              >
                📤 Compartir Ficha (WhatsApp)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Rivales;
