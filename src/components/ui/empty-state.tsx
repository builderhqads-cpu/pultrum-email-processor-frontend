'use client';

import type {ComponentType, ReactNode} from 'react';
import {Inbox} from 'lucide-react';

import {cn} from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{className?: string}>;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center',
        className
      )}
    >
      <div className="mb-3 rounded-full border bg-background p-3 text-muted-foreground shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description ? (
        <div className="mt-1 max-w-md text-sm text-muted-foreground">{description}</div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
