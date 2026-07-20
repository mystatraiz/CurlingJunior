'use client';

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 transition-colors ' +
  'focus:border-ice-500 focus:outline-none focus:ring-2 focus:ring-ice-500/25 ' +
  'dark:border-night-700 dark:bg-night-850 dark:text-slate-100 dark:placeholder:text-slate-500';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, 'h-10', className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'py-2.5', className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(base, 'h-10 pr-8', className)} {...props} />;
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
