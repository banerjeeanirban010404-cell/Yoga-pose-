import React from 'react';

export default function Card({ children, className = '', hover = true, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 ${hover ? 'glass-panel-hover' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
