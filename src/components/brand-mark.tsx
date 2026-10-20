export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="brand-mark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5A54E6" />
          <stop offset="0.55" stopColor="#453FC1" />
          <stop offset="1" stopColor="#B075FF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#brand-mark-gradient)" />
      <path
        d="M8.5 12.5v-2.5a1.5 1.5 0 0 1 1.5-1.5h2.5M19.5 8.5H22a1.5 1.5 0 0 1 1.5 1.5v2.5M23.5 19.5V22a1.5 1.5 0 0 1-1.5 1.5h-2.5M12.5 23.5H10A1.5 1.5 0 0 1 8.5 22v-2.5"
        fill="none"
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m12.4 16.3 2.5 2.5 4.8-5.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
