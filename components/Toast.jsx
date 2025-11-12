'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: { bg: '#22c55e', text: 'white' },
    error: { bg: '#ef4444', text: 'white' },
    warning: { bg: '#f59e0b', text: 'white' },
    info: { bg: '#3b82f6', text: 'white' }
  };

  const Icon = icons[type];
  const color = colors[type];

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in"
      style={{
        backgroundColor: color.bg,
        color: color.text,
        minWidth: '300px',
        maxWidth: '500px'
      }}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
