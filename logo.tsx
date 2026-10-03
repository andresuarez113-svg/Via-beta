export function ViaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="28" height="28" rx="8" className="fill-forest" />
      <circle cx="7.5" cy="14" r="2.1" className="fill-surface" />
      <circle cx="20.5" cy="8.5" r="2.1" className="fill-surface" />
      <circle cx="20.5" cy="19.5" r="2.1" className="fill-surface" />
      <path
        d="M9.4 13.2 18.4 9.2M9.4 14.8 18.4 18.8"
        className="stroke-surface"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
