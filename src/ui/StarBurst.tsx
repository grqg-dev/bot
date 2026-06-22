import { useEffect, useState } from 'react';
import './StarBurst.css';

interface StarBurstProps {
  active: boolean;
  count?: number;
}

export function StarBurst({ active, count = 5 }: StarBurstProps) {
  const [stars, setStars] = useState<number[]>([]);

  useEffect(() => {
    if (active) {
      setStars(Array.from({ length: count }, (_, i) => i));
    } else {
      setStars([]);
    }
  }, [active, count]);

  if (!active) return null;

  return (
    <div className="star-burst" aria-hidden="true">
      {stars.map((i) => (
        <span
          key={i}
          className="star-burst__star"
          style={{
            '--angle': `${(360 / count) * i}deg`,
            '--delay': `${i * 0.08}s`,
          } as React.CSSProperties}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
