import React, { useContext, useState, useEffect } from 'react';
import { ClubContext } from '../context/ClubContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient.js';
import Rivales from './Rivales';

function GuestRoster({ fixture }) {
  const [guests, setGuests] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!fixture || !fixture.id) return;
    let cancelled = false;
    (async () => {
      const { data: inv } = await supabase.from('match_invitations')
        .select('id').eq('future_fixture_id', fixture.id).maybeSingle();
      if (!inv || cancelled) return;
      const { data: g } = await supabase.from('guest_players')
        .select('*').eq('invitation_id', inv.id).order('created_at');
      if (!cancelled) { setGuests(g || []); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [fixture]);

  if (!loaded) return null;
  if (guests.length === 0) return null;

  return (
    <div style={{ marginBottom: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-glass)' }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '10px' }}>
        ⚔️ Jugadores de {fixture?.opponent || 'Rival'}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {guests.map(g => (
          <div key={g.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,179,0,0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--color-gold)', fontWeight: 700, minWidth: '30px' }}>
              {g.number ? `#${g.number}` : '—'}
            </span>
            <span style={{ color: 'var(--color-text)' }}>{g.name}</span>
            {g.position && (
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)', padding: '1px 7px', borderRadius: '8px' }}>
                {g.position}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Calendario() {
  const { 
    schedule, addScheduleEvent, deleteScheduleEvent, generateWhatsAppMessage, activeTeam,
    fixtures, addFixture, deleteFixture, players, recordMatchStats,
    futureFixtures, addFutureFixture, deleteFutureFixture, rivals
  } = useContext(ClubContext);
  const { showToast } = useToast();
  
  // Pestañas principales de Calendario
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda', 'fixture', 'proximos', 'rivales'

  // Estados para Agregar Evento (Agenda)
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventMaps, setEventMaps] = useState('');
  const [eventType, setEventType] = useState('entrenamiento');
  const [eventRecurrence, setEventRecurrence] = useState('none');
  const [eventLinkedRoutine, setEventLinkedRoutine] = useState('');

  // Estados para Agregar Match en el Fixture (Campaña)
  const [rivalName, setRivalName] = useState('');
  const [scoreOrcos, setScoreOrcos] = useState(0);
  const [scoreRival, setScoreRival] = useState(0);
  const [matchDateCampaign, setMatchDateCampaign] = useState('');
  const [triesScored, setTriesScored] = useState(0);
  const [matchMvp, setMatchMvp] = useState('');

  // --- ESTADOS PARA MATCH CENTER / DETALLE DE PARTIDO ---
  const [selectedFixtureForDetail, setSelectedFixtureForDetail] = useState(null);
  const [showStatsForm, setShowStatsForm] = useState(false);
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState('');
  const [statTries, setStatTries] = useState(0);
  const [statConversions, setStatConversions] = useState(0);
  const [statTackles, setStatTackles] = useState(0);
  const [statTurnovers, setStatTurnovers] = useState(0);
  const [statYellow, setStatYellow] = useState(0);
  const [statRed, setStatRed] = useState(0);
  const [statMvp, setStatMvp] = useState(false);

  // --- ESTADOS PARA PROXIMOS PARTIDOS ---
  const [showFutureForm, setShowFutureForm] = useState(false);
  const [futureOpponent, setFutureOpponent] = useState('');
  const [futureOpponentCustom, setFutureOpponentCustom] = useState('');
  const [futureDate, setFutureDate] = useState('');
  const [futureTime, setFutureTime] = useState('');
  const [futureLocation, setFutureLocation] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState('');

  const handleSaveFutureFixture = (e) => {
    e.preventDefault();
    const opponent = futureOpponent === '__other__' ? futureOpponentCustom : futureOpponent;
    if (!opponent || !futureDate) {
      showToast('Rival y fecha son obligatorios.', 'warning');
      return;
    }
    addFutureFixture({
      opponent,
      date: futureDate,
      time: futureTime,
      location: futureLocation
    });
    showToast(`Partido vs ${opponent} agendado para el ${futureDate}.`, 'success');
    setFutureOpponent('');
    setFutureOpponentCustom('');
    setFutureDate('');
    setFutureTime('');
    setFutureLocation('');
    setShowFutureForm(false);
  };

  const randomToken = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    }
    return Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const generarInvitacion = async (fixture) => {
    setGeneratingInvite(fixture.id);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) { showToast('Debes iniciar sesión.', 'error'); setGeneratingInvite(''); return; }

      const { data: realFixture } = await supabase
        .from('future_fixtures')
        .select('id')
        .eq('opponent', fixture.opponent)
        .eq('date', fixture.date)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const futureFixtureId = realFixture?.id || fixture.id;
      const token = randomToken();

      const { data: existing } = await supabase
        .from('match_invitations')
        .select('id')
        .eq('future_fixture_id', futureFixtureId)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) { showToast('Ya existe una invitación activa para este partido.', 'warning'); setGeneratingInvite(''); return; }

      const { error } = await supabase.from('match_invitations').insert({
        user_id: user.id,
        future_fixture_id: futureFixtureId,
        token,
        rival_name: fixture.opponent,
        status: 'active',
        expires_at: fixture.date,
      });

      if (error) { showToast('Error al crear invitacion: ' + error.message, 'error'); setGeneratingInvite(''); return; }

      const link = `${window.location.origin}/invitacion/${token}`;
      navigator.clipboard.writeText(link);
      showToast('Link de invitacion copiado. Compartelo con el rival por WhatsApp.', 'success');
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Invitacion de Rugby Orcos Negros vs ${fixture.opponent} - ${fixture.date}\n\nRegistra tus jugadores aqui:\n${link}`)}`, '_blank');
    } catch (err) {
      showToast('Error al generar invitacion.', 'error');
    }
    setGeneratingInvite('');
  };

  // Filtrar jugadores elegibles para estadisticas
  const activeTeamPlayers = players.filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador');

  // Buscar estadísticas cargadas en este partido específico
  const getMatchStatsForFixture = (fixture) => {
    if (!fixture) return [];
    const matchStatsList = [];
    players.forEach(p => {
      if (p.matchStats) {
        p.matchStats.forEach(st => {
          const matchDateMatch = st.date === fixture.date;
          const matchOpponentMatch = st.opponent.trim().toLowerCase() === fixture.opponent.trim().toLowerCase();
          if (matchDateMatch && matchOpponentMatch) {
            matchStatsList.push({
              player: p,
              stats: st
            });
          }
        });
      }
    });
    return matchStatsList;
  };

  const handleSavePlayerStats = (e) => {
    e.preventDefault();
    if (!selectedPlayerForStats) return;

    recordMatchStats(selectedPlayerForStats, {
      date: selectedFixtureForDetail.date,
      opponent: selectedFixtureForDetail.opponent,
      tries: Number(statTries),
      conversions: Number(statConversions),
      tackles: Number(statTackles),
      turnovers: Number(statTurnovers),
      yellowCards: Number(statYellow),
      redCards: Number(statRed),
      mvp: statMvp
    });

    // Resetear formulario de estadísticas
    setSelectedPlayerForStats('');
    setStatTries(0);
    setStatConversions(0);
    setStatTackles(0);
    setStatTurnovers(0);
    setStatYellow(0);
    setStatRed(0);
    setStatMvp(false);
    setShowStatsForm(false);
    
    showToast('Estadísticas técnicas registradas con éxito.', 'success');
  };

  // Filtrar y ordenar la agenda cronológicamente
  const teamEvents = schedule
    .filter(e => e.teamCategory === activeTeam)
    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

  // Enviar Evento (Agenda)
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventTime || !eventLocation) return;
    
    // Si no introduce link de maps, generamos una búsqueda en Google Maps por defecto
    const finalMapsLink = eventMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventLocation)}`;

    addScheduleEvent({
      title: eventTitle,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      mapsLink: finalMapsLink,
      type: eventType,
      recurrence: eventRecurrence,
      linkedRoutine: eventLinkedRoutine || null
    });

    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventMaps('');
    setEventType('entrenamiento');
    setEventRecurrence('none');
    setEventLinkedRoutine('');
    setShowAddForm(false);
  };

  // Enviar Campaña/Fixture
  const handleSaveFixture = (e) => {
    e.preventDefault();
    if (!rivalName || !matchDateCampaign) return;

    addFixture({
      opponent: rivalName,
      orcosScore: Number(scoreOrcos),
      opponentScore: Number(scoreRival),
      date: matchDateCampaign,
      tries: Number(triesScored),
      mvp: matchMvp
    });

    // Resetear formulario
    setRivalName('');
    setScoreOrcos(0);
    setScoreRival(0);
    setMatchDateCampaign('');
    setTriesScored(0);
    setMatchMvp('');
  };

  // Copiar al Portapapeles y Compartir en WhatsApp (Agenda)
  const handleWhatsAppShare = (event) => {
    const message = generateWhatsAppMessage(event);
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(message)
      .then(() => {
        // Redirigir a WhatsApp api
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      })
      .catch(() => {
        // De todas formas abre whatsapp
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* Pestañas de sub-secciones */}
      <div style={{ display: 'flex', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('agenda')}
          className="btn-outline"
          style={{ 
            background: activeTab === 'agenda' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'agenda' ? '#000' : '#fff',
            borderColor: activeTab === 'agenda' ? 'var(--color-primary)' : 'var(--border-glass)',
            fontWeight: activeTab === 'agenda' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          📅 Agenda y Convocatorias
        </button>
        <button 
          onClick={() => setActiveTab('fixture')}
          className="btn-outline"
          style={{ 
            background: activeTab === 'fixture' ? 'var(--color-gold)' : 'transparent',
            color: activeTab === 'fixture' ? '#000' : '#fff',
            borderColor: activeTab === 'fixture' ? 'var(--color-gold)' : 'var(--border-glass)',
            fontWeight: activeTab === 'fixture' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          🏆 Campaña y Fixture
        </button>
        <button 
          onClick={() => setActiveTab('proximos')}
          className="btn-outline"
          style={{ 
            background: activeTab === 'proximos' ? 'var(--color-blue)' : 'transparent',
            color: activeTab === 'proximos' ? '#000' : '#fff',
            borderColor: activeTab === 'proximos' ? 'var(--color-blue)' : 'var(--border-glass)',
            fontWeight: activeTab === 'proximos' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          🔮 Próximos Partidos
        </button>
        <button 
          onClick={() => setActiveTab('rivales')}
          className="btn-outline"
          style={{ 
            background: activeTab === 'rivales' ? 'var(--color-red)' : 'transparent',
            color: activeTab === 'rivales' ? '#fff' : '#fff',
            borderColor: activeTab === 'rivales' ? 'var(--color-red)' : 'var(--border-glass)',
            fontWeight: activeTab === 'rivales' ? 800 : 500,
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          🛡️ Rivales & Árbitro
        </button>
      </div>

      {/* --- RENDER PESTAÑA 1: AGENDA GENERAL --- */}
      {activeTab === 'agenda' && (
        <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
          
          {/* COLUMNA 1: AGENDA DEL EQUIPO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Outfit' }}>📅 Agenda de Actividades y Prácticas</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Lista de entrenamientos, partidos y eventos agendados.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowWeeklyView(!showWeeklyView)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--color-blue)', color: 'var(--color-blue)' }}>
                  {showWeeklyView ? '📋 Lista' : '📊 Cronograma Semanal'}
                </button>
                <button onClick={() => setShowAddForm(true)} className="btn-neon" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  + Agendar Cita
                </button>
              </div>
            </div>

            {teamEvents.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                📭 No hay actividades programadas. ¡Comienza agendando un entrenamiento!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {teamEvents.map(e => {
                  const isMatch = e.title.toUpperCase().includes('PARTIDO');
                  
                  // Formatear Fecha
                  const dateFormatted = new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long', month: 'short', day: 'numeric'
                  });

                  return (
                    <div 
                      key={e.id}
                      className="glass-panel animated-slide"
                      style={{
                        padding: '20px',
                        borderLeft: isMatch ? '4px solid var(--color-gold)' : '4px solid var(--color-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Cabecera del Cita */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span className="badge badge-active" style={{ background: 'var(--bg-dark)', color: isMatch ? 'var(--color-gold)' : 'var(--color-primary)', fontSize: '0.65rem', marginBottom: '5px' }}>
                            {isMatch ? '🏉 Partido Competitivo' : '🏃‍♂️ Entrenamiento Táctico'}
                          </span>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{e.title}</h4>
                        </div>

                        <button 
                          onClick={() => deleteScheduleEvent(e.id)} 
                          className="btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.1)' }}
                          title="Eliminar Evento"
                        >
                          ❌ Borrar
                        </button>
                      </div>

                      {/* Cuerpo Cita */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📅</span>
                          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{dateFormatted}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>|</span>
                          <span>⏰</span>
                          <strong style={{ color: 'var(--color-gold)' }}>{e.time} PM</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📍</span>
                          <span style={{ color: 'var(--color-text)' }}>{e.location}</span>
                        </div>

                        <a 
                          href={e.mapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}
                        >
                          🗺️ Ver Ubicación en Google Maps ➔
                        </a>
                      </div>

                      {/* Botón WhatsApp */}
                      <div style={{ marginTop: '5px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        <button 
                          onClick={() => handleWhatsAppShare(e)}
                          className="btn-neon"
                          style={{ 
                            width: '100%', 
                            justifyContent: 'center', 
                            fontSize: '0.8rem',
                            background: 'linear-gradient(135deg, #128c7e, #25d366)',
                            color: '#fff',
                            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)'
                          }}
                        >
                          💬 Copiar y Convocar por WhatsApp ➔
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* COLUMNA 2: FORMULARIO AGREGAR / CONVOCATORIAS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {showAddForm ? (
              <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
                <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>📅 Programar Sesión</h3>
                
                <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  <div className="form-group">
                    <label>Nombre de la Actividad</label>
                    <input 
                      type="text" 
                      value={eventTitle} 
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Ej. Entrenamiento Scrum, Práctica General, Partido vs Toros" 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Fecha</label>
                      <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="form-input" required />
                    </div>
                    <div className="form-group">
                      <label>Hora</label>
                      <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="form-input" required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Tipo de Evento</label>
                      <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="form-select">
                        <option value="entrenamiento">🏋️ Entrenamiento</option>
                        <option value="partido">🏆 Partido</option>
                        <option value="reunion">📋 Reunión</option>
                        <option value="otro">📌 Otro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Recurrencia</label>
                      <select value={eventRecurrence} onChange={(e) => setEventRecurrence(e.target.value)} className="form-select">
                        <option value="none">Sin repetición</option>
                        <option value="semanal">Cada semana (x4)</option>
                        <option value="quincenal">Cada 2 semanas (x2)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Lugar / Complejo Deportivo</label>
                    <input 
                      type="text" 
                      value={eventLocation} 
                      onChange={(e) => setEventLocation(e.target.value)} 
                      placeholder="Ej. Cancha de Rugby Timiza" 
                      className="form-input" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Enlace de Google Maps (Opcional)</label>
                    <input 
                      type="url" 
                      value={eventMaps} 
                      onChange={(e) => setEventMaps(e.target.value)} 
                      placeholder="https://maps.google.com/?q=..." 
                      className="form-input" 
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Si se deja vacío, la app generará un enlace de búsqueda automático con el nombre del lugar.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowAddForm(false)} className="btn-outline">
                      Cancelar
                    </button>
                    <button type="submit" className="btn-neon">
                      Guardar en Agenda
                    </button>
                  </div>

                </form>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>📣 Convocatorias Eficientes</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                  La cultura del club **Rugby Orcos** exige compromiso y puntualidad. 
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                  Usa el botón de WhatsApp en cada evento para copiar una plantilla oficial con emojis de rugby, enlaces de localización geográficos y hora. Compártela en el grupo del equipo para notificar a todos al instante.
                </p>
                <div style={{ background: 'rgba(0, 230, 118, 0.03)', border: '1px dashed var(--color-primary)', padding: '15px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                  📅 [DÍA] [FECHA] <br />
                  ⏰ Hora: 7:30 PM <br />
                  📍 Lugar: Cancha La Fragua <br />
                  🗺️ Maps: https://maps...
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* --- RENDER PESTAÑA 2: CAMPAÑA Y FIXTURES --- */}
      {activeTab === 'fixture' && (
        <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
          
          {/* Columna 1: Historial de Partidos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Outfit' }}>🏆 Historial de Campaña</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Resultados de la contienda de esta temporada.</p>
            </div>

            {fixtures.filter(f => f.teamCategory === activeTeam).length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                📭 Aún no se han disputado batallas en esta campaña. ¡Registra el primer resultado!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {fixtures
                  .filter(f => f.teamCategory === activeTeam)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(f => {
                    const isWinner = f.orcosScore > f.opponentScore;
                    const isDraw = f.orcosScore === f.opponentScore;
                    
                    return (
                      <div 
                        key={f.id}
                        className="glass-panel animated-slide"
                        style={{
                          padding: '20px',
                          borderLeft: isWinner ? '4px solid var(--color-primary)' : isDraw ? '4px solid var(--color-gold)' : '4px solid var(--color-red)',
                          position: 'relative'
                        }}
                      >
                        {/* Indicador de resultado */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span className="badge" style={{ 
                            background: isWinner ? 'rgba(0, 230, 118, 0.1)' : isDraw ? 'rgba(255, 234, 0, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                            color: isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)',
                            border: `1px solid ${isWinner ? 'var(--color-primary)' : isDraw ? 'var(--color-gold)' : 'var(--color-red)'}`,
                            fontSize: '0.65rem',
                            fontWeight: 700
                          }}>
                            {isWinner ? 'VICTORIA 🟢' : isDraw ? 'EMPATE 🟡' : 'DERROTA 🔴'}
                          </span>
                          
                          <button 
                            onClick={() => deleteFixture(f.id)}
                            style={{ 
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-red)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              opacity: 0.6
                            }}
                            title="Eliminar registro"
                          >
                            ❌
                          </button>
                        </div>

                        {/* Contienda de Marcadores */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Orcos</h4>
                            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit' }}>{f.orcosScore}</div>
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{f.opponent}</h4>
                            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit' }}>{f.opponentScore}</div>
                          </div>
                        </div>

                        {/* Detalles de Ensayo y MVP */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>MVP DEL PARTIDO</span>
                            <strong>⭐ {f.mvp || 'Sin definir'}</strong>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>TRIES ANOTADOS</span>
                            <strong>🏉 {f.tries || 0} Ensayos</strong>
                          </div>
                        </div>

                        {/* Botón Detalle & Rendimiento (Match Center) */}
                        <button 
                          onClick={() => setSelectedFixtureForDetail(f)}
                          className="btn-outline"
                          style={{
                            width: '100%',
                            marginTop: '12px',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            borderColor: 'var(--color-primary)',
                            color: 'var(--color-primary)',
                            padding: '8px 0',
                            fontWeight: 800,
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          📈 Detalle y Rendimiento ➔
                        </button>

                        {/* Fecha */}
                        <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                          📅 Contienda librada el {new Date(f.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {showWeeklyView && (
              <div className="glass-panel" style={{ padding: '20px', marginTop: '10px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit', marginBottom: '15px', color: 'var(--color-blue)' }}>
                  📊 Cronograma Semanal
                </h4>
                {(() => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {days.map((dayName, i) => {
                        const date = new Date(startOfWeek);
                        date.setDate(startOfWeek.getDate() + i);
                        const dateStr = date.toISOString().split('T')[0];
                        const dayEvents = teamEvents.filter(e => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
                        const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                        return (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'stretch', gap: '8px',
                            padding: '8px', background: isToday ? 'rgba(0, 230, 118, 0.04)' : 'rgba(255,255,255,0.01)',
                            border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            <div style={{
                              minWidth: '75px', fontWeight: 700, fontSize: '0.8rem',
                              display: 'flex', flexDirection: 'column', justifyContent: 'center',
                              color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)'
                            }}>
                              {dayName}
                              <span style={{ fontSize: '0.6rem', fontWeight: 400 }}>{date.getDate()}/{date.getMonth() + 1}</span>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {dayEvents.length === 0 ? (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', padding: '4px 0' }}>Sin actividades</span>
                              ) : (
                                dayEvents.map(e => (
                                  <span key={e.id} style={{
                                    fontSize: '0.72rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                                    background: e.type === 'partido' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0, 230, 118, 0.06)',
                                    color: e.type === 'partido' ? 'var(--color-gold)' : 'var(--color-primary)',
                                    border: `1px solid ${e.type === 'partido' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 230, 118, 0.1)'}`
                                  }}>
                                    {e.type === 'partido' ? '🏉' : '🏋️'} {e.time} - {e.title}
                                    {e.linkedRoutine && <span style={{ fontSize: '0.6rem', marginLeft: '4px', color: 'var(--color-text-muted)' }}>(rutina vinculada)</span>}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
          {/* Columna 2: Registrar Marcador & Estadísticas Temporada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
              <h3 className="neon-text-gold" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>🏆 Registrar Resultado</h3>
              
              <form onSubmit={handleSaveFixture} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label>Rival del Clan</label>
                  <input 
                    type="text" 
                    value={rivalName} 
                    onChange={(e) => setRivalName(e.target.value)} 
                    placeholder="Ej. Toros R.C. o Gatos del Norte" 
                    className="form-input" 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Puntos Orcos</label>
                    <input 
                      type="number" 
                      value={scoreOrcos} 
                      onChange={(e) => setScoreOrcos(Number(e.target.value))} 
                      className="form-input" 
                      min="0" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Puntos Rival</label>
                    <input 
                      type="number" 
                      value={scoreRival} 
                      onChange={(e) => setScoreRival(Number(e.target.value))} 
                      className="form-input" 
                      min="0" 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Fecha de Contienda</label>
                    <input 
                      type="date" 
                      value={matchDateCampaign} 
                      onChange={(e) => setMatchDateCampaign(e.target.value)} 
                      className="form-input" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Tries Anotados</label>
                    <input 
                      type="number" 
                      value={triesScored} 
                      onChange={(e) => setTriesScored(Number(e.target.value))} 
                      className="form-input" 
                      min="0" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>MVP Elegido (Guerrero de la Fecha)</label>
                  <select 
                    value={matchMvp} 
                    onChange={(e) => setMatchMvp(e.target.value)} 
                    className="form-select"
                  >
                    <option value="">-- Selecciona el MVP --</option>
                    {players
                      .filter(p => p.teamCategory === activeTeam && p.rol !== 'Entrenador')
                      .map(p => (
                        <option key={p.id} value={p.name}>
                          #{p.camiseta} {p.name} "{p.apodo}"
                        </option>
                      ))}
                  </select>
                </div>

                <button type="submit" className="btn-neon" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-gold), #ff8f00)', color: '#000', marginTop: '10px' }}>
                  ⚔️ Publicar Hazaña de Partido
                </button>
              </form>
            </div>

            {/* Récords de Temporada */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '12px' }}>📊 Récord de Campaña de la Categoría</h4>
              
              {(() => {
                const teamFixes = fixtures.filter(f => f.teamCategory === activeTeam);
                const wins = teamFixes.filter(f => f.orcosScore > f.opponentScore).length;
                const draws = teamFixes.filter(f => f.orcosScore === f.opponentScore).length;
                const losses = teamFixes.filter(f => f.orcosScore < f.opponentScore).length;
                const totalTries = teamFixes.reduce((sum, f) => sum + (f.tries || 0), 0);
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(0, 230, 118, 0.02)', border: '1px solid rgba(0, 230, 118, 0.1)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>VICTORIAS</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{wins}</strong>
                      </div>
                      <div style={{ background: 'rgba(255, 234, 0, 0.02)', border: '1px solid rgba(255, 234, 0, 0.1)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>EMPATES</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--color-gold)' }}>{draws}</strong>
                      </div>
                      <div style={{ background: 'rgba(255, 61, 0, 0.02)', border: '1px solid rgba(255, 61, 0, 0.1)', padding: '10px 5px', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block' }}>DERROTAS</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--color-red)' }}>{losses}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginTop: '5px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Total Tries Conquistados:</span>
                      <strong style={{ color: 'var(--color-primary)' }}>🏉 {totalTries} Tries</strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      )}

      {/* --- OVERLAY MODAL: MATCH CENTER & FICHA DE PARTIDO --- */}
      {selectedFixtureForDetail && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel animated-slide" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header del Match Center */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
                  🏆 CAMPAÑA Y MATCH CENTER
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit' }}>
                  Ficha de Partido: Orcos vs {selectedFixtureForDetail.opponent}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  📅 {new Date(selectedFixtureForDetail.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedFixtureForDetail(null);
                  setShowStatsForm(false);
                }} 
                className="btn-outline" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.1)' }}
              >
                Cerrar ➔
              </button>
            </div>

            {/* Marcador de Batalla */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)' }}>Orcos</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, textShadow: '0 0 10px rgba(0, 230, 118, 0.4)', fontFamily: 'Outfit' }}>
                  {selectedFixtureForDetail.orcosScore}
                </div>
              </div>
              
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>VS</div>
              
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-muted)' }}>
                  {selectedFixtureForDetail.opponent}
                </h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Outfit' }}>
                  {selectedFixtureForDetail.opponentScore}
                </div>
              </div>
            </div>

            {/* Stats del Partido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '0.8rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>MVP DEL PARTIDO</span>
                <strong style={{ fontSize: '1rem', color: 'var(--color-gold)' }}>
                  👑 {selectedFixtureForDetail.mvp || 'Sin asignar'}
                </strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>ENSAYOS DEL CLAN</span>
                <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>
                  🏉 {selectedFixtureForDetail.tries || 0} Tries Anotados
                </strong>
              </div>
            </div>

            {/* SECCIÓN: RENDIMIENTO INDIVIDUAL JUGADORES */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  📊 Rendimiento de Guerreros en Cancha
                </h4>
                <button 
                  onClick={() => setShowStatsForm(!showStatsForm)} 
                  className="btn-neon"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: showStatsForm ? 'transparent' : 'var(--color-primary)', color: showStatsForm ? '#fff' : '#000', borderColor: showStatsForm ? 'var(--border-glass)' : 'transparent' }}
                >
                  {showStatsForm ? 'Cancelar Registro' : '+ Registrar Jugador'}
                </button>
              </div>

              {/* Formulario Registrar Estadísticas */}
              {showStatsForm && (
                <form onSubmit={handleSavePlayerStats} className="glass-panel animated-slide" style={{ padding: '20px', marginBottom: '20px', border: '1px dashed var(--color-primary)' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 800, marginBottom: '15px' }}>
                    📝 CARGAR RENDIMIENTO INDIVIDUAL
                  </h5>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Seleccionar Jugador</label>
                    <select 
                      value={selectedPlayerForStats} 
                      onChange={(e) => setSelectedPlayerForStats(e.target.value)} 
                      className="form-select"
                      required
                    >
                      <option value="">-- Elige un Guerrero --</option>
                      {activeTeamPlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.camiseta} {p.name} "{p.apodo}" ({p.posicion})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>🏉 Tries</label>
                      <input type="number" min="0" value={statTries} onChange={(e) => setStatTries(Number(e.target.value))} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>🎯 Conv.</label>
                      <input type="number" min="0" value={statConversions} onChange={(e) => setStatConversions(Number(e.target.value))} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>🛡️ Placajes</label>
                      <input type="number" min="0" value={statTackles} onChange={(e) => setStatTackles(Number(e.target.value))} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.65rem' }}>🔄 Recup.</label>
                      <input type="number" min="0" value={statTurnovers} onChange={(e) => setStatTurnovers(Number(e.target.value))} className="form-input" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-gold)' }}>🟨 Amarillas</label>
                        <input type="number" min="0" max="2" value={statYellow} onChange={(e) => setStatYellow(Number(e.target.value))} className="form-input" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--color-red)' }}>🟥 Rojas</label>
                        <input type="number" min="0" max="1" value={statRed} onChange={(e) => setStatRed(Number(e.target.value))} className="form-input" />
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', cursor: 'pointer', height: '100%', paddingTop: '15px' }}>
                      <input 
                        type="checkbox" 
                        checked={statMvp} 
                        onChange={(e) => setStatMvp(e.target.checked)} 
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>⭐ ¿MVP del Partido?</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowStatsForm(false)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-neon" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                      💾 Guardar Rendimiento
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Rendimiento del Partido */}
              {(() => {
                const loggedStats = getMatchStatsForFixture(selectedFixtureForDetail);
                
                if (loggedStats.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      📋 Aún no hay rendimiento de jugadores registrado para este partido. ¡Comienza haciendo clic en + Registrar Jugador!
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 1fr)', gap: '5px', padding: '10px', fontSize: '0.7rem', color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800 }}>
                      <div>GUERRERO</div>
                      <div style={{ textAlign: 'center' }}>TRIES</div>
                      <div style={{ textAlign: 'center' }}>CONV.</div>
                      <div style={{ textAlign: 'center' }}>TACKLES</div>
                      <div style={{ textAlign: 'center' }}>RECUP.</div>
                      <div style={{ textAlign: 'center' }}>TARJETAS</div>
                    </div>

                    {loggedStats.map(({ player, stats: st }) => (
                      <div 
                        key={st.id} 
                        className="glass-panel" 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '2fr repeat(5, 1fr)', 
                          gap: '5px', 
                          padding: '12px 10px', 
                          fontSize: '0.75rem', 
                          alignItems: 'center',
                          borderLeft: st.mvp ? '3px solid var(--color-gold)' : '1px solid var(--border-glass)'
                        }}
                      >
                        <div style={{ fontWeight: st.mvp ? 800 : 600 }}>
                          #{player.camiseta} {player.name} {st.mvp && <span style={{ color: 'var(--color-gold)' }} title="MVP del Partido">👑⭐</span>}
                        </div>
                        <div style={{ textAlign: 'center', fontWeight: st.tries > 0 ? 800 : 400, color: st.tries > 0 ? 'var(--color-primary)' : 'inherit' }}>
                          🏉 {st.tries}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          🎯 {st.conversions}
                        </div>
                        <div style={{ textAlign: 'center', fontWeight: st.tackles >= 10 ? 800 : 400, color: st.tackles >= 10 ? 'var(--color-gold)' : 'inherit' }}>
                          🛡️ {st.tackles}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          🔄 {st.turnovers}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          {st.yellowCards > 0 && <span className="badge" style={{ background: 'rgba(255, 234, 0, 0.1)', color: 'var(--color-gold)', border: '1px solid var(--color-gold)', padding: '2px 4px', fontSize: '0.6rem', marginRight: '2px' }}>🟨 {st.yellowCards}</span>}
                          {st.redCards > 0 && <span className="badge" style={{ background: 'rgba(255, 61, 0, 0.1)', color: 'var(--color-red)', border: '1px solid var(--color-red)', padding: '2px 4px', fontSize: '0.6rem' }}>🟥 {st.redCards}</span>}
                          {st.yellowCards === 0 && st.redCards === 0 && <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* ── Jugadores Rivales (invitados via link) ── */}
            <GuestRoster fixture={selectedFixtureForDetail} />

            {/* Botón Cerrar Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
              <button 
                onClick={() => {
                  setSelectedFixtureForDetail(null);
                  setShowStatsForm(false);
                }} 
                className="btn-neon"
              >
                Cerrar Match Center
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── PROXIMOS PARTIDOS ── */}
      {activeTab === 'proximos' && (
        <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-blue)' }}>
              🔮 Próximos Partidos
            </h3>
            <button
              onClick={() => setShowFutureForm(!showFutureForm)}
              className="btn-neon"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              {showFutureForm ? 'Cancelar' : '+ Agendar Partido'}
            </button>
          </div>

          {showFutureForm && (
            <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
              <form onSubmit={handleSaveFutureFixture} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label>Equipo Rival</label>
                  <select value={futureOpponent} onChange={(e) => setFutureOpponent(e.target.value)} className="form-select">
                    <option value="">-- Seleccionar rival --</option>
                    {rivals.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                    <option value="__other__">-- Otro (escribir) --</option>
                  </select>
                  {futureOpponent === '__other__' && (
                    <input type="text" value={futureOpponentCustom} onChange={(e) => setFutureOpponentCustom(e.target.value)} placeholder="Nombre del rival" className="form-input" style={{ marginTop: '8px' }} />
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" value={futureDate} onChange={(e) => setFutureDate(e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label>Hora</label>
                    <input type="time" value={futureTime} onChange={(e) => setFutureTime(e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Lugar / Cancha</label>
                  <input type="text" value={futureLocation} onChange={(e) => setFutureLocation(e.target.value)} placeholder="Ej. Cancha Polideportiva El Salitre" className="form-input" />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowFutureForm(false)} className="btn-outline">Cancelar</button>
                  <button type="submit" className="btn-neon">Agendar Partido</button>
                </div>
              </form>
            </div>
          )}

          {futureFixtures.filter(f => f.teamCategory === activeTeam).length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>No hay próximos partidos agendados.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {futureFixtures.filter(f => f.teamCategory === activeTeam).sort((a, b) => new Date(a.date) - new Date(b.date)).map(f => {
                const dateObj = new Date(f.date + 'T00:00:00');
                const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                const formatted = dateObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                return (
                  <div key={f.id} className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid var(--color-blue)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>vs {f.opponent}</h4>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      📅 {dayName}, {formatted} {f.time && `| ⏰ ${f.time}`}
                    </div>
                    {f.location && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        📍 {f.location}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={() => generarInvitacion(f)}
                        disabled={generatingInvite === f.id}
                        className="btn-outline"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.75rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
                      >
                        {generatingInvite === f.id ? '⏳ Generando...' : '📨 Invitar Rival'}
                      </button>
                      <button
                        onClick={() => { deleteFutureFixture(f.id); showToast('Partido eliminado.', 'info'); }}
                        style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--color-red)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RIVALES & ÁRBITRO ── */}
      {activeTab === 'rivales' && <Rivales />}

    </div>
  );
}

export default Calendario;
