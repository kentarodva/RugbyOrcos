import React, { useState } from 'react';

function AddChampionshipModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !date) return;
    onAdd({ name, deadlineDate: date, description: desc });
    setName('');
    setDate('');
    setDesc('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animated-slide">
        <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Agendar Hito de Campeonato</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>Nombre del Torneo / Partido</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Final Copa de Oro, Campeonato Apertura"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha de Limite / Partido</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Descripcion / Meta del Club</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej. Clasificar en primer lugar, entrenar alta intensidad."
              className="form-textarea"
              rows="3"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancelar
            </button>
            <button type="submit" className="btn-neon">
              Guardar Hito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddChampionshipModal;
