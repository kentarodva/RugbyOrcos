import { useState, useCallback } from 'react';

export function useQueryParams() {
  const getParams = () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const makgora = params.get('makgora') || 'all';
    return { search: q, makgoraFilter: makgora };
  };

  const [params, setParamsState] = useState(getParams);

  const setParams = useCallback(({ search, makgoraFilter }) => {
    const next = { search: search ?? params.search, makgoraFilter: makgoraFilter ?? params.makgoraFilter };
    const sp = new URLSearchParams();
    if (next.search) sp.set('q', next.search);
    if (next.makgoraFilter !== 'all') sp.set('makgora', next.makgoraFilter);
    const qs = sp.toString();
    const newUrl = qs ? window.location.pathname + '?' + qs : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
    setParamsState(next);
  }, [params]);

  return [params, setParams];
}
