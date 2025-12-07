import React, { createContext, useContext, useState, useCallback } from "react";
import { BsCheckCircle, BsXCircle, BsInfoCircle, BsExclamationTriangle } from "react-icons/bs";

type ToastType = "success" | "error" | "info" | "warning";
type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  setPosition: (position: ToastPosition) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
}> = ({ children, defaultPosition = "top-right" }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [position, setPosition] = useState<ToastPosition>(defaultPosition);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, setPosition }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} position={position} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Toast Container Component
const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: string) => void;
  position: ToastPosition;
}> = ({ toasts, onRemove, position }) => {
  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "top-20 right-2 sm:right-4 items-end";
      case "top-left":
        return "top-20 left-2 sm:left-4 items-start";
      case "top-center":
        return "top-20 left-1/2 -translate-x-1/2 items-center px-2";
      case "bottom-right":
        return "bottom-2 sm:bottom-4 right-2 sm:right-4 items-end";
      case "bottom-left":
        return "bottom-2 sm:bottom-4 left-2 sm:left-4 items-start";
      case "bottom-center":
        return "bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 items-center px-2";
      default:
        return "top-20 right-2 sm:right-4 items-end";
    }
  };

  const getAnimationClass = () => {
    if (position.includes("right")) return "animate-in slide-in-from-right";
    if (position.includes("left")) return "animate-in slide-in-from-left";
    if (position.includes("center")) return "animate-in fade-in zoom-in-95";
    return "animate-in slide-in-from-right";
  };

  return (
    <div
      className={`fixed z-9999 flex flex-col gap-2 w-full sm:max-w-sm max-w-[calc(100vw-1rem)] pointer-events-none ${getPositionClasses()}`}
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          animationClass={getAnimationClass()}
        />
      ))}
    </div>
  );
};

// Individual Toast Item
const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
  animationClass: string;
}> = ({ toast, onRemove, animationClass }) => {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <BsCheckCircle className="text-green-400 text-base sm:text-lg shrink-0" />;
      case "error":
        return <BsXCircle className="text-red-400 text-base sm:text-lg shrink-0" />;
      case "warning":
        return <BsExclamationTriangle className="text-amber-400 text-base sm:text-lg shrink-0" />;
      case "info":
      default:
        return <BsInfoCircle className="text-bitcoin text-base sm:text-lg shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-green-500/40";
      case "error":
        return "border-red-500/40";
      case "warning":
        return "border-amber-500/40";
      case "info":
      default:
        return "border-bitcoin/40";
    }
  };

  return (
    <div
      className={`pointer-events-auto ${animationClass} duration-300 rounded-lg sm:rounded-xl border ${getBorderColor()} bg-card/95 backdrop-blur-sm px-3 py-2.5 sm:px-4 sm:py-3 shadow-[0_0_30px_rgba(0,0,0,0.7)] flex items-start gap-2 sm:gap-3 w-full`}
    >
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <p className="flex-1 text-xs sm:text-sm text-gray-100 leading-snug wrap-break-words">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-full p-1.5 sm:p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
        aria-label="Close notification"
      >
        <BsXCircle className="text-sm" />
      </button>
    </div>
  );
};
