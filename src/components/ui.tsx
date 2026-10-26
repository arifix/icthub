import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Search, X } from "lucide-react";
import { sanitizeHtml } from "../lib/sanitize";

export const PageHeader: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  back?: { to: string; label: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, description, eyebrow, back, actions, children }) => (
  <header className="border-b border-line bg-surface">
    <div className="container-page py-8 sm:py-10">
      {back && (
        <Link
          to={back.to}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-subtle transition hover:text-ink print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-ink-subtle sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">{actions}</div>}
      </div>
      {children}
    </div>
  </header>
);

export const SectionHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}> = ({ title, description, action, icon: Icon }) => (
  <div className="mb-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent-ink">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      )}
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-ink-subtle">{description}</p>}
      </div>
    </div>
    {action}
  </div>
);

export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}> = ({ icon: Icon, title, description, action, compact }) => (
  <div className={`card flex flex-col items-center text-center ${compact ? "px-6 py-10" : "px-6 py-16"}`}>
    <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-ink-subtle">
      <Icon className="h-6 w-6" />
    </span>
    <h3 className="text-base font-semibold text-ink">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-ink-subtle">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{ onRetry?: () => void; message?: string }> = ({
  onRetry,
  message = "We couldn't load this content. Check your connection and try again.",
}) => (
  <div role="alert" className="card flex flex-col items-center px-6 py-12 text-center">
    <h3 className="text-base font-semibold text-ink">Something went wrong</h3>
    <p className="mt-1 max-w-sm text-sm text-ink-subtle">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-secondary mt-5">
        Try again
      </button>
    )}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span aria-hidden className={`skeleton block ${className}`} />
);

export const CardGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
}) => (
  <div className={className} aria-busy="true" aria-label="Loading">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="card space-y-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="card divide-y divide-line" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export const Spinner: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block animate-spin rounded-full border-2 border-accent border-t-transparent ${className}`}
  />
);

export const FullPageLoader: React.FC = () => (
  <div className="grid min-h-screen place-items-center bg-canvas">
    <Spinner className="h-8 w-8" />
  </div>
);

export const SearchField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
}> = ({ value, onChange, placeholder, label, className = "" }) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label ?? placeholder}
      className="field pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);

/** Renders editor HTML after sanitizing it. Never use dangerouslySetInnerHTML directly. */
export const SafeHtml: React.FC<{ html: string | null | undefined; className?: string }> = ({
  html,
  className = "rich-text",
}) => {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
};

export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) => (
  <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={value === option.value}
        onClick={() => onChange(option.value)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          value === option.value ? "bg-surface text-ink shadow-card" : "text-ink-subtle hover:text-ink"
        }`}
      >
        {option.label}
        {option.count !== undefined && <span className="ml-1.5 text-xs text-ink-subtle">{option.count}</span>}
      </button>
    ))}
  </div>
);
