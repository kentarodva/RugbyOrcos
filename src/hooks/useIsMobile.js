import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

/** True on phone-width viewports; tracks rotation/resize. */
export function useIsMobile() {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
  const [isMobile, setIsMobile] = useState(get);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  return isMobile;
}
