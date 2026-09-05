import { useEffect, useRef, useState } from 'react';

export function useIntegritySignals(active) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [awayMs, setAwayMs] = useState(0);

  const eventsRef = useRef([]);
  const awayStartRef = useRef(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      eventsRef.current = [];
      awayStartRef.current = null;
      setTabSwitchCount(0);
      setAwayMs(0);
    }
  }, [active]);

  useEffect(() => {
    const markAway = (type) => {
      if (!activeRef.current) return;
      if (awayStartRef.current !== null) return; // already away, ignore dupes
      awayStartRef.current = Date.now();
      eventsRef.current.push({ type, at: Date.now() });
      setTabSwitchCount((c) => c + 1);
    };

    const markBack = (type) => {
      if (!activeRef.current) return;
      if (awayStartRef.current === null) return;
      const delta = Date.now() - awayStartRef.current;
      awayStartRef.current = null;
      eventsRef.current.push({ type, at: Date.now(), durationMs: delta });
      setAwayMs((ms) => ms + delta);
    };

    const onVisibility = () => {
      if (document.hidden) markAway('visibility-hidden');
      else markBack('visibility-visible');
    };
    const onBlur = () => markAway('window-blur');
    const onFocus = () => markBack('window-focus');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { tabSwitchCount, awayMs, events: eventsRef.current };
}