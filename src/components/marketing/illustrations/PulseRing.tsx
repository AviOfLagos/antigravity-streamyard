/* Inline SVG. Consumes design tokens via currentColor — set color on parent
   with `text-brand` / `text-brand-soft` etc. Sized via width/height props. */

type Props = {
  size?: number;
  className?: string;
};

export function PulseRing({ size = 280, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 280 280"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle
        cx="140"
        cy="140"
        r="135"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1"
      />
      <circle
        cx="140"
        cy="140"
        r="110"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
      <circle
        cx="140"
        cy="140"
        r="80"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <circle
        cx="140"
        cy="140"
        r="48"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="140" cy="140" r="14" fill="currentColor" />
      <circle
        cx="140"
        cy="140"
        r="22"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </svg>
  );
}
