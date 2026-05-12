/* Monoline graphic: single origin node fanning into 4 platform endpoints
   plus a custom RTMP arrow. Stroke uses currentColor; set with `text-brand-soft`. */

type Props = {
  width?: number;
  className?: string;
};

export function MultistreamFan({ width = 520, className }: Props) {
  const height = Math.round(width * 0.55);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 520 286"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* origin node */}
      <circle cx="80" cy="143" r="18" stroke="currentColor" strokeWidth="2" />
      <circle cx="80" cy="143" r="6" fill="currentColor" />

      {/* fan lines */}
      <path
        d="M 98 143 L 420 50"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />
      <path
        d="M 98 143 L 420 110"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />
      <path
        d="M 98 143 L 420 176"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />
      <path
        d="M 98 143 L 420 236"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />

      {/* endpoint nodes */}
      {[50, 110, 176, 236].map((y) => (
        <g key={y}>
          <circle
            cx="420"
            cy={y}
            r="14"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="420" cy={y} r="4" fill="currentColor" />
        </g>
      ))}

      {/* platform labels */}
      <g
        fill="currentColor"
        fillOpacity="0.7"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="11"
        fontWeight="600"
        letterSpacing="1.4"
      >
        <text x="446" y="55">YOUTUBE</text>
        <text x="446" y="115">TWITCH</text>
        <text x="446" y="181">KICK</text>
        <text x="446" y="241">TIKTOK</text>
      </g>

      {/* origin label */}
      <text
        x="80"
        y="180"
        fill="currentColor"
        fillOpacity="0.45"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="10"
        fontWeight="700"
        letterSpacing="2"
        textAnchor="middle"
      >
        ZEROCAST
      </text>
    </svg>
  );
}
