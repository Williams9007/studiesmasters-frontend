import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Sparkles } from 'lucide-react';

let toastId = 0;

export const toast = {
  success: (message) => {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', message, id: ++toastId }
    }));
  },
  error: (message) => {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', message, id: ++toastId }
    }));
  },
  info: (message) => {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', message, id: ++toastId }
    }));
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const { type, message, id } = event.detail;
      const newToast = { type, message, id };
      
      setToasts(prev => [...prev, newToast]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 5000);
    };

    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-white" />;
      case 'info':
        return <Info className="h-5 w-5 text-white" />;
      default:
        return <Sparkles className="h-5 w-5 text-white" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-80 p-4 rounded-xl border backdrop-blur-sm transform transition-all duration-500 animate-slide-in ${getStyles(toast.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 pr-2">
              <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}