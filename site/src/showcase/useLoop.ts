// Steps a scripted demo through its frames, then starts again. Stops while the demo is off screen or the
// tab is hidden, and holds the first frame for people who ask for reduced motion.
import { useEffect, useRef, useState } from 'react';

export function useLoop<T extends HTMLElement>(durations: number[]) {
  const ref = useRef<T>(null);
  const [step, setStep] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = window.setTimeout(() => {
      if (!document.hidden) setStep((s) => (s + 1) % durations.length);
    }, durations[step]);
    return () => window.clearTimeout(t);
  }, [live, step, durations]);

  return { ref, step };
}
