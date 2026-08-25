

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col space-y-2 max-w-sm w-full dir-rtl" dir="rtl">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg border text-white font-medium text-sm transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' :
            toast.type === 'error' ? 'bg-rose-600 border-rose-500' :
            'bg-indigo-600 border-indigo-500'
          }`}
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            {toast.type === 'success' && <span className="text-lg">✅</span>}
            {toast.type === 'error' && <span className="text-lg">⚠️</span>}
            {toast.type === 'info' && <span className="text-lg">ℹ️</span>}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="mr-3 text-white/80 hover:text-white font-bold text-base focus:outline-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
