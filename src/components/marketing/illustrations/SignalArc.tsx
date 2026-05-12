/* Wide arc-on-grid background art. Sits behind section headlines. Consumes
   currentColor; combine with low text-brand opacity or via parent class
   like `text-brand-soft/40`. */

type Props = {
  width?: number;
  className?: string;
};

export function SignalArc({ width = 880, className }: Props) {
  const height = Math.round(width * 0.45);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 880 396"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="signalArcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* faint grid */}
      <g stroke="currentColor" strokeOpacity="0.06" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <line key={`v${i}`} x1={i * 110} y1="0" x2={i * 110} y2="396" />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 99} x2="880" y2={i * 99} />
        ))}
      </g>

      {/* nested arcs */}
      <g
        stroke="url(#signalArcGrad)"
        strokeWidth="1.5"
        fill="none"
      >
        <path d="M 40 320 Q 440 80 840 320" />
        <path d="M 80 320 Q 440 130 800 320" strokeOpacity="0.7" />
        <path d="M 120 320 Q 440 180 760 320" strokeOpacity="0.5" />
        <path d="M 160 320 Q 440 230 720 320" strokeOpacity="0.3" />
      </g>

      {/* anchor dots */}
      <g fill="currentColor">
        <circle cx="40" cy="320" r="3" />
        <circle cx="840" cy="320" r="3" />
        <circle cx="440" cy="80" r="4" />
        <circle cx="440" cy="80" r="10" fillOpacity="0.2" />
      </g>
    </svg>
  );
}
