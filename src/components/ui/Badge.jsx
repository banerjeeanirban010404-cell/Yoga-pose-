import React from 'react';

export default function Badge({ children, variant = 'info', className = '' }) {
  const styles = {
    beginner: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    intermediate: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    advanced: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  };

  const currentStyle = styles[variant.toLowerCase()] || styles.info;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${currentStyle} ${className}`}>
      {children}
    </span>
  );
}
