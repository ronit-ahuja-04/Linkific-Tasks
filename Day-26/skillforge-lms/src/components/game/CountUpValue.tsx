import { useEffect, useRef, useState } from 'react';
import { countUp } from '../../lib/count-up';

export interface CountUpValueProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CountUpValue({
  value,
  prefix = '',
  suffix = '',
  duration = 900,
  className,
}: CountUpValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(
    () => typeof window === 'undefined' || typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    const el = ref.current;
    if (!visible || !el) return;
    const from = prevRef.current ?? 0;
    const stop = countUp(el, value, {
      from,
      duration,
      format: (n) => `${prefix}${Math.round(n).toLocaleString('en-US')}${suffix}`,
    });
    prevRef.current = value;
    return stop;
  }, [value, visible, prefix, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}
