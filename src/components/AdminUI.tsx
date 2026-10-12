import React from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export const AdminPageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
}) => (
  <header className="admin-page-header bg-white border-b border-slate-200 px-6 py-6">
    <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action && <div className="admin-page-header__action shrink-0">{action}</div>}
    </div>
  </header>
);

type AdminPanelProps = {
  title: string;
  icon?: LucideIcon;
  count?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  title,
  icon: Icon,
  count,
  actions,
  children,
  className = "",
}) => (
  <section className={`admin-panel overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
    <div className="admin-panel__header flex min-h-[62px] flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
      {Icon && <span className="admin-panel__icon grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={17} /></span>}
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {count !== undefined && <span className="admin-panel__count ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{count}</span>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);

type AdminFormSectionProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
};

type AdminStatTileProps = {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  href: string;
  addHref: string;
};

export const AdminStatTile: React.FC<AdminStatTileProps> = ({
  title,
  value,
  icon: Icon,
  href,
  addHref,
}) => (
  <article className="admin-stat-tile rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={19} /></span>
    </div>
    <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs font-semibold">
      <Link to={addHref} className="text-slate-600 transition-colors hover:text-blue-700">Add new</Link>
      <span className="text-slate-300">·</span>
      <Link to={href} className="text-slate-600 transition-colors hover:text-blue-700">View all</Link>
    </div>
  </article>
);

export const AdminTable: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="admin-table-wrap overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
    {children}
  </div>
);

export const AdminFormSection: React.FC<AdminFormSectionProps> = ({
  title,
  description,
  icon: Icon,
  children,
}) => (
  <section className="admin-form-section rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
      {Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={18} /></span>}
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
    </div>
    <div className="px-6 py-6">{children}</div>
  </section>
);
