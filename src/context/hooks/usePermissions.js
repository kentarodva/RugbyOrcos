import { useMemo } from 'react';
import { SYSTEM_ROLES, RPG_ROLES } from '../constants';

export function usePermissions(user, profile) {
  const currentUser = user ? { email: user.email, id: user.id } : null;
  const userRole = profile?.system_role || SYSTEM_ROLES.JUGADOR;
  const userTier = RPG_ROLES[userRole]?.tier ?? 4;

  const hasPermission = useMemo(() => {
    return (action) => {
      if (userTier <= 0) return true;
      const permissions = {
        view_all:         ['desarrollador','presidente'],
        create_users:     ['desarrollador','presidente','promotor'],
        manage_players:   ['desarrollador','presidente','promotor','entrenador'],
        manage_finances:  ['desarrollador','presidente','promotor','tesorero'],
        manage_discipline:['desarrollador','presidente','promotor','entrenador','arbitro'],
        manage_training:  ['desarrollador','presidente','promotor','entrenador'],
        manage_schedule:  ['desarrollador','presidente','promotor','entrenador'],
        manage_inventory: ['desarrollador','presidente','promotor','entrenador','tesorero'],
        manage_tactics:   ['desarrollador','presidente','promotor','entrenador'],
        export_import:    ['desarrollador','presidente','promotor'],
        config_ai:        ['desarrollador','presidente'],
        admin_panel:      ['desarrollador','presidente'],
      };
      return (permissions[action] || []).includes(userRole);
    };
  }, [userRole, userTier]);

  const isSuperRole = useMemo(() => userTier <= 1, [userTier]);

  return {
    currentUser,
    userRole,
    userTier,
    hasPermission,
    isSuperRole,
  };
}
