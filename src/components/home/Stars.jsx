import { useId } from 'react';

const STAR_PATH = 'm12 2 3.1 6.6 6.9.7-5 4.7 1.2 7-6.2-3.2L5.8 21 7 14 2 9.3l6.9-.7z';

// Cinco estrelas para uma nota de 1 a 10 (9 = 4,5 estrelas), com meia estrela.
export default function Stars({ rating, size = 14 }) {
  const base = useId().replace(/:/g, ''); // ids de SVG não podem ter ":"
  const value = rating / 2;

  return (
    <span className="stars" role="img" aria-label={`Nota ${rating} de 10`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, value - index));
        const clipId = `${base}-${index}`;
        return (
          <svg key={index} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path
              d={STAR_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              className="star-outline"
            />
            {fill > 0 && (
              <>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width={24 * fill} height="24" />
                </clipPath>
                <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
              </>
            )}
          </svg>
        );
      })}
    </span>
  );
}