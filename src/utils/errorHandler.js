const IS_DEV = typeof import.meta !== 'undefined' && import.meta?.env?.DEV;

export function parseSupabaseError(error) {
  if (!error) return { message: 'Error desconocido', type: 'unknown', retryable: false, raw: error };

  const msg = error.message || error.error_description || 'Error inesperado';
  const code = error.code;

  if (typeof navigator !== 'undefined' && !navigator.onLine)
    return { message: 'Sin conexión a internet.', type: 'offline', retryable: true, raw: error };

  if (msg.includes('Failed to fetch') || code === 'ENOTFOUND')
    return { message: 'El servidor no está disponible. Es posible que el proyecto esté en pausa (hibernación free tier) o que no tengas conexión.', type: 'server_offline', retryable: true, raw: error };

  if (code === 'ECONNREFUSED')
    return { message: 'Conexión rechazada por el servidor. Intenta de nuevo en unos segundos.', type: 'connection_refused', retryable: true, raw: error };

  if (code === 'AbortError' || msg.includes('timed out') || msg.includes('timeout'))
    return { message: 'La conexión tardó demasiado. Revisa tu red o intenta de nuevo.', type: 'timeout', retryable: true, raw: error };

  if (msg === 'Invalid login credentials')
    return { message: 'Usuario o contraseña incorrectos.', type: 'auth', retryable: false, raw: error };

  if (msg.includes('already registered') || msg.includes('already been registered'))
    return { message: 'Este email ya está registrado.', type: 'auth', retryable: false, raw: error };

  if (msg.includes('Email not confirmed'))
    return { message: 'Confirma tu email antes de iniciar sesión.', type: 'auth', retryable: true, raw: error };

  if (msg.includes('expired') || msg.includes('JWT'))
    return { message: 'Tu sesión expiró. Vuelve a iniciar sesión.', type: 'auth', retryable: true, raw: error };

  if (error?.status === 401 || error?.status === 403 || code === '42501')
    return { message: 'No tienes permiso para realizar esta acción.', type: 'permission', retryable: false, raw: error };

  if (code === '23505')
    return { message: 'Este registro ya existe.', type: 'validation', retryable: false, raw: error };

  if (code === '23503')
    return { message: 'No se puede eliminar porque está siendo usado en otra parte.', type: 'validation', retryable: false, raw: error };

  if (code === '23514')
    return { message: 'El dato ingresado no es válido.', type: 'validation', retryable: false, raw: error };

  if (error?.status === 409)
    return { message: 'Conflicto al guardar. Intenta de nuevo.', type: 'conflict', retryable: true, raw: error };

  if (error?.status === 429)
    return { message: 'Demasiadas solicitudes. Espera unos segundos.', type: 'rate_limit', retryable: true, raw: error };

  if (error?.status === 404)
    return { message: 'No encontrado.', type: 'not_found', retryable: false, raw: error };

  if (typeof error === 'string')
    return { message: error, type: 'unknown', retryable: false, raw: error };

  return { message: msg, type: 'unknown', retryable: false, raw: error };
}

export function handleError(error, context = 'App', options = {}) {
  const { silent = false, showToast, toastMessage, rethrow = false, notifyUser = false } = options;

  const parsed = parseSupabaseError(error);

  if (IS_DEV) {
    console.error(`[${context}] ${parsed.type}:`, parsed.message);
    if (error?.stack) console.debug(error.stack);
  }

  if (!silent && showToast) {
    const msg = toastMessage || parsed.message;
    showToast(msg, 'error');
  }

  if (notifyUser) {
    const msg = toastMessage || parsed.message;
    try {
      window.dispatchEvent(new CustomEvent('app:db-error', {
        detail: { message: msg, context, type: parsed.type, retryable: parsed.retryable }
      }));
    } catch { /* fallback si window no existe (testing) */ }
  }

  if (rethrow) throw error;
  return { error: parsed.message, type: parsed.type, retryable: parsed.retryable };
}

export function wrapCatch(context, options = {}) {
  return (error) => handleError(error, context, options);
}
