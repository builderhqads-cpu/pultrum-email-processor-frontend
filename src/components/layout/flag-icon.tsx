import {cn} from '@/lib/utils';

/**
 * Small inline SVG country flags for the language switcher. Inline (not emoji)
 * because flag emoji don't render on Windows/Chrome — they fall back to the
 * two-letter code. nl = Netherlands, en = United Kingdom, pt = Brazil (the pt
 * locale is Brazilian Portuguese).
 */
export function FlagIcon({
  code,
  className
}: {
  code: string;
  className?: string;
}) {
  const cls = cn(
    'h-3.5 w-auto shrink-0 rounded-[2px] ring-1 ring-black/10',
    className
  );

  switch (code) {
    case 'nl':
      return (
        <svg className={cls} viewBox="0 0 9 6" aria-hidden="true">
          <rect width="9" height="6" fill="#21468b" />
          <rect width="9" height="4" fill="#fff" />
          <rect width="9" height="2" fill="#ae1c28" />
        </svg>
      );
    case 'en':
      // United States flag (Renato: use the US flag for English).
      return (
        <svg className={cls} viewBox="0 0 76 40" aria-hidden="true">
          <rect width="76" height="40" fill="#fff" />
          <g fill="#b22234">
            <rect y="0" width="76" height="3.08" />
            <rect y="6.15" width="76" height="3.08" />
            <rect y="12.31" width="76" height="3.08" />
            <rect y="18.46" width="76" height="3.08" />
            <rect y="24.62" width="76" height="3.08" />
            <rect y="30.77" width="76" height="3.08" />
            <rect y="36.92" width="76" height="3.08" />
          </g>
          <rect width="30.4" height="21.54" fill="#3c3b6e" />
          <g fill="#fff">
            <circle cx="5" cy="4" r="1.1" />
            <circle cx="12.6" cy="4" r="1.1" />
            <circle cx="20.2" cy="4" r="1.1" />
            <circle cx="27.8" cy="4" r="1.1" />
            <circle cx="8.8" cy="8" r="1.1" />
            <circle cx="16.4" cy="8" r="1.1" />
            <circle cx="24" cy="8" r="1.1" />
            <circle cx="5" cy="12" r="1.1" />
            <circle cx="12.6" cy="12" r="1.1" />
            <circle cx="20.2" cy="12" r="1.1" />
            <circle cx="27.8" cy="12" r="1.1" />
            <circle cx="8.8" cy="16" r="1.1" />
            <circle cx="16.4" cy="16" r="1.1" />
            <circle cx="24" cy="16" r="1.1" />
          </g>
        </svg>
      );
    case 'pt':
      return (
        <svg className={cls} viewBox="0 0 720 504" aria-hidden="true">
          <rect width="720" height="504" fill="#009c3b" />
          <path d="M360,42 L682,252 L360,462 L38,252 Z" fill="#ffdf00" />
          <circle cx="360" cy="252" r="94" fill="#002776" />
        </svg>
      );
    default:
      return null;
  }
}
