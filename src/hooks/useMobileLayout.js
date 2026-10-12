import { useEffect, useState } from 'react';

// Zoomed desktop windows keep their fixed composition; touch phones can reflow.
const query = '(pointer: coarse) and (max-width: 760px)';

export function useMobileLayout() {
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return mobile;
}
