import { useEffect } from 'react';
import { onDataChange } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';

/**
 * useDataListener(table, callback, options?)
 * 
 * Escucha cambios de una tabla específica emitidos por dataService.
 * Opcionalmente muestra un toast cuando se detecta un cambio.
 * 
 * Uso:
 *   useDataListener('event_rsvp', () => loadRsvps());
 *   useDataListener('training_plans', () => refetchPlan(), { toast: 'Plan actualizado' });
 */
export function useDataListener(table, callback, options = {}) {
  const { showToast } = useToast();

  useEffect(() => {
    return onDataChange(table, (detail) => {
      if (options.toast) {
        showToast(options.toast, 'info');
      }
      callback(detail);
    });
  }, [table, callback, options.toast]);
}
