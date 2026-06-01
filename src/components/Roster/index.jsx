import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClubContext, SYSTEM_ROLES, SYSTEM_ROLES_LABELS, EQUIPOS_LABELS } from '../../context/ClubContext';
import { supabase } from '../../supabaseClient.js';
import { wrapCatch } from '../../utils/errorHandler';
import { useQueryParams } from '../../utils/useQueryParams';
import { printRoster } from '../../utils/exportPdf.js';
import { useToast } from '../../context/ToastContext';
import { useRegisterSearchHandler, useRegisterAddPlayerHandler } from '../../utils/keyboardShortcuts';
import RosterControls from './RosterControls';
import PlayerCard from './PlayerCard';
import PlayerDetail from './PlayerModal/PlayerDetail';
import AddPlayerModal from './Modals/AddPlayerModal';
import EditPlayerModal from './Modals/EditPlayerModal';
import DeleteConfirmModal from './Modals/DeleteConfirmModal';
import CredentialModal from './Modals/CredentialModal';
import ResetPasswordModal from './Modals/ResetPasswordModal';
import PositionSelect from './PositionSelect';

import RosterSkeleton from '../Skeletons/RosterSkeleton';

function Roster() {
  const {
    players, addPlayer, updatePlayer, deletePlayer,
    recordPhysicalTest, recordInjury, updateInjuryPhase, activeTeam,
    runHiaProtocol, updateClothingSizes, updateGymStats,
    createPlayerCredentials, resetPlayerPassword, hasPermission,
    viewMode, divisionView, makgoraTeamId, makgoraTeams,
    syncStatus, bulkUpdatePosition,
  } = useContext(ClubContext);
  const { showToast } = useToast();

  const [{ search, makgoraFilter }, setQueryParams] = useQueryParams();

  const setSearch = useCallback((val) => {
    setQueryParams({ search: val });
  }, [setQueryParams]);

  const setMakgoraFilter = useCallback((val) => {
    setQueryParams({ makgoraFilter: val });
  }, [setQueryParams]);

  const [activeLoans, setActiveLoans] = useState([]);

  useEffect(() => {
    supabase.from('player_loans')
      .select('player_id, to_team_id, status')
      .eq('status', 'approved')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .then(({ data }) => { if (data) setActiveLoans(data); })
      .catch(wrapCatch('Roster.fetchActiveLoans', { silent: true }));
  }, []);

  const searchInputRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useRegisterSearchHandler(useCallback(() => {
    searchInputRef.current?.focus();
  }, []));

  useRegisterAddPlayerHandler(useCallback(() => {
    setShowAddModal(true);
  }, []));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set());
  const [bulkPositionId, setBulkPositionId] = useState(null);
  const [bulkApplying, setBulkApplying] = useState(false);

  useEffect(() => {
    if (!selectedPlayer) return;
    const fresh = players.find(p => p.id === selectedPlayer.id);
    if (fresh) setSelectedPlayer(fresh);
  }, [players, selectedPlayer?.id]);

  const teamPlayers = React.useMemo(() => {
    if (viewMode === 'general' && divisionView === 'all') {
      return players.filter(p => p.teamCategory?.startsWith('orcos'));
    }
    if (viewMode === 'general') {
      return players.filter(p => p.teamCategory === `orcos_${divisionView}`);
    }
    if (viewMode === 'makgora' && makgoraTeamId) {
      return players.filter(p => p.makgora_team_id === makgoraTeamId);
    }
    return players.filter(p => p.teamCategory === activeTeam);
  }, [players, viewMode, divisionView, makgoraTeamId, activeTeam]);
  const filteredPlayers = teamPlayers.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = (
      (p.name || '').toLowerCase().includes(query) ||
      (p.apodo || '').toLowerCase().includes(query) ||
      (p.camiseta != null ? String(p.camiseta) : '').includes(search) ||
      (p.posicion || '').toLowerCase().includes(query)
    );

    const hasMakgora = !!p.makgora_team_id;
    const matchesMakgora =
      makgoraFilter === 'all' ||
      (makgoraFilter === 'assigned' && hasMakgora) ||
      (makgoraFilter === 'unassigned' && !hasMakgora);

    return matchesSearch && matchesMakgora;
  });

  const handleAdd = (playerData) => {
    addPlayer(playerData);
    setShowAddModal(false);
  };

  const handleEdit = (updatedPlayer) => {
    updatePlayer(updatedPlayer);
    setShowEditModal(false);
  };

  const handleTestSubmit = (stats) => {
    const today = new Date().toISOString().split('T')[0];
    recordPhysicalTest(selectedPlayer.id, today, stats);
  };

  const handleInjurySubmit = (diagnosis, weeks) => {
    recordInjury(selectedPlayer.id, diagnosis, weeks);
  };

  const handlePhaseChange = (phase) => {
    updateInjuryPhase(selectedPlayer.id, phase);
  };

  const handleGymSubmit = (gymStats) => {
    updateGymStats(selectedPlayer.id, gymStats);
  };

  const handleClothingSubmit = (sizes) => {
    updateClothingSizes(selectedPlayer.id, sizes);
  };

  const handleHiaSubmit = (symptomsDetected) => {
    runHiaProtocol(selectedPlayer.id, symptomsDetected);
  };

  const handleCredential = async (password) => {
    const result = await createPlayerCredentials(selectedPlayer.id, password);
    if (result.error) {
      showToast(result.error, 'error');
      return null;
    }
    showToast(`Credenciales forjadas! Usuario: ${result.username}`, 'success');
    return result;
  };

  const handleReset = async (newPassword) => {
    const result = await resetPlayerPassword(selectedPlayer.id, newPassword);
    if (result.error) {
      showToast(result.error, 'error');
      return;
    }
    showToast('Contrasena restablecida.', 'success');
  };

  const handleDeleteConfirm = () => {
    deletePlayer(confirmDeleteId);
    setConfirmDeleteId(null);
    setShowDetailModal(false);
  };

  const handlePrint = () => {
    printRoster(players, EQUIPOS_LABELS[activeTeam]);
  };

  const handleToggleBulk = () => {
    if (bulkMode) {
      setBulkMode(false);
      setSelectedPlayerIds(new Set());
      setBulkPositionId(null);
    } else {
      setBulkMode(true);
      setSelectedPlayerIds(new Set());
      setBulkPositionId(null);
    }
  };

  const handleBulkSelect = (playerId) => {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleBulkPositionChange = ({ position_id }) => {
    setBulkPositionId(position_id);
  };

  const handleApplyBulkPosition = async () => {
    if (selectedPlayerIds.size === 0 || !bulkPositionId) return;
    setBulkApplying(true);
    try {
      bulkUpdatePosition(selectedPlayerIds, bulkPositionId, '');
      showToast(`Posicion asignada a ${selectedPlayerIds.size} guerreros.`, 'success');
    } catch (err) {
      showToast('Error al asignar posiciones.', 'error');
    }
    setBulkApplying(false);
    setBulkMode(false);
    setSelectedPlayerIds(new Set());
    setBulkPositionId(null);
  };

  if (syncStatus === 'idle' || syncStatus === 'syncing') {
    return <RosterSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <RosterControls
          search={search}
          onSearchChange={setSearch}
          makgoraFilter={makgoraFilter}
          onMakgoraFilterChange={setMakgoraFilter}
          onAdd={() => setShowAddModal(true)}
          onPrint={handlePrint}
          onToggleBulk={handleToggleBulk}
          bulkMode={bulkMode}
          searchInputRef={searchInputRef}
        />

        {bulkMode && (
          <div className="glass-panel" style={{
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            borderLeft: '3px solid var(--color-primary)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)' }}>
              {selectedPlayerIds.size} seleccionados
            </span>
            <PositionSelect
              value={bulkPositionId}
              onChange={handleBulkPositionChange}
              style={{ minWidth: '200px' }}
            />
            <button
              onClick={handleApplyBulkPosition}
              disabled={selectedPlayerIds.size === 0 || !bulkPositionId || bulkApplying}
              className="btn-neon"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              {bulkApplying ? 'Aplicando...' : `Asignar a ${selectedPlayerIds.size} guerreros`}
            </button>
          </div>
        )}

        {filteredPlayers.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No hay guerreros registrados con ese filtro en esta categoria.
          </div>
        ) : (
          <div className="grid-cards">
            {filteredPlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.6), duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
              <PlayerCard
                key={p.id}
                player={p}
                onClick={(player) => {
                  setSelectedPlayer(player);
                  setShowDetailModal(true);
                }}
                activeLoans={activeLoans}
                makgoraTeams={makgoraTeams}
                bulkMode={bulkMode}
                isSelected={selectedPlayerIds.has(p.id)}
                onSelect={handleBulkSelect}
              />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
      {showAddModal && (
        <AddPlayerModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          makgoraTeams={makgoraTeams}
          SYSTEM_ROLES={SYSTEM_ROLES}
          SYSTEM_ROLES_LABELS={SYSTEM_ROLES_LABELS}
        />
      )}

      {showEditModal && selectedPlayer && (
        <EditPlayerModal
          player={selectedPlayer}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
          makgoraTeams={makgoraTeams}
          SYSTEM_ROLES={SYSTEM_ROLES}
          SYSTEM_ROLES_LABELS={SYSTEM_ROLES_LABELS}
        />
      )}

      {showDetailModal && selectedPlayer && (
        <PlayerDetail
          player={selectedPlayer}
          onClose={() => setShowDetailModal(false)}
          onEdit={(player) => {
            setSelectedPlayer(player);
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
          onDelete={setConfirmDeleteId}
          onTestSubmit={handleTestSubmit}
          onInjurySubmit={handleInjurySubmit}
          onPhaseChange={handlePhaseChange}
          onGymSubmit={handleGymSubmit}
          onClothingSubmit={handleClothingSubmit}
          onHiaSubmit={handleHiaSubmit}
          onCredential={(player) => {
            setSelectedPlayer(player);
            setShowCredentialModal(true);
          }}
          onReset={(player) => {
            setSelectedPlayer(player);
            setShowResetModal(true);
          }}
          hasPermission={hasPermission}
        />
      )}

      {confirmDeleteId && (
        <DeleteConfirmModal
          playerName={players.find(p => p.id === confirmDeleteId)?.name || 'Guerrero'}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {showCredentialModal && selectedPlayer && (
        <CredentialModal
          player={selectedPlayer}
          onClose={() => { setShowCredentialModal(false); }}
          onGenerate={handleCredential}
        />
      )}

      {showResetModal && selectedPlayer && (
        <ResetPasswordModal
          player={selectedPlayer}
          onClose={() => setShowResetModal(false)}
          onReset={handleReset}
        />
      )}
      </AnimatePresence>
    </div>
  );
}

export default Roster;
