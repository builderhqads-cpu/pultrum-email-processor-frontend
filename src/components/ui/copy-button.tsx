'use client';

import {useCallback, useState} from 'react';
import {Check, Copy} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

/**
 * Renato 2026-10-05 (QoL): a small reusable "copy to clipboard" button. Shows a
 * brief check state after copying. Use it anywhere a value is worth copying
 * (XML, Response JSON, references). With `label` it renders text + icon; without
 * it, an icon-only button.
 */
export function CopyButton({
  value,
  label,
  copiedLabel,
  size = 'sm',
  variant = 'outline',
  className,
  title
}: {
  value: string | null | undefined;
  label?: string;
  copiedLabel?: string;
  size?: 'sm' | 'icon-sm';
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const text = (value ?? '').toString();
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for insecure contexts / older browsers.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; stay silent (the button simply does nothing).
    }
  }, [value]);

  const iconOnly = !label;

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? 'icon-sm' : size}
      className={cn(iconOnly ? '' : 'gap-2', className)}
      onClick={onCopy}
      disabled={!value}
      title={title ?? label}
      aria-label={title ?? label ?? 'Copy'}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {label ? <span>{copied ? copiedLabel ?? label : label}</span> : null}
    </Button>
  );
}
