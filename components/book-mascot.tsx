import { cn } from "@/lib/utils";

type Mood = "happy" | "read" | "wow";

export function BookMascot({
  mood = "happy",
  className,
  size = 96,
}: {
  mood?: Mood;
  className?: string;
  size?: number;
}) {
  const mouth =
    mood === "wow"
      ? "M 44 70 a 6 7 0 1 0 12 0 a 6 7 0 1 0 -12 0"
      : mood === "read"
        ? "M 46 70 h 12"
        : "M 42 68 q 8 10 16 0";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Folio, la mascota libro"
    >
      <ellipse cx="50" cy="102" rx="22" ry="5" fill="#1E4B8E" opacity="0.15" />
      <path d="M18 86 q4 10 14 8" fill="#C41E3A" />
      <path d="M82 86 q-4 10 -14 8" fill="#1E4B8E" />
      <path
        d="M22 18 h28 v70 H26 c-4 0-6-3-6-7 V24 c0-4 2-6 2-6z"
        fill="#C41E3A"
      />
      <path
        d="M50 18 h28 c0 0 2 2 2 6 v57 c0 4-2 7-6 7 H50 z"
        fill="#1E4B8E"
      />
      <path d="M26 24 h20 v58 H28 c-2 0-2-2-2-3 V26 c0-1 0-2 0-2z" fill="#fff" />
      <path d="M54 24 h18 v56 c0 2 0 3-2 3 H54 z" fill="#F4F7FF" />
      <rect x="48.5" y="18" width="3" height="70" fill="#F2C14E" />
      <circle cx="36" cy="48" r="4.5" fill="#1A1A1A" />
      <circle cx="64" cy="48" r="4.5" fill="#1A1A1A" />
      <circle cx="37.5" cy="46.5" r="1.4" fill="#fff" />
      <circle cx="65.5" cy="46.5" r="1.4" fill="#fff" />
      <path d={mouth} fill="none" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" />
      {mood === "read" ? (
        <path d="M30 58 h12 M58 58 h12" stroke="#1A1A1A" strokeWidth="2" />
      ) : null}
      <circle cx="30" cy="62" r="3" fill="#F7B0B8" opacity="0.8" />
      <circle cx="70" cy="62" r="3" fill="#F7B0B8" opacity="0.8" />
    </svg>
  );
}
