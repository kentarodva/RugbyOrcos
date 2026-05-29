import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useToast } from '../context/ToastContext.jsx';

function MakgoraHub() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'proximo' });
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    loadTeams();
    loadTournaments();
  }, []);

  const loadTeams = async () => {
    const { data } = await supabase.from('makgora_teams').select('*').order('sort_order');
    if (data) setTeams(data);
  };

  const loadTournaments = async () => {
    const { data } = await supabase.from('tournaments').select('*').order('start_date', { ascending: false });
    if (data) setTournaments(data);
  };

  const loadStandings = async (tournamentId) => {
    const { data } = await supabase.from('tournament_standings').select('*, makgora_teams!inner(name, rpg_name)').eq('tournament_id', tournamentId).order('total_points', { ascending: false });
    if (data) setStandings(data);
  };

  const loadMatches = async (tournamentId) => {
    const { data } = await supabase
      .from('tournament_matches')
      .select('*, home:makhome(name, rpg_name), away:makaway(name, rpg_name)')
      .eq('tournament_id', tournamentId)
      .order('round');
    if (data) setMatches(data);
  };

  const selectTournament = (t) => {
    setActiveTournament(t);
    setTab('fixture');
    loadStandings(t.id);
    loadMatches(t.id);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;

    const { data, error } = await supabase.from('tournaments').insert({
      name: form.name,
      start_date: form.startDate,
      end_date: form.endDate,
      status: 'proximo',
      created_by: (await supabase.auth.getUser()).data.user?.id,
    }).select().single();

    if (error) { showToast(error.message, 'error'); return; }

    const teamsToAdd = teams.filter(t => t.is_active);
    const { data: tt } = await supabase.from('tournament_teams').insert(
      teamsToAdd.map(t => ({ tournament_id: data.id, team_id: t.id }))
    );

    if (tt || !error) {
      for (const t of teamsToAdd) {
        await supabase.from('tournament_standings').insert({
          tournament_id: data.id, team_id: t.id,
          played: 0, won: 0, drawn: 0, lost: 0,
          points_for: 0, points_against: 0, total_points: 0
        });
      }
    }

    showToast('Torneo Mak\'Gora creado!', 'success');
    setShowCreate(false);
    setForm({ name: '', startDate: '', endDate: '', status: 'proximo' });
    loadTournaments();
  };

  const generateFixture = async () => {
    if (!activeTournament) return;
    const { data: tms } = await supabase.from('tournament_teams').select('team_id').eq('tournament_id', activeTournament.id);
    if (!tms || tms.length < 2) { showToast('Necesitas al menos 2 equipos', 'error'); return; }

    const teamIds = tms.map(t => t.team_id);
    let round = 1;
    const newMatches = [];

    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        newMatches.push({
          tournament_id: activeTournament.id,
          round,
          phase: 'regular',
          home_team_id: teamIds[i],
          away_team_id: teamIds[j],
          status: 'pendiente',
        });
        round++;
      }
    }

    const { error } = await supabase.from('tournament_matches').insert(newMatches);
    if (error) { showToast(error.message, 'error'); return; }

    showToast(`Fixture generado: ${newMatches.length} partidos`, 'success');
    loadMatches(activeTournament.id);
  };

  const updateMatch = async (matchId, homeScore, awayScore) => {
    const { error } = await supabase.from('tournament_matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'jugado' })
      .eq('id', matchId);

    if (error) { showToast(error.message, 'error'); return; }

    loadMatches(activeTournament.id);
    loadStandings(activeTournament.id);

    // Update standings manually
    const m = matches.find(x => x.id === matchId);
    if (m) {
      const hs = parseInt(homeScore) || 0;
      const as = parseInt(awayScore) || 0;

      for (const { team_id, points_for, points_against } of [
        { team_id: m.home_team_id, points_for: hs, points_against: as },
        { team_id: m.away_team_id, points_for: as, points_against: hs }
      ]) {
        const won = points_for > points_against ? 1 : 0;
        const drawn = points_for === points_against ? 1 : 0;
        const lost = points_for < points_against ? 1 : 0;
        const bonus = (points_for >= points_against + 4);
        const pts = won * 4 + drawn * 2 + (bonus ? 1 : 0);

        await supabase.rpc('update_standing', {
          p_tournament_id: activeTournament.id,
          p_team_id: team_id,
          p_played: 1, p_won: won, p_drawn: drawn, p_lost: lost,
          p_points_for: points_for, p_points_against: points_against,
          p_total_points: pts, p_bonus: bonus ? 1 : 0
        }).catch(() => {});
      }

      // Mark tournament as finished if all matches played
      const freshMatches = await supabase.from('tournament_matches').select('status').eq('tournament_id', activeTournament.id);
      if (freshMatches.data && freshMatches.data.every(m => m.status === 'jugado')) {
        const topTeam = await supabase.from('tournament_standings')
          .select('team_id, makgora_teams!inner(name)')
          .eq('tournament_id', activeTournament.id)
          .order('total_points', { ascending: false })
          .limit(1).maybeSingle();

        if (topTeam.data) {
          await supabase.from('tournaments')
            .update({ status: 'finalizado', winner_team_id: topTeam.data.team_id })
            .eq('id', activeTournament.id);
        }

        loadTournaments();
      }

      loadStandings(activeTournament.id);
    }
  };

  const teamName = (id) => teams.find(t => t.id === id)?.rpg_name || teams.find(t => t.id === id)?.name || '—';

  return (
    <div style={{ padding: '15px' }}>
      <div className="glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-gold)', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit' }}>
          Torneo MAK'GORA
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>
          El torneo interno del Reino Orco
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => { setTab('teams'); setActiveTournament(null); }} className={tab === 'teams' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Equipos</button>
        <button onClick={() => { setTab('tournaments'); setActiveTournament(null); }} className={tab === 'tournaments' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Torneos</button>
        {activeTournament && (
          <>
            <button onClick={() => setTab('fixture')} className={tab === 'fixture' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Fixture</button>
            <button onClick={() => setTab('standings')} className={tab === 'standings' ? 'btn-neon' : 'btn-outline'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Tabla</button>
          </>
        )}
      </div>

      {tab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {teams.map(t => (
            <div key={t.id} className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${t.emblem_color || '#00e676'}` }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛡️</div>
              <h4 style={{ color: 'var(--color-gold)', fontSize: '0.9rem', fontWeight: 700 }}>{t.rpg_name || t.name}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t.name}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'tournaments' && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <button onClick={() => setShowCreate(!showCreate)} className="btn-neon" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
              + Nuevo Torneo Mak'Gora
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lbl}>Nombre del Torneo</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Mak'Gora 2026 · Edicion Verano" style={inp} />
              </div>
              <div><label style={lbl}>Fecha Inicio</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={inp} /></div>
              <div><label style={lbl}>Fecha Fin</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={inp} /></div>
              <button type="submit" className="btn-neon" style={{ gridColumn: 'span 2', padding: '10px' }}>Crear Torneo</button>
            </form>
          )}

          {tournaments.map(t => (
            <div key={t.id} className="glass-panel" onClick={() => selectTournament(t)}
              style={{ padding: '15px 20px', marginBottom: '10px', cursor: 'pointer', borderRadius: 'var(--radius-md)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderLeft: `3px solid ${t.status === 'finalizado' ? '#00e676' : t.status === 'en_curso' ? '#ffb300' : '#9e9e9e'}` }}>
              <div>
                <h4 style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 700 }}>{t.name}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t.start_date} → {t.end_date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700,
                  background: t.status === 'finalizado' ? 'rgba(0,230,118,0.1)' : t.status === 'en_curso' ? 'rgba(255,179,0,0.1)' : 'rgba(255,255,255,0.05)',
                  color: t.status === 'finalizado' ? '#00e676' : t.status === 'en_curso' ? '#ffb300' : '#9e9e9e'
                }}>
                  {t.status === 'proximo' ? 'Proximo' : t.status === 'en_curso' ? 'En Curso' : 'Finalizado'}
                </span>
                {t.winner_team_id && <p style={{ fontSize: '0.7rem', color: '#ffb300', marginTop: '4px' }}>Campeon: {teamName(t.winner_team_id)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'fixture' && activeTournament && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={generateFixture} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Generar Fixture</button>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
              {matches.length} partidos · {activeTournament.name}
            </span>
          </div>
          {matches.map(m => (
            <div key={m.id} className="glass-panel" style={{
              padding: '12px 20px', marginBottom: '8px', borderRadius: 'var(--radius-sm)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ flex: 1, textAlign: 'right', paddingRight: '15px' }}>
                <span style={{ color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600 }}>{m.home?.rpg_name || m.home?.name || '—'}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                {m.status === 'pendiente' ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="number" id={`h${m.id}`} min="0" style={{ width: '40px', textAlign: 'center', ...inp }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                    <input type="number" id={`a${m.id}`} min="0" style={{ width: '40px', textAlign: 'center', ...inp }} />
                    <button onClick={() => {
                      const hs = document.getElementById(`h${m.id}`).value;
                      const as = document.getElementById(`a${m.id}`).value;
                      updateMatch(m.id, hs, as);
                    }} style={btnSm}>✓</button>
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                    {m.home_score} - {m.away_score}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, paddingLeft: '15px' }}>
                <span style={{ color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600 }}>{m.away?.rpg_name || m.away?.name || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'standings' && activeTournament && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
          <h4 style={{ color: 'var(--color-gold)', marginBottom: '15px', fontFamily: 'Outfit' }}>Tabla de Posiciones</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                <th style={th}>#</th><th style={th}>Equipo</th><th style={th}>PJ</th><th style={th}>PG</th><th style={th}>PE</th><th style={th}>PP</th><th style={th}>PF</th><th style={th}>PC</th><th style={th}>Dif</th><th style={th}>BP</th><th style={th}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i === 0 ? 'rgba(255,179,0,0.05)' : undefined }}>
                  <td style={td}>{i + 1}</td>
                  <td style={{...td, fontWeight: 700}}>{s.makgora_teams?.rpg_name || s.makgora_teams?.name || '—'}</td>
                  <td style={td}>{s.played}</td><td style={td}>{s.won}</td><td style={td}>{s.drawn}</td><td style={td}>{s.lost}</td>
                  <td style={td}>{s.points_for}</td><td style={td}>{s.points_against}</td><td style={td}>{s.point_diff}</td>
                  <td style={td}>{s.bonus_points}</td><td style={{...td, fontWeight: 800, color: 'var(--color-gold)'}}>{s.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 700, marginBottom: '6px', display: 'block' };
const inp = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '10px', fontSize: '0.85rem', outline: 'none', textAlign: 'center' };
const th = { padding: '8px', color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' };
const td = { padding: '10px 8px', color: 'var(--color-text)', fontSize: '0.8rem' };
const btnSm = { padding: '4px 10px', background: 'var(--color-primary)', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' };

export default MakgoraHub;
