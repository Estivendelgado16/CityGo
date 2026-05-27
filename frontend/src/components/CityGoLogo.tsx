/** Medellín skyline silhouette: mountains + Metrocable + small buildings. */
export function CityGoLogo({ className = "h-5 w-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Back mountains */}
      <path
        d="M2 46 L14 30 L24 40 L34 22 L46 38 L56 28 L62 46 Z"
        fill="currentColor"
        opacity="0.45"
      />
      {/* Front mountains + city */}
      <path
        d="M0 54 L8 42 L14 48 L20 38 L26 46 L30 42 L33 46 L33 34 L37 34 L37 46 L40 46 L40 38 L44 38 L44 46 L52 36 L60 48 L64 44 L64 58 L0 58 Z"
        fill="currentColor"
      />
      {/* Metrocable line + cabin */}
      <path d="M6 16 L58 36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="30" y="22" width="6" height="4" rx="1" fill="currentColor" />
      <path d="M31 22 L33 19 L35 22" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}
