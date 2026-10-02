/** Decorative shield crest for the paper documents: original artwork (shield, star, chevron), no lettering. */
export function Crest({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" aria-hidden="true" focusable="false">
      <path d="M50 4 L92 16 V58 C92 88 72 106 50 116 C28 106 8 88 8 58 V16 Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M50 12 L84 22 V58 C84 83 68 98 50 107 C32 98 16 83 16 58 V22 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M50 32 L55.6 47.3 L71.9 47.9 L59.1 58 L63.5 73.6 L50 64.5 L36.5 73.6 L40.9 58 L28.1 47.9 L44.4 47.3 Z" fill="currentColor" />
      <path d="M30 82 L50 93 L70 82" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
