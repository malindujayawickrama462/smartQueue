import React from 'react';

export function Card({ title, subtitle, children, footer }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-600/80 hover:shadow-sky-900/10 hover:-translate-y-0.5 group">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent group-hover:via-sky-400/50 transition-all duration-500" />
      <div className="relative z-10 flex flex-col h-full space-y-6">
        {(title || subtitle) && (
          <div className="space-y-1.5 border-b border-slate-700/50 pb-4">
            {title && <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">{title}</h2>}
            {subtitle && <p className="text-sm font-medium text-slate-500">{subtitle}</p>}
          </div>
        )}
        <div className="space-y-4 flex-1">{children}</div>
        {footer && <div className="border-t border-slate-700/60 pt-5 mt-auto">{footer}</div>}
      </div>
    </div>
  );
}

