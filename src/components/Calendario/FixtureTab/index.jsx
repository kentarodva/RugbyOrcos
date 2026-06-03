import React from 'react';
import FixtureList from './FixtureList';
import FixtureForm from './FixtureForm';
import MatchCenter from './MatchCenter';
import SeasonRecords from './SeasonRecords';

function FixtureTab({
  fixtures,
  activeTeamPlayers,
  selectedFixtureForDetail,
  setSelectedFixtureForDetail,
  handleSaveFixture,
  handleSavePlayerStats,
  getMatchStats,
  deleteFixture
}) {
  return (
    <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Outfit' }}>Historial de Campaña</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Resultados de la contienda de esta temporada.</p>
        </div>

        <FixtureList
          fixtures={fixtures}
          onDelete={deleteFixture}
          onDetail={setSelectedFixtureForDetail}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <FixtureForm
          players={activeTeamPlayers}
          onSave={handleSaveFixture}
        />

        <SeasonRecords
          fixtures={fixtures}
        />
      </div>

      {selectedFixtureForDetail && (
        <MatchCenter
          fixture={selectedFixtureForDetail}
          activeTeamPlayers={activeTeamPlayers}
          onClose={() => setSelectedFixtureForDetail(null)}
          onSaveStats={handleSavePlayerStats}
          getMatchStats={getMatchStats}
        />
      )}
    </div>
  );
}

export default FixtureTab;
