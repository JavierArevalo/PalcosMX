/**
 * Shared page heading for app pages — gold eyebrow + serif title, matching
 * the landing sections' visual language.
 */
export default function PageHeading({
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-4 mb-3">
        <div className="gold-divider" />
        <span
          className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {eyebrow}
        </span>
      </div>
      <h1
        className="text-4xl sm:text-5xl font-bold text-white leading-tight"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {title}
        {accent && <span className="text-gold-gradient italic"> {accent}</span>}
      </h1>
      {subtitle && (
        <p
          className="text-[oklch(0.58_0.010_260)] mt-3 max-w-2xl"
          style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
