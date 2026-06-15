import {cn} from '@/lib/utils';

/**
 * Pultrum "P" monogram. Two overlapping P strokes give the layered look of the
 * brand logo. Uses currentColor so it adapts to light/dark.
 */
export function BrandMark({className}: {className?: string}) {
  const path = 'M13 34 V8 h9 a9 9 0 0 1 0 18 h-9';
  return (
    <svg
      viewBox="0 0 44 44"
      className={cn('h-8 w-8', className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={path}
        transform="translate(3 3)"
        className="text-slate-300 dark:text-slate-600"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path}
        className="text-slate-800 dark:text-slate-100"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
