import React from 'react';

export function Card({ title, subtitle, children, footer }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/40 p-6 space-y-6 backdrop-blur">
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
      {footer && <div className="border-t border-slate-800 pt-4">{footer}</div>}
    </div>
  );
}

