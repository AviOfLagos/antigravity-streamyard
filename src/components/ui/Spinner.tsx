interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  label?: string
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "w-3.5 h-3.5 border-[1.5px]",
  md: "w-4 h-4 border-2",
  lg: "w-6 h-6 border-2",
}

/**
 * Inline loading spinner. Uses currentColor for the active arc so it adopts
 * the surrounding text/button color. Respects prefers-reduced-motion.
 */
export default function Spinner({ size = "md", className = "", label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-block rounded-full border-current border-t-transparent motion-safe:animate-spin motion-reduce:opacity-60",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
    />
  )
}
