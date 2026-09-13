import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

const GEORGIAN_GLYPHS = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';

export default function ScrambleText({ text, className, duration = 900, triggerOnView = false }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const shouldRun = triggerOnView ? inView : true;

  useEffect(() => {
    if (!shouldRun) return undefined;
    if (reduce) {
      setDisplay(text);
      return undefined;
    }

    const length = text.length;
    const totalFrames = Math.max(12, Math.round(duration / 40));
    let frame = 0;

    const interval = setInterval(() => {
      frame += 1;
      const revealCount = Math.floor((frame / totalFrames) * length);
      const next = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < revealCount) return ch;
          return GEORGIAN_GLYPHS[Math.floor(Math.random() * GEORGIAN_GLYPHS.length)];
        })
        .join('');

      setDisplay(next);

      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [shouldRun, reduce, text, duration]);

  return (
    <span
      className={className}
      ref={ref}
    >
      {display}
    </span>
  );
}
