import { useEffect, useRef, useState } from "react";

// Smooth ease-out count-up for money figures (respects reduced-motion via CSS,
// but we also keep it short so it never feels flashy).
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(target);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    startRef.current = null;
    const from = 0;

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const p = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
