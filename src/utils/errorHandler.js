const IS_DEV = typeof import.meta !== 'undefined' && import.meta?.env?.DEV;

export function handleError(error, context = 'App', options = {}) {
  const { silent = false, showToast, toastMessage, rethrow = false } = options;

  if (IS_DEV) {
    console.error(`[${context}]`, error?.message || error);
    if (error?.stack) console.debug(error.stack);
  }

  if (!silent && showToast) {
    const msg = toastMessage || error?.message || 'Error inesperado';
    showToast(msg, 'error');
  }

  if (rethrow) throw error;
  return { error: error?.message || 'Error inesperado' };
}

export function wrapCatch(context, options = {}) {
  return (error) => handleError(error, context, options);
}
