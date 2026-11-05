import { lazy } from 'react';

/**
 * Wraps React.lazy with automatic chunk-load retry and cache busting.
 * When a new deployment occurs on Vercel/hosting and an old hashed JS chunk
 * returns 404, this catches the dynamic import error and reloads the page
 * (at most once per session) to seamlessly fetch the updated bundle.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('chunk_load_force_refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      // Reset recovery flag on successful module load
      window.sessionStorage.setItem('chunk_load_force_refreshed', 'false');
      return component;
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[lazyWithRetry] Module import failed:', error);
      }

      const errorMessage = error?.message || '';
      const isChunkError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('dynamically imported module') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError && !pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('chunk_load_force_refreshed', 'true');
        window.location.reload();
        return new Promise(() => {}); // Suspend while page reloads
      }

      window.sessionStorage.setItem('chunk_load_force_refreshed', 'false');
      throw error;
    }
  });
}
