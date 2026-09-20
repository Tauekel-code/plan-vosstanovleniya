import { useEffect, useRef, type CSSProperties } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format: (v: number) => string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Springs from the previous number to the next whenever `value` changes —
 * this is what makes the sliders feel alive: every recalculation visibly
 * counts up/down instead of snapping.
 */
export function AnimatedNumber({ value, format, className, style }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 140, damping: 22, mass: 0.6 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return spring.on('change', (latest) => {
      if (ref.current) ref.current.textContent = format(latest);
    });
  }, [spring, format]);

  return (
    <span ref={ref} className={className} style={style}>
      {format(value)}
    </span>
  );
}
